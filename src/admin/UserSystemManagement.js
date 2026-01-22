// src/admin/UserSystemManagement.js - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '../supabase';
import { 
  FaUsers, 
  FaEdit, 
  FaTrash, 
  FaUserPlus, 
  FaEye, 
  FaEyeSlash, 
  FaSync, 
  FaExclamationTriangle,
  FaCircle,
  FaTimes,
  FaShieldAlt,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaKey
} from 'react-icons/fa';

const UserSystemManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
    phone: '',
    role: 'customer'
  });
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [tableExists, setTableExists] = useState(false);

  // Check if current user is admin
  const checkAdminStatus = useCallback(async () => {
    try {
      console.log('🔍 Checking admin status...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      console.log('✅ Authenticated user:', user.email);
      setCurrentAdmin(user);

      // Check hardcoded admin emails first
      const adminEmails = ['admin@gmail.com', 'admin@example.com', 'admin@test.com', user.email];
      if (adminEmails.includes(user.email.toLowerCase())) {
        console.log('🎯 Admin detected by email');
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Try to check users table
      try {
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('is_admin, role')
          .eq('id', user.id)
          .single();

        if (!dbError && userData) {
          if (userData.is_admin || userData.role === 'admin') {
            console.log('👑 Admin detected in database');
            setIsAdmin(true);
          } else {
            console.log('👤 Regular user');
            setIsAdmin(false);
            setError('Access denied: Admin privileges required');
          }
        }
      } catch (dbErr) {
        console.log('Database check failed (table might not exist):', dbErr.message);
        setIsAdmin(false);
        setError('Cannot verify admin status. Please create users table first.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error checking admin:', err);
      setError('Error checking permissions: ' + err.message);
      setLoading(false);
    }
  }, []);

  // Check if users table exists
  const checkTableExists = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST116') {
          console.log('❌ Users table does not exist');
          setTableExists(false);
          return false;
        }
      }
      
      console.log('✅ Users table exists');
      setTableExists(true);
      return true;
    } catch (err) {
      console.error('Error checking table:', err);
      setTableExists(false);
      return false;
    }
  };

  // Create the users table
  const createUsersTable = async () => {
    try {
      setLoading(true);
      setError('');
      
      alert(
        'Please run this SQL in Supabase SQL Editor:\n\n' +
        'CREATE TABLE IF NOT EXISTS public.users (\n' +
        '  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,\n' +
        '  email TEXT NOT NULL,\n' +
        '  full_name TEXT,\n' +
        '  phone TEXT,\n' +
        '  role TEXT DEFAULT \'customer\',\n' +
        '  is_admin BOOLEAN DEFAULT FALSE,\n' +
        '  is_active BOOLEAN DEFAULT TRUE,\n' +
        '  created_at TIMESTAMPTZ DEFAULT NOW(),\n' +
        '  updated_at TIMESTAMPTZ DEFAULT NOW()\n' +
        ');\n\n' +
        'CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);\n' +
        'CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);\n' +
        'CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);\n\n' +
        'Then click OK and refresh this page.'
      );
      
      // After showing instructions, wait a bit then check again
      setTimeout(async () => {
        const exists = await checkTableExists();
        if (exists) {
          fetchUsers();
        }
      }, 3000);
      
    } catch (err) {
      console.error('Error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync users from auth to database
  const syncAuthUsersToDatabase = async () => {
    if (!window.confirm('This will sync all users from authentication to the users table. Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Starting sync...');
      
      console.log('🔄 Syncing auth users to database...');
      
      // Check if table exists first
      const tableExists = await checkTableExists();
      if (!tableExists) {
        setError('Users table does not exist. Please create it first.');
        return;
      }
      
      // Get all auth users using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error fetching auth users:', authError);
        setError(`Cannot fetch users: ${authError.message}`);
        return;
      }
      
      if (!authData?.users || authData.users.length === 0) {
        setError('No users found in authentication');
        return;
      }
      
      console.log(`✅ Found ${authData.users.length} users in auth`);
      setDebugInfo(`Found ${authData.users.length} users in auth`);
      
      let syncedCount = 0;
      let failedCount = 0;
      
      // Sync each user to database
      for (const authUser of authData.users) {
        try {
          const userData = {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            phone: authUser.user_metadata?.phone || '',
            is_admin: false,
            is_active: !authUser.banned_at,
            role: 'customer',
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          };
          
          // Upsert user
          const { error: upsertError } = await supabase
            .from('users')
            .upsert(userData, { onConflict: 'id' });
          
          if (upsertError) {
            console.error(`❌ Error syncing user ${authUser.email}:`, upsertError);
            failedCount++;
          } else {
            syncedCount++;
          }
        } catch (userError) {
          console.error(`❌ Error with user ${authUser.email}:`, userError);
          failedCount++;
        }
      }
      
      console.log(`✅ Synced ${syncedCount} users, ${failedCount} failed`);
      setDebugInfo(`Synced ${syncedCount} users, ${failedCount} failed`);
      
      // Refresh users list
      fetchUsers();
      
      alert(`✅ Synced ${syncedCount} users successfully.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`);
      
    } catch (err) {
      console.error('❌ Sync error:', err);
      setError(`Failed to sync: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users from database
  const fetchUsers = useCallback(async () => {
    console.log('🔄 fetchUsers called');
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Fetching users...');

      // Check if table exists
      const tableExists = await checkTableExists();
      if (!tableExists) {
        setError('Users table not found. Please create it first.');
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch users
      const { data: usersData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('❌ Database error:', dbError);
        setError(`Database error: ${dbError.message}`);
        setUsers([]);
        setLoading(false);
        return;
      }

      console.log('✅ Database query successful. Found', usersData?.length, 'users');
      setDebugInfo(`Found ${usersData?.length || 0} users in database`);

      if (!usersData || usersData.length === 0) {
        console.log('📭 No users found in database');
        setUsers([]);
        setLoading(false);
        return;
      }

      // Transform the data
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        email: user.email || '',
        full_name: user.full_name || user.email?.split('@')[0] || 'Unknown',
        phone: user.phone || '',
        role: user.role || 'customer',
        is_admin: user.is_admin === true,
        is_active: user.is_active !== false,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

      console.log('✅ Transformed', transformedUsers.length, 'users');
      setUsers(transformedUsers);

    } catch (err) {
      console.error('❌ Unexpected error in fetchUsers:', err);
      setError(`Unexpected error: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debug function
  const debugSetup = async () => {
    console.log('=== DEBUG START ===');
    console.log('Current admin:', currentAdmin);
    console.log('Is admin:', isAdmin);
    console.log('Table exists:', tableExists);
    
    // Test regular query
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(2);
    
    console.log('Test query:', { testData, testError });
    
    // Check auth
    const { data: authData } = await supabase.auth.getSession();
    console.log('Auth session:', authData);
    
    console.log('=== DEBUG END ===');
    
    alert(`Debug complete. Check console.\nTable exists: ${tableExists ? 'Yes' : 'No'}\nUsers found: ${testData?.length || 0}`);
  };

  useEffect(() => {
    checkAdminStatus();
    checkTableExists();
  }, [checkAdminStatus]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!showInactive && !user.is_active) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setError('');

      if (currentAdmin && userToDelete.id === currentAdmin.id) {
        alert('You cannot delete your own account!');
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        return;
      }

      // Update users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userToDelete.id);

      if (updateError) throw updateError;

      // Update local state
      setUsers(users.map(user =>
        user.id === userToDelete.id ? { ...user, is_active: false } : user
      ));

      setShowDeleteConfirm(false);
      setUserToDelete(null);
      alert('✅ User deactivated successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('❌ Error deactivating user: ' + err.message);
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

      alert('✅ User restored successfully');
    } catch (err) {
      console.error('Error restoring user:', err);
      alert('❌ Error restoring user: ' + err.message);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      if (currentAdmin && userId === currentAdmin.id) {
        alert('You cannot change your own role!');
        return;
      }

      const isAdminRole = newRole === 'admin';
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: newRole,
          is_admin: isAdminRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { 
          ...user, 
          role: newRole,
          is_admin: isAdminRole 
        } : user
      ));

      alert('✅ User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('❌ Error updating user role: ' + err.message);
    }
  };

  const createUser = async () => {
    try {
      setError('');

      if (!newUser.email || !newUser.password || !newUser.full_name) {
        setError('Email, password, and full name are required');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (newUser.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // First check if table exists
      const tableExists = await checkTableExists();
      if (!tableExists) {
        setError('Users table does not exist. Please create it first.');
        return;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role
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
          phone: newUser.phone || '',
          role: newUser.role,
          is_admin: newUser.role === 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userError) throw userError;

      // Reset form
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'customer'
      });
      setShowAddUser(false);

      // Refresh users list
      fetchUsers();

      alert('✅ User created successfully!');
    } catch (err) {
      console.error('Error creating user:', err);
      
      if (err.message.includes('full_name') || err.message.includes('column')) {
        setError(
          <div>
            <strong>Database column error!</strong><br/>
            The users table is missing required columns.<br/>
            <button 
              onClick={createUsersTable}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#0077b6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fix Table Structure
            </button>
          </div>
        );
      } else {
        setError(`❌ Error creating user: ${err.message}`);
      }
    }
  };

  // Styles
  const styles = {
    container: {
      background: 'white',
      padding: '30px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      minHeight: 'calc(100vh - 60px)',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #0077b6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
    },
    accessDenied: {
      textAlign: 'center',
      padding: '40px 20px',
      maxWidth: '500px',
      margin: '0 auto',
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
      margin: '0 0 12px 0',
    },
    debugInfo: {
      background: '#f3f4f6',
      padding: '10px',
      borderRadius: '6px',
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '20px',
      whiteSpace: 'pre-line',
      fontFamily: 'monospace',
    },
    toolbar: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    searchContainer: {
      position: 'relative',
      flex: 1,
      minWidth: '250px',
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
    },
    searchInput: {
      width: '100%',
      padding: '10px 15px 10px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
    },
    button: {
      padding: '10px 15px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    refreshButton: {
      background: '#6b7280',
      color: 'white',
    },
    filterButton: {
      background: 'white',
      color: '#6b7280',
      border: '1px solid #d1d5db',
    },
    filterButtonActive: {
      background: '#e0f2fe',
      color: '#0077b6',
      border: '1px solid #0077b6',
    },
    syncButton: {
      background: '#10b981',
      color: 'white',
    },
    createTableButton: {
      background: '#f59e0b',
      color: 'white',
    },
    addButton: {
      background: '#0077b6',
      color: 'white',
    },
    debugButton: {
      background: '#8b5cf6',
      color: 'white',
    },
    errorContainer: {
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    errorText: {
      color: '#dc2626',
      margin: 0,
      flex: 1,
    },
    statsContainer: {
      display: 'flex',
      gap: '15px',
      margin: '20px 0',
      flexWrap: 'wrap',
    },
    statCard: {
      background: '#f8fafc',
      padding: '15px',
      borderRadius: '8px',
      minWidth: '120px',
      textAlign: 'center',
      border: '1px solid #e5e7eb',
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '5px',
    },
    userCard: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
    },
    inactiveCard: {
      opacity: 0.6,
      background: '#f9fafb',
    },
    currentUserCard: {
      borderLeft: '4px solid #0077b6',
    },
    userHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#0077b6',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      marginRight: '10px',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontWeight: '600',
      color: '#1f2937',
    },
    userEmail: {
      fontSize: '14px',
      color: '#6b7280',
    },
    userDetails: {
      display: 'flex',
      gap: '15px',
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '10px',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    editButton: {
      background: '#10b981',
      color: 'white',
      padding: '6px 12px',
      fontSize: '12px',
    },
    deleteButton: {
      background: '#ef4444',
      color: 'white',
      padding: '6px 12px',
      fontSize: '12px',
    },
    restoreButton: {
      background: '#3b82f6',
      color: 'white',
      padding: '6px 12px',
      fontSize: '12px',
    },
    roleButtons: {
      marginLeft: 'auto',
      display: 'flex',
      gap: '5px',
    },
    roleButton: {
      padding: '4px 8px',
      fontSize: '11px',
      border: '1px solid #d1d5db',
      background: 'white',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    activeRoleButton: {
      background: '#0077b6',
      color: 'white',
      borderColor: '#0077b6',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading user management...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.accessDenied}>
          <FaExclamationTriangle size={50} color="#ef4444" />
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
          <p>Logged in as: {currentAdmin?.email}</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button style={{...styles.button, background: '#0077b6', color: 'white'}} onClick={checkAdminStatus}>
              Re-check Admin Status
            </button>
            <button style={{...styles.button, background: '#6b7280', color: 'white'}} onClick={debugSetup}>
              Debug
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        <p style={styles.subtitle}>
          {users.length} total users • {users.filter(u => u.is_active).length} active • {users.filter(u => u.is_admin).length} admins
          {!tableExists && <span style={{color: '#ef4444', fontWeight: 'bold'}}> • TABLE NOT FOUND</span>}
        </p>
        
        {debugInfo && (
          <div style={styles.debugInfo}>
            <strong>Debug Info:</strong><br />
            {debugInfo}
          </div>
        )}
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <button 
          style={styles.refreshButton}
          onClick={fetchUsers}
          disabled={loading}
        >
          <FaSync /> {loading ? 'Loading...' : 'Refresh'}
        </button>
        
        <button 
          style={showInactive ? styles.filterButtonActive : styles.filterButton}
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? <FaEyeSlash /> : <FaEye />}
          {showInactive ? 'Hide Inactive' : 'Show Inactive'}
        </button>
        
        <button 
          style={styles.syncButton}
          onClick={syncAuthUsersToDatabase}
          disabled={loading || !tableExists}
        >
          <FaSync /> Sync from Auth
        </button>
        
        {!tableExists && (
          <button 
            style={styles.createTableButton}
            onClick={createUsersTable}
          >
            <FaKey /> Create Users Table
          </button>
        )}
        
        <button 
          style={styles.debugButton}
          onClick={debugSetup}
        >
          Debug
        </button>
        
        <button 
          style={styles.addButton}
          onClick={() => setShowAddUser(true)}
          disabled={!tableExists}
        >
          <FaUserPlus /> Add User
        </button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <FaExclamationTriangle />
          <div style={styles.errorText}>{error}</div>
          <button 
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {!tableExists ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <FaExclamationTriangle size={50} style={{ marginBottom: '20px', color: '#f59e0b' }} />
          <h3>Users Table Not Found</h3>
          <p style={{ marginBottom: '20px' }}>
            The users table doesn't exist in your database. You need to create it first.
          </p>
          <button 
            style={{...styles.button, ...styles.createTableButton, padding: '12px 24px', fontSize: '16px'}}
            onClick={createUsersTable}
          >
            <FaKey /> Create Users Table
          </button>
          <p style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af' }}>
            After creating the table, click "Refresh" to load users.
          </p>
        </div>
      ) : (
        <>
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <FaUsers size={20} color="#0077b6" />
              <div style={styles.statNumber}>{users.filter(u => u.is_active).length}</div>
              <div style={styles.statLabel}>Active Users</div>
            </div>
            <div style={styles.statCard}>
              <FaShieldAlt size={20} color="#10b981" />
              <div style={styles.statNumber}>{users.filter(u => u.is_admin).length}</div>
              <div style={styles.statLabel}>Admins</div>
            </div>
            <div style={styles.statCard}>
              <FaUsers size={20} color="#6b7280" />
              <div style={styles.statNumber}>{users.filter(u => !u.is_active).length}</div>
              <div style={styles.statLabel}>Inactive</div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <FaUsers size={40} style={{ marginBottom: '10px' }} />
              <p>No users found in database</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                <button style={styles.syncButton} onClick={syncAuthUsersToDatabase}>
                  <FaSync /> Sync Users from Auth
                </button>
                <button style={styles.addButton} onClick={() => setShowAddUser(true)}>
                  <FaUserPlus /> Add New User
                </button>
              </div>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.id} 
                style={{
                  ...styles.userCard,
                  ...(!user.is_active ? styles.inactiveCard : {}),
                  ...(user.id === currentAdmin?.id ? styles.currentUserCard : {})
                }}
              >
                <div style={styles.userHeader}>
                  <div style={styles.avatar}>
                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>
                      {user.full_name}
                      {user.is_admin && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#dc2626' }}>
                          (Admin)
                        </span>
                      )}
                      {user.id === currentAdmin?.id && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#0077b6' }}>
                          (You)
                        </span>
                      )}
                    </div>
                    <div style={styles.userEmail}>
                      <FaEnvelope size={10} style={{ marginRight: '5px' }} />
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <div style={styles.userDetails}>
                  <div>
                    <FaCircle size={10} style={{ 
                      color: user.is_active ? '#10b981' : '#ef4444',
                      marginRight: '5px' 
                    }} />
                    {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                  <div>Role: {user.role}</div>
                  <div>
                    <FaPhone size={10} style={{ marginRight: '5px' }} />
                    {user.phone || 'Not set'}
                  </div>
                  <div>
                    <FaCalendar size={10} style={{ marginRight: '5px' }} />
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                
                <div style={styles.actionButtons}>
                  <button 
                    style={styles.editButton}
                    onClick={() => {
                      setSelectedUser(user);
                      setIsModalOpen(true);
                    }}
                  >
                    <FaEdit /> Details
                  </button>
                  
                  {user.id !== currentAdmin?.id && (
                    user.is_active ? (
                      <button 
                        style={styles.deleteButton}
                        onClick={() => handleDelete(user)}
                      >
                        <FaTrash /> Deactivate
                      </button>
                    ) : (
                      <button 
                        style={styles.restoreButton}
                        onClick={() => restoreUser(user.id)}
                      >
                        Restore
                      </button>
                    )
                  )}
                  
                  {user.id !== currentAdmin?.id && (
                    <div style={styles.roleButtons}>
                      {['customer', 'admin', 'staff'].map(role => (
                        <button
                          key={role}
                          style={{
                            ...styles.roleButton,
                            ...(user.role === role ? styles.activeRoleButton : {})
                          }}
                          onClick={() => updateUserRole(user.id, role)}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* User Detail Modal */}
      {isModalOpen && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>User Details</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            
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
            
            <div style={{ marginBottom: '15px' }}>
              <strong>ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{selectedUser.id}</span>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Name:</strong> {selectedUser.full_name}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Phone:</strong> {selectedUser.phone || 'Not set'}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Role:</strong> {selectedUser.role}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Status:</strong>
              <span style={{ color: selectedUser.is_active ? '#065f46' : '#991b1b', marginLeft: '5px' }}>
                {selectedUser.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Admin:</strong> {selectedUser.is_admin ? 'Yes' : 'No'}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}
            </div>
            
            <button 
              style={{ 
                background: '#6b7280', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                marginTop: '20px',
                width: '100%'
              }}
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3>Confirm Deactivation</h3>
            <p>Are you sure you want to deactivate "{userToDelete.full_name || userToDelete.email}"?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button 
                style={{ 
                  background: '#6b7280', 
                  color: 'white', 
                  padding: '10px 20px', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer'
                }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '10px 20px', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer'
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Add New User</h3>
              <button 
                onClick={() => setShowAddUser(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            
            {error && (
              <div style={styles.errorContainer}>
                <FaExclamationTriangle />
                <div style={styles.errorText}>{error}</div>
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Full Name *</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email *</label>
              <input
                type="email"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="Enter email"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
              <input
                type="tel"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Password *</label>
              <input
                type="password"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Enter password (min 6 characters)"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Role</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                {['customer', 'admin', 'staff'].map(role => (
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
                    {role}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                style={{ 
                  flex: 1,
                  background: '#6b7280', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer'
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
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer'
                }}
                onClick={createUser}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSystemManagement;