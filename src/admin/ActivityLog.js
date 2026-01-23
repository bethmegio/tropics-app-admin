// ActivityLog.js - WITHOUT FILTERS & CONTROLS SECTION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  FaHistory, FaUser, FaShoppingBag, FaCalendarAlt, FaBoxOpen,
  FaCog, FaSearch, FaFilter, FaTrash, FaDownload, FaEye,
  FaInfoCircle, FaExclamationTriangle, FaTimesCircle, FaSync, FaPlus,
  FaCheckCircle, FaExclamationCircle, FaUserCircle, FaTimes
} from 'react-icons/fa';

export const logActivity = async (activityData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const activity = {
      user_id: user?.id || null,
      activity_type: activityData.type,
      description: activityData.description,
      ip_address: activityData.ipAddress || null,
      user_agent: activityData.userAgent || navigator.userAgent,
      metadata: activityData.metadata || {},
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert(activity);

    return !error;
  } catch (error) {
    console.error('Error in logActivity:', error);
    return false;
  }
};

export const ActivityTypes = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  ORDER_CREATE: 'order_create',
  ORDER_UPDATE: 'order_update',
  ORDER_DELETE: 'order_delete',
  ORDER_APPROVE: 'order_approve',
  ORDER_REJECT: 'order_reject',
  PRODUCT_CREATE: 'product_create',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  BOOKING_CREATE: 'booking_create',
  BOOKING_UPDATE: 'booking_update',
  BOOKING_DELETE: 'booking_delete',
  BOOKING_CONFIRM: 'booking_confirm',
  BOOKING_CANCEL: 'booking_cancel',
  INVENTORY_UPDATE: 'inventory_update',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  SETTINGS_UPDATE: 'system_settings_update',
  BACKUP_CREATED: 'backup_created',
  REPORT_GENERATED: 'report_generated'
};

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const filterActivities = useCallback(() => {
    let filtered = [...activities];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.description?.toLowerCase().includes(term) ||
        activity.activity_type?.toLowerCase().includes(term) ||
        activity.metadata?.details?.toLowerCase().includes(term) ||
        (activity.user_id && users.find(u => u.id === activity.user_id)?.email?.toLowerCase().includes(term)) ||
        (activity.user_id && users.find(u => u.id === activity.user_id)?.name?.toLowerCase().includes(term))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === typeFilter);
    }

    if (userFilter !== 'all') {
      if (userFilter === 'system') {
        filtered = filtered.filter(activity => !activity.user_id);
      } else {
        filtered = filtered.filter(activity => activity.user_id === userFilter);
      }
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(activity => new Date(activity.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(activity => new Date(activity.created_at) <= toDate);
    }

    setFilteredActivities(filtered);
    setCurrentPage(1);
  }, [activities, searchTerm, typeFilter, userFilter, dateFrom, dateTo, users]);

  useEffect(() => {
    fetchActivities();
    fetchUsers();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [filterActivities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError, count } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(1000);

      if (fetchError) {
        setError(`Error loading activities: ${fetchError.message}`);
        setActivities([]);
        setTotalCount(0);
        return;
      }

      setActivities(data || []);
      setTotalCount(count || (data ? data.length : 0));

    } catch (error) {
      console.error('Unexpected error:', error);
      setError(`Unexpected error: ${error.message}`);
      setActivities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel('activity-logs-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs'
          },
          (payload) => {
            setActivities(prev => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .order('email');

      if (!publicError && publicUsers) {
        const transformedUsers = publicUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.full_name || user.email.split('@')[0]
        }));
        
        setUsers(transformedUsers);
      } else {
        // Fallback to auth users if public.users table doesn't exist
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers) {
          const transformedUsers = authUsers.map(user => ({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown'
          }));
          setUsers(transformedUsers);
        } else {
          // Last resort: get current user
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            setUsers([{
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Unknown'
            }]);
          } else {
            setUsers([]);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const getActivityIcon = (type) => {
    if (!type) return <FaHistory style={{ fontSize: '14px' }} />;
    
    const iconProps = { style: { fontSize: '14px' } };
    
    switch (true) {
      case type.includes('user_'):
        return <FaUser {...iconProps} />;
      case type.includes('order_'):
        return <FaShoppingBag {...iconProps} />;
      case type.includes('booking_'):
        return <FaCalendarAlt {...iconProps} />;
      case type.includes('product_'):
        return <FaBoxOpen {...iconProps} />;
      case type.includes('inventory_') || type.includes('stock_'):
        return <FaBoxOpen {...iconProps} />;
      case type.includes('settings_') || type.includes('backup_'):
        return <FaCog {...iconProps} />;
      case type.includes('report_'):
        return <FaHistory {...iconProps} />;
      default:
        return <FaHistory {...iconProps} />;
    }
  };

  const getSeverityColor = (type) => {
    if (!type) return { background: '#f3f4f6', color: '#6b7280' };
    
    if (type.includes('delete') || type.includes('reject') || type.includes('cancel')) {
      return { background: '#fee2e2', color: '#dc2626' };
    }
    if (type.includes('create') || type.includes('approve') || type.includes('confirm') || type.includes('login')) {
      return { background: '#dcfce7', color: '#16a34a' };
    }
    if (type.includes('update') || type.includes('adjustment')) {
      return { background: '#dbeafe', color: '#2563eb' };
    }
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const getActivityLabel = (type) => {
    if (!type) return 'Unknown';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setUserFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const refreshLogs = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const seedSampleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to generate sample data');
        return;
      }

      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Admin';

      const sampleActivities = [
        {
          user_id: user.id,
          activity_type: 'user_login',
          description: `${userName} logged into the system`,
          ip_address: '192.168.1.100',
          user_agent: navigator.userAgent,
          metadata: { 
            details: 'Successful authentication', 
            browser: 'Chrome/120.0.0.0',
            user_email: user.email,
            timestamp: new Date().toISOString()
          }
        },
        {
          user_id: user.id,
          activity_type: 'order_create',
          description: 'New order #TEST-001 created',
          ip_address: '192.168.1.100',
          user_agent: navigator.userAgent,
          metadata: { 
            details: 'Test order with 2 items',
            order_id: 'TEST-001',
            amount: 99.99,
            items: 2,
            user_email: user.email,
            payment_method: 'Credit Card'
          }
        },
        {
          user_id: null,
          activity_type: 'system_settings_update',
          description: 'System configuration updated',
          ip_address: null,
          user_agent: 'System',
          metadata: { 
            details: 'Updated email notification settings',
            changed_by: user.email,
            settings_changed: ['smtp_server', 'notification_frequency']
          }
        },
        {
          user_id: user.id,
          activity_type: 'product_update',
          description: 'Product "Premium Widget" updated',
          ip_address: '192.168.1.100',
          user_agent: navigator.userAgent,
          metadata: { 
            details: 'Updated product price and description',
            product_id: 'PROD-001',
            old_price: 49.99,
            new_price: 59.99,
            user_email: user.email
          }
        },
        {
          user_id: user.id,
          activity_type: 'booking_confirm',
          description: 'Booking #BK-001 confirmed',
          ip_address: '192.168.1.100',
          user_agent: navigator.userAgent,
          metadata: { 
            details: 'Booking confirmed for client John Doe',
            booking_id: 'BK-001',
            client_email: 'john.doe@example.com',
            booking_date: '2026-01-25',
            amount: 199.99
          }
        }
      ];

      const { error } = await supabase
        .from('activity_logs')
        .insert(sampleActivities);

      if (error) {
        setError(`Error creating sample data: ${error.message}`);
        return;
      }

      await fetchActivities();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredActivities.length === 0) {
      alert('No activities to export');
      return;
    }

    const headers = ['Timestamp', 'Activity Type', 'Description', 'User', 'IP Address', 'Details'];
    const csvData = filteredActivities.map(activity => {
      const user = users.find(u => u.id === activity.user_id);
      return [
        new Date(activity.created_at).toISOString(),
        getActivityLabel(activity.activity_type),
        activity.description || 'N/A',
        user ? `${user.name} (${user.email})` : 'System',
        activity.ip_address || 'N/A',
        activity.metadata?.details || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllLogs = async () => {
    if (!window.confirm('⚠️ ARE YOU SURE?\n\nThis will permanently delete ALL activity logs. This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .gt('id', 0);

      if (error) throw error;
      
      setActivities([]);
      setFilteredActivities([]);
      setTotalCount(0);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert('Error clearing logs: ' + error.message);
    }
  };

  const getActivityTypes = () => {
    const types = [...new Set(activities.map(activity => activity.activity_type).filter(Boolean))];
    return types.sort();
  };

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredActivities.slice(startIndex, startIndex + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredActivities.length / pageSize);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Professional styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '24px'
    },
    header: {
      marginBottom: '32px'
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#64748b',
      margin: 0
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      marginBottom: '24px',
      border: '1px solid #e2e8f0'
    },
    cardHeader: {
      padding: '24px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#334155',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    cardContent: {
      padding: '24px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      minHeight: '40px'
    },
    buttonPrimary: {
      background: '#3b82f6',
      color: 'white'
    },
    buttonSecondary: {
      background: '#e2e8f0',
      color: '#475569'
    },
    buttonSuccess: {
      background: '#10b981',
      color: 'white'
    },
    buttonDanger: {
      background: '#ef4444',
      color: 'white'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1000px'
    },
    tableHeader: {
      background: '#f8fafc',
      borderBottom: '2px solid #e2e8f0'
    },
    tableHeaderCell: {
      padding: '16px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap'
    },
    tableRow: {
      borderBottom: '1px solid #e2e8f0',
      transition: 'background 0.2s'
    },
    tableCell: {
      padding: '16px',
      fontSize: '14px',
      color: '#334155',
      verticalAlign: 'top'
    },
    badge: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '4px'
    },
    activityCell: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    },
    activityIcon: {
      padding: '8px',
      borderRadius: '8px',
      background: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    activityInfo: {
      flex: 1,
      minWidth: 0
    },
    activityTitle: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#334155',
      margin: '0 0 4px 0',
      wordBreak: 'break-word'
    },
    activityDetails: {
      fontSize: '12px',
      color: '#64748b',
      margin: 0,
      wordBreak: 'break-word'
    },
    userCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#e0f2fe',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0369a1',
      fontSize: '14px',
      fontWeight: '600',
      flexShrink: 0
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    },
    userName: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#334155',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    userEmail: {
      fontSize: '12px',
      color: '#64748b',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    emptyState: {
      padding: '48px 24px',
      textAlign: 'center'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#cbd5e1',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#334155',
      margin: '0 0 8px 0'
    },
    emptyText: {
      fontSize: '14px',
      color: '#64748b',
      margin: '0 0 24px 0'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      background: 'white',
      borderRadius: '12px',
      padding: '48px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #e2e8f0',
      borderTop: '3px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px'
    },
    alert: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    },
    errorAlert: {
      background: '#fef2f2',
      border: '1px solid #fecaca'
    },
    successAlert: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0'
    },
    alertIcon: {
      fontSize: '16px',
      marginTop: '2px',
      flexShrink: 0
    },
    errorIcon: {
      color: '#dc2626'
    },
    successIcon: {
      color: '#16a34a'
    },
    alertContent: {
      flex: 1
    },
    alertTitle: {
      fontSize: '14px',
      fontWeight: '600',
      margin: '0 0 4px 0'
    },
    errorTitle: {
      color: '#dc2626'
    },
    successTitle: {
      color: '#166534'
    },
    alertMessage: {
      fontSize: '14px',
      margin: 0
    },
    errorMessage: {
      color: '#991b1b'
    },
    successMessage: {
      color: '#166534'
    },
    metadataItem: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '2px',
      wordBreak: 'break-word'
    },
    ipAddress: {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#334155',
      wordBreak: 'break-all'
    },
    browserInfo: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '2px'
    },
    dateTime: {
      display: 'flex',
      flexDirection: 'column'
    },
    date: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#334155',
      margin: 0
    },
    time: {
      fontSize: '12px',
      color: '#64748b',
      margin: '4px 0 0 0'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderTop: '1px solid #e2e8f0',
      background: '#f8fafc'
    },
    paginationInfo: {
      fontSize: '14px',
      color: '#64748b'
    },
    paginationButtons: {
      display: 'flex',
      gap: '8px'
    },
    paginationButton: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #cbd5e1',
      background: 'white',
      color: '#334155',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    paginationButtonActive: {
      background: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6'
    },
    paginationButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748b' }}>Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          <FaHistory style={{ color: '#3b82f6' }} />
          Activity Log
        </h1>
        <p style={styles.headerSubtitle}>Monitor and track all system activities in real-time</p>
      </div>

      {/* Success Alert */}
      {showSuccess && (
        <div style={{ ...styles.alert, ...styles.successAlert }}>
          <FaCheckCircle style={{ ...styles.alertIcon, ...styles.successIcon }} />
          <div style={styles.alertContent}>
            <h3 style={{ ...styles.alertTitle, ...styles.successTitle }}>Success!</h3>
            <p style={{ ...styles.alertMessage, ...styles.successMessage }}>
              Operation completed successfully
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{ ...styles.alert, ...styles.errorAlert }}>
          <FaExclamationTriangle style={{ ...styles.alertIcon, ...styles.errorIcon }} />
          <div style={styles.alertContent}>
            <h3 style={{ ...styles.alertTitle, ...styles.errorTitle }}>Error</h3>
            <p style={{ ...styles.alertMessage, ...styles.errorMessage }}>{error}</p>
          </div>
        </div>
      )}

      {/* Status Alert */}
      {!error && activities.length > 0 && (
        <div style={{ ...styles.alert, ...styles.successAlert }}>
          <FaCheckCircle style={{ ...styles.alertIcon, ...styles.successIcon }} />
          <div style={styles.alertContent}>
            <p style={{ ...styles.alertMessage, ...styles.successMessage }}>
              ✅ Connected successfully! Found {activities.length} activity logs
            </p>
          </div>
        </div>
      )}

      {/* REMOVED: Entire Filters & Controls Card - This section has been removed */}

      {/* Activity Logs Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              <FaHistory style={{ color: '#64748b' }} />
              Activity Records
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
              Showing {paginatedActivities.length} of {filteredActivities.length} activities
              {totalCount > 0 && ` (Total in database: ${totalCount})`}
            </p>
          </div>
          <div style={styles.buttonGroup}>
            <button
              onClick={refreshLogs}
              disabled={refreshing}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(refreshing ? styles.buttonDisabled : {})
              }}
            >
              <FaSync style={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                fontSize: '14px'
              }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {activities.length === 0 && (
              <button
                onClick={seedSampleData}
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                <FaPlus style={{ fontSize: '14px' }} /> Create Sample Data
              </button>
            )}
            <button
              onClick={clearAllLogs}
              style={{ ...styles.button, ...styles.buttonDanger }}
            >
              <FaTrash style={{ fontSize: '14px' }} /> Clear All Logs
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredActivities.length === 0}
              style={{
                ...styles.button,
                ...styles.buttonSuccess,
                ...(filteredActivities.length === 0 ? styles.buttonDisabled : {})
              }}
            >
              <FaDownload style={{ fontSize: '14px' }} /> Export CSV
            </button>
          </div>
        </div>

        <div style={styles.tableContainer}>
          {paginatedActivities.length === 0 ? (
            <div style={styles.emptyState}>
              {activities.length === 0 ? (
                <>
                  <FaHistory style={styles.emptyIcon} />
                  <h3 style={styles.emptyTitle}>No activity logs found</h3>
                  <p style={styles.emptyText}>Your activity logs table is empty</p>
                  <button
                    onClick={seedSampleData}
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                  >
                    <FaPlus style={{ fontSize: '14px' }} /> Create Sample Activity Data
                  </button>
                </>
              ) : (
                <>
                  <FaSearch style={styles.emptyIcon} />
                  <h3 style={styles.emptyTitle}>No activities match your filters</h3>
                  <p style={styles.emptyText}>Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                  >
                    Clear All Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Time</th>
                    <th style={styles.tableHeaderCell}>User</th>
                    <th style={styles.tableHeaderCell}>Activity</th>
                    <th style={styles.tableHeaderCell}>Details</th>
                    <th style={styles.tableHeaderCell}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedActivities.map((activity) => {
                    const userInfo = users.find(u => u.id === activity.user_id);
                    const severityColors = getSeverityColor(activity.activity_type);
                    
                    return (
                      <tr 
                        key={activity.id} 
                        style={styles.tableRow}
                        onClick={() => setSelectedActivity(activity)}
                      >
                        {/* Time Column */}
                        <td style={styles.tableCell}>
                          <div style={styles.dateTime}>
                            <div style={styles.date}>
                              {new Date(activity.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div style={styles.time}>
                              {new Date(activity.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>

                        {/* User Column */}
                        <td style={styles.tableCell}>
                          <div style={styles.userCell}>
                            <div style={styles.userAvatar}>
                              {activity.user_id ? (
                                <FaUserCircle />
                              ) : (
                                <FaCog />
                              )}
                            </div>
                            <div style={styles.userInfo}>
                              <div style={styles.userName}>
                                {userInfo?.name || (activity.user_id ? 'User' : 'System')}
                              </div>
                              <div style={styles.userEmail}>
                                {userInfo?.email || (activity.user_id ? `ID: ${activity.user_id.substring(0, 8)}...` : 'Automated System')}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Activity Column */}
                        <td style={styles.tableCell}>
                          <div style={styles.activityCell}>
                            <div style={{
                              ...styles.activityIcon,
                              background: severityColors.background,
                              color: severityColors.color
                            }}>
                              {getActivityIcon(activity.activity_type)}
                            </div>
                            <div style={styles.activityInfo}>
                              <span style={{
                                ...styles.badge,
                                background: severityColors.background,
                                color: severityColors.color
                              }}>
                                {getActivityLabel(activity.activity_type)}
                              </span>
                              <p style={styles.activityTitle}>
                                {activity.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Details Column */}
                        <td style={styles.tableCell}>
                          <div style={styles.activityDetails}>
                            {activity.metadata?.details || 'No additional details'}
                          </div>
                          {activity.metadata && (
                            <div style={{ marginTop: '8px' }}>
                              {Object.entries(activity.metadata)
                                .filter(([key]) => key !== 'details')
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <div key={key} style={styles.metadataItem}>
                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                                  </div>
                                ))}
                            </div>
                          )}
                        </td>

                        {/* IP Address Column */}
                        <td style={styles.tableCell}>
                          <div style={styles.ipAddress}>
                            {activity.ip_address || 'N/A'}
                          </div>
                          {activity.user_agent && activity.user_agent !== 'System' && (
                            <div style={styles.browserInfo}>
                              {activity.user_agent.split('/')[0]}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <div style={styles.paginationInfo}>
                    Page {currentPage} of {totalPages} • Showing {paginatedActivities.length} items
                  </div>
                  <div style={styles.paginationButtons}>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
                      }}
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
                      }}
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            ...styles.paginationButton,
                            ...(currentPage === pageNum ? styles.paginationButtonActive : {})
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
                      }}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
                      }}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                Activity Details
              </h3>
              <button
                onClick={() => setSelectedActivity(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: getSeverityColor(selectedActivity.activity_type).background,
                  color: getSeverityColor(selectedActivity.activity_type).color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getActivityIcon(selectedActivity.activity_type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    ...styles.badge,
                    background: getSeverityColor(selectedActivity.activity_type).background,
                    color: getSeverityColor(selectedActivity.activity_type).color,
                    marginBottom: '4px'
                  }}>
                    {getActivityLabel(selectedActivity.activity_type)}
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '500', color: '#334155', margin: 0 }}>
                    {selectedActivity.description}
                  </p>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Timestamp</div>
                    <div style={{ fontSize: '14px', color: '#334155' }}>
                      {new Date(selectedActivity.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Activity ID</div>
                    <div style={{ fontSize: '14px', color: '#334155', fontFamily: 'monospace' }}>
                      {selectedActivity.id?.substring(0, 8)}...
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>IP Address</div>
                    <div style={{ fontSize: '14px', color: '#334155', fontFamily: 'monospace' }}>
                      {selectedActivity.ip_address || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Browser/Agent</div>
                    <div style={{ fontSize: '14px', color: '#334155' }}>
                      {selectedActivity.user_agent || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: '0 0 12px 0' }}>
                    Metadata
                  </h4>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <pre style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      lineHeight: '1.5'
                    }}>
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input:focus, select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          button:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          button:not(:disabled):active {
            transform: translateY(0);
          }
          
          tbody tr {
            cursor: pointer;
          }
          
          tbody tr:hover {
            background: #f8fafc !important;
          }
        `}
      </style>
    </div>
  );
};

export default ActivityLog;