// UserSystemManagement.js - React Web Version with Auto-Sync
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { FaUser, FaSearch, FaTrash, FaEdit, FaSync, FaEye, FaEyeSlash, FaPlus, FaCalendar, FaCircle, FaTimes, FaUserPlus, FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaDatabase } from 'react-icons/fa';

const UserSystemManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    role: 'user'
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSynced: null,
    syncedCount: 0
  });

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    console.log('Fetching current user...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', user?.email);

      if (authError || !user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Check if user exists in users table
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setCurrentUser({
          ...user,
          is_admin: userData.is_admin || false,
          role: userData.role || 'user',
          full_name: userData.full_name || user.user_metadata?.full_name || user.email
        });
      } else {
        setCurrentUser({
          ...user,
          is_admin: false,
          role: 'user',
          full_name: user.user_metadata?.full_name || user.email
        });
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError('Failed to load user information.');
      setLoading(false);
    }
  }, []);

  // Check if users table exists and has data
  const checkUsersTable = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          console.log('Users table does not exist');
          return { exists: false, hasData: false };
        }
        throw error;
      }

      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      return { exists: true, hasData: count > 0 };
    } catch (err) {
      console.error('Error checking users table:', err);
      return { exists: false, hasData: false };
    }
  };

  // Auto-sync users from auth to database on page load
  const autoSyncUsers = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      console.log('🔄 Auto-syncing users from auth...');

      // Check table status
      const tableStatus = await checkUsersTable();
      
      // If table doesn't exist, show error
      if (!tableStatus.exists) {
        setError('Users table does not exist. Please create it first.');
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
        return;
      }

      // Get all auth users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        setError(`Cannot fetch users: ${authError.message}`);
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
        return;
      }
      
      if (!authData?.users || authData.users.length === 0) {
        console.log('No users found in authentication');
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
        return;
      }
      
      console.log(`Found ${authData.users.length} users in auth`);
      
      // Sync each user to database
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const authUser of authData.users) {
        try {
          const userData = {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            username: authUser.user_metadata?.username || null,
            is_admin: false,
            is_active: !authUser.banned_at,
            role: 'user',
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          };
          
          // Upsert user (insert or update if exists)
          const { error: upsertError } = await supabase
            .from('users')
            .upsert(userData, { onConflict: 'id' });
          
          if (upsertError) {
            console.error(`Failed to sync user ${authUser.email}:`, upsertError);
            failedCount++;
          } else {
            syncedCount++;
          }
        } catch (userError) {
          console.error(`Error with user ${authUser.email}:`, userError);
          failedCount++;
        }
      }
      
      console.log(`✅ Auto-synced ${syncedCount} users, ${failedCount} failed`);
      
      setSyncStatus({
        isSyncing: false,
        lastSynced: new Date(),
        syncedCount
      });
      
      // If table exists but has no data, show success message
      if (tableStatus.exists && !tableStatus.hasData && syncedCount > 0) {
        console.log(`✅ Populated users table with ${syncedCount} users from auth`);
      }
      
      return syncedCount;
      
    } catch (err) {
      console.error('❌ Auto-sync error:', err);
      setError(`Auto-sync failed: ${err.message}`);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      return 0;
    }
  };

  // Manual sync function
  const manualSyncUsers = async () => {
    try {
      setLoading(true);
      const syncedCount = await autoSyncUsers();
      
      if (syncedCount > 0) {
        alert(`✅ Synced ${syncedCount} users from authentication!`);
      }
      
      // Refresh users list
      await fetchUsers();
      
    } catch (err) {
      console.error('Error in manual sync:', err);
      alert(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from database
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    console.log('Fetching users...');
    try {
      if (forceRefresh) {
        setLoading(true);
      }
      
      setError(null);

      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Database error:', fetchError);
        
        // If table doesn't exist or is empty, trigger auto-sync
        if (fetchError.message?.includes('does not exist') || fetchError.message?.includes('permission denied')) {
          setError('Users table not found or permission denied.');
          
          // Try to auto-sync
          if (!syncStatus.isSyncing) {
            await autoSyncUsers();
            // Retry fetching after sync
            if (!showInactive) {
              await fetchUsers(true);
            }
          }
        } else {
          setError(`Failed to load users: ${fetchError.message}`);
        }
        
        setUsers([]);
        return;
      }
      
      console.log(`Found ${data?.length || 0} users`);
      
      // If no users found and we haven't synced yet, trigger auto-sync
      if ((!data || data.length === 0) && !syncStatus.isSyncing && !syncStatus.lastSynced) {
        console.log('No users found, triggering auto-sync...');
        await autoSyncUsers();
        // Retry fetching
        const { data: newData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
          
        data = newData;
      }
      
      // Transform the data
      const transformedUsers = (data || []).map(user => ({
        id: user.uid || user.id,
        email: user.email || '',
        full_name: user.display_name || user.full_name || '',
        username: user.username || '',
        phone: user.phone || '',
        role: user.role || 'user',
        is_admin: user.is_admin || user.system_management === true,
        is_active: user.is_active !== false,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      
      setUsers(transformedUsers);
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Error: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showInactive, syncStatus]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const initializeUserManagement = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch current user
        await fetchCurrentUser();
        
        // 2. Check users table status
        const tableStatus = await checkUsersTable();
        
        if (!tableStatus.exists) {
          setError('Users table does not exist. Please create it first.');
          setLoading(false);
          return;
        }
        
        // 3. If table exists but has no data, auto-sync
        if (tableStatus.exists && !tableStatus.hasData) {
          console.log('Table exists but empty, auto-syncing...');
          await autoSyncUsers();
        }
        
        // 4. Fetch users
        await fetchUsers();
        
        // 5. If still no users, try one more sync
        if (users.length === 0 && !syncStatus.lastSynced) {
          console.log('Still no users after initial fetch, re-syncing...');
          await autoSyncUsers();
          await fetchUsers();
        }
        
      } catch (err) {
        console.error('Initialization error:', err);
        setError(`Initialization failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initializeUserManagement();
  }, []);

  useEffect(() => {
    if (currentUser && !syncStatus.isSyncing) {
      fetchUsers();
    }
  }, [fetchUsers, currentUser, syncStatus.isSyncing]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userToDelete.id);

      if (updateError) throw updateError;

      setUsers(users.map(user =>
        user.id === userToDelete.id ? { ...user, is_active: false } : user
      ));

      setShowDeleteConfirm(false);
      setUserToDelete(null);
      alert('User deactivated successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to deactivate user');
    }
  };

  const restoreUser = async (userId) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: true } : user
      ));
      
      alert('User restored successfully');
    } catch (err) {
      console.error('Error restoring user:', err);
      alert('Failed to restore user');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: newRole,
          is_admin: newRole === 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole, is_admin: newRole === 'admin' } : user
      ));

      alert('User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  const createUser = async () => {
    try {
      setError(null);

      if (!newUser.email || !newUser.password || !newUser.full_name) {
        setError('Email, password, and full name are required');
        return;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            username: newUser.username
          }
        }
      });

      if (authError) throw authError;

      // Create user in users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.full_name,
          username: newUser.username || null,
          role: newUser.role,
          is_admin: newUser.role === 'admin',
          is_active: true,
        });

      if (userError) throw userError;

      // Reset form
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        username: '',
        role: 'user'
      });
      setShowAddUser(false);

      // Refresh list
      fetchUsers();

      alert('User created successfully!');
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Error creating user');
    }
  };

  // Render user item
  const renderUserItem = (user) => (
    <div key={user.id} className={`user-card ${!user.is_active ? 'inactive' : ''}`}>
      <div className="user-header">
        <div className="avatar">
          {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="user-info">
          <div className="user-name">{user.full_name || 'No Name'}</div>
          <div className="user-email">{user.email}</div>
          {user.username && (
            <div className="username">@{user.username}</div>
          )}
        </div>
      </div>

      <div className="user-details">
        <div className="detail-row">
          <FaCircle size={12} color={user.is_active ? '#10b981' : '#ef4444'} />
          <span className="detail-text">
            {user.is_active ? ' Active' : ' Inactive'}
          </span>
        </div>
        
        <div className="detail-row">
          <FaUser size={12} color="#6b7280" />
          <span className="detail-text"> {user.role || 'user'}</span>
        </div>
        
        <div className="detail-row">
          <FaCalendar size={12} color="#6b7280" />
          <span className="detail-text">
            {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="action-button edit-button"
          onClick={() => {
            setSelectedUser(user);
            setIsModalOpen(true);
          }}
        >
          <FaEdit size={16} color="white" />
        </button>

        {user.is_active && user.id !== currentUser?.id ? (
          <button
            className="action-button delete-button"
            onClick={() => handleDelete(user)}
          >
            <FaTrash size={16} color="white" />
          </button>
        ) : !user.is_active ? (
          <button
            className="action-button restore-button"
            onClick={() => restoreUser(user.id)}
          >
            Restore
          </button>
        ) : (
          <button
            className="action-button delete-button-disabled"
            disabled
          >
            <FaTrash size={16} color="white" />
          </button>
        )}

        {currentUser?.id !== user.id && (
          <div className="role-select-container">
            <span className="role-label">Role:</span>
            <div className="role-buttons">
              {['user', 'admin', 'moderator'].map((role) => (
                <button
                  key={role}
                  className={`role-button ${user.role === role ? 'active' : ''}`}
                  onClick={() => updateUserRole(user.id, role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Styles
  const styles = {
    container: {
      background: 'white',
      padding: '30px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      minHeight: 'calc(100vh - 60px)',
    },
    header: {
      marginBottom: '30px',
    },
    title: {
      fontSize: '32px',
      color: '#023e8a',
      margin: '0 0 8px 0',
      fontWeight: '700',
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0 0 16px 0',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px',
    },
    loadingText: {
      marginTop: '10px',
      fontSize: '16px',
      color: '#6b7280',
    },
    syncStatus: {
      background: '#f0f9ff',
      padding: '10px 15px',
      borderRadius: '8px',
      border: '1px solid #bae6fd',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    syncStatusText: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#0369a1',
    },
    errorContainer: {
      background: '#fee2e2',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #fca5a5',
      marginBottom: '20px',
    },
    errorText: {
      color: '#dc2626',
      fontSize: '14px',
      marginBottom: '10px',
    },
    syncButton: {
      background: '#10b981',
      color: 'white',
      border: 'none',
      padding: '10px 15px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '600',
    },
    toolbar: {
      background: '#f8fafc',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e5e7eb',
    },
    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '0 12px',
      marginBottom: '15px',
    },
    searchIcon: {
      color: '#6b7280',
      marginRight: '10px',
    },
    searchInput: {
      flex: 1,
      padding: '12px 0',
      fontSize: '16px',
      color: '#374151',
      border: 'none',
      background: 'transparent',
      outline: 'none',
    },
    toolbarActions: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    refreshButton: {
      background: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '10px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '40px',
    },
    filterButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 15px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      background: 'white',
      cursor: 'pointer',
      color: '#6b7280',
    },
    filterButtonActive: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 15px',
      borderRadius: '6px',
      border: '1px solid #0077b6',
      background: '#e0f2fe',
      cursor: 'pointer',
      color: '#0077b6',
    },
    addButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#0077b6',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
    },
    userGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6b7280',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'hidden',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
    },
    modalContent: {
      padding: '20px',
      maxHeight: '50vh',
      overflowY: 'auto',
    },
    detailItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #f3f4f6',
    },
    detailLabel: {
      fontWeight: '600',
      color: '#374151',
    },
    detailValue: {
      color: '#6b7280',
    },
    modalActions: {
      padding: '20px',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'right',
    },
  };

  if (loading && !refreshing) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #0077b6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
        <div style={styles.loadingText}>
          {syncStatus.isSyncing ? 'Syncing users from authentication...' : 'Loading users...'}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={styles.loadingContainer}>
        <FaTimes size={50} color="#ef4444" />
        <h2 style={{ color: '#ef4444', margin: '20px 0' }}>Access Denied</h2>
        <p>You need to be logged in to access user management.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        <div style={styles.subtitle}>
          {users.length} total users ({users.filter(u => u.is_active).length} active)
          {syncStatus.lastSynced && (
            <span style={{ fontSize: '12px', color: '#10b981', marginLeft: '10px' }}>
              <FaCheckCircle size={12} style={{ marginRight: '4px' }} />
              Last synced: {syncStatus.lastSynced.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {syncStatus.isSyncing && (
          <div style={styles.syncStatus}>
            <div style={styles.syncStatusText}>
              <FaSync className="spinning" size={16} />
              Syncing users from authentication...
            </div>
            <div style={{ fontSize: '12px', color: '#0369a1' }}>
              This may take a moment
            </div>
          </div>
        )}
        
        {currentUser && (
          <div style={{
            background: '#f8fafc',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginTop: '10px',
          }}>
            <div style={{ color: '#374151', marginBottom: '5px' }}>
              <strong>Logged in as:</strong> {currentUser.full_name}
            </div>
            <div style={{ color: '#374151' }}>
              <strong>Role:</strong> {currentUser.role} {currentUser.is_admin ? '(Admin)' : ''}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>
            <FaExclamationTriangle style={{ marginRight: '8px' }} />
            {error}
          </div>
          <button
            style={styles.syncButton}
            onClick={manualSyncUsers}
            disabled={syncStatus.isSyncing}
          >
            {syncStatus.isSyncing ? (
              <>
                <FaSync className="spinning" />
                Syncing...
              </>
            ) : (
              <>
                <FaSync /> Sync from Auth
              </>
            )}
          </button>
        </div>
      )}

      <div style={styles.toolbar}>
        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.toolbarActions}>
          <button
            style={styles.refreshButton}
            onClick={() => fetchUsers(true)}
            disabled={loading || syncStatus.isSyncing}
          >
            <FaSync className={loading ? 'spinning' : ''} />
          </button>

          <button
            style={showInactive ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setShowInactive(!showInactive)}
            disabled={syncStatus.isSyncing}
          >
            {showInactive ? <FaEyeSlash /> : <FaEye />}
            {showInactive ? ' Hide' : ' Show'} Inactive
          </button>

          <button
            style={{
              ...styles.addButton,
              opacity: syncStatus.isSyncing ? 0.5 : 1,
              cursor: syncStatus.isSyncing ? 'not-allowed' : 'pointer'
            }}
            onClick={() => setShowAddUser(true)}
            disabled={syncStatus.isSyncing}
          >
            <FaUserPlus /> Add User
          </button>

          <button
            style={{
              ...styles.syncButton,
              background: syncStatus.isSyncing ? '#9ca3af' : '#10b981',
              opacity: syncStatus.isSyncing ? 0.8 : 1,
            }}
            onClick={manualSyncUsers}
            disabled={syncStatus.isSyncing}
          >
            {syncStatus.isSyncing ? (
              <>
                <FaSync className="spinning" />
                Syncing...
              </>
            ) : (
              <>
                <FaDatabase /> Sync Now
              </>
            )}
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div style={styles.emptyState}>
          <FaUser size={50} color="#d1d5db" />
          <h3>No users found</h3>
          <p style={{ marginBottom: '20px' }}>
            {syncStatus.isSyncing ? 'Syncing users...' : 'Click the Sync button to import users from authentication'}
          </p>
          <button
            style={styles.syncButton}
            onClick={manualSyncUsers}
            disabled={syncStatus.isSyncing}
          >
            {syncStatus.isSyncing ? (
              <>
                <FaSync className="spinning" />
                Syncing...
              </>
            ) : (
              <>
                <FaSync /> Sync Users from Auth
              </>
            )}
          </button>
        </div>
      ) : (
        <div style={styles.userGrid}>
          {filteredUsers.map(renderUserItem)}
        </div>
      )}

      {/* User Detail Modal */}
      {isModalOpen && selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Details</h3>
              <button style={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                <FaTimes size={24} />
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#0077b6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  margin: '0 auto 20px'
                }}>
                  {selectedUser.full_name?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Name:</span>
                <span style={styles.detailValue}>{selectedUser.full_name || 'Not provided'}</span>
              </div>
              
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Email:</span>
                <span style={styles.detailValue}>{selectedUser.email}</span>
              </div>
              
              {selectedUser.username && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Username:</span>
                  <span style={styles.detailValue}>{selectedUser.username}</span>
                </div>
              )}
              
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Role:</span>
                <span style={styles.detailValue}>{selectedUser.role || 'User'}</span>
              </div>
              
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Admin:</span>
                <span style={styles.detailValue}>{selectedUser.is_admin ? 'Yes' : 'No'}</span>
              </div>
              
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Status:</span>
                <span style={styles.detailValue}>
                  <FaCircle size={12} color={selectedUser.is_active ? '#10b981' : '#ef4444'} style={{ marginRight: '5px' }} />
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Joined:</span>
                <span style={styles.detailValue}>
                  {new Date(selectedUser.created_at).toLocaleString()}
                </span>
              </div>
              
              {selectedUser.last_sign_in_at && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Last Login:</span>
                  <span style={styles.detailValue}>
                    {new Date(selectedUser.last_sign_in_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div style={styles.modalActions}>
              <button
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>Deactivate User</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to deactivate "{userToDelete?.full_name || userToDelete?.email}"?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={confirmDelete}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div style={styles.modalOverlay}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
          }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New User</h3>
              <button style={styles.closeButton} onClick={() => setShowAddUser(false)}>
                <FaTimes size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {error && (
                <div style={styles.errorContainer}>
                  <div style={styles.errorText}>{error}</div>
                </div>
              )}
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Full Name *
                </label>
                <input
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                  }}
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Email *
                </label>
                <input
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                  }}
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Username (optional)
                </label>
                <input
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                  }}
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Password *
                </label>
                <input
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                  }}
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Role
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['user', 'admin', 'moderator'].map((role) => (
                    <button
                      key={role}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: `1px solid ${newUser.role === role ? '#0077b6' : '#d1d5db'}`,
                        background: newUser.role === role ? '#0077b6' : 'white',
                        color: newUser.role === role ? 'white' : '#6b7280',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setNewUser({...newUser, role})}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
              <button
                style={{
                  flex: 1,
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => setShowAddUser(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  background: '#0077b6',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                onClick={createUser}
                disabled={loading || syncStatus.isSyncing}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .user-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
        }

        .user-card.inactive {
          opacity: 0.7;
          background: #f9fafb;
        }

        .user-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #0077b6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          color: white;
          font-size: 20px;
          font-weight: bold;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .user-email {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .username {
          font-size: 14px;
          color: #9ca3af;
        }

        .user-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 0;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-row {
          display: flex;
          align-items: center;
        }

        .detail-text {
          font-size: 12px;
          color: #6b7280;
          margin-left: 4px;
        }

        .action-buttons {
          display: flex;
          align-items: center;
        }

        .action-button {
          padding: 8px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-button {
          background: #10b981;
          color: white;
        }

        .delete-button {
          background: #ef4444;
          color: white;
        }

        .delete-button-disabled {
          background: #9ca3af;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .restore-button {
          background: #3b82f6;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .role-select-container {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .role-label {
          font-size: 12px;
          color: #6b7280;
          margin-right: 8px;
        }

        .role-buttons {
          display: flex;
        }

        .role-button {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
          background: white;
          margin-right: 4px;
          font-size: 11px;
          color: #6b7280;
          cursor: pointer;
        }

        .role-button.active {
          background: #0077b6;
          border-color: #0077b6;
          color: white;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default UserSystemManagement;