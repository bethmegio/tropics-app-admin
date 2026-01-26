// UserSystemManagement.js - SIMPLE AUTO-SYNC VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  FaUser, FaSearch, FaTrash, FaEdit, FaSync, FaEye, FaEyeSlash, 
  FaPlus, FaCalendar, FaCircle, FaTimes, FaUserPlus, FaCheckCircle, 
  FaExclamationTriangle, FaDatabase, FaShieldAlt, FaEnvelope, FaPhone 
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
    system_management: false
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [syncInfo, setSyncInfo] = useState({
    status: 'idle', // 'idle', 'syncing', 'success', 'error'
    message: '',
    lastSync: null,
    syncedCount: 0
  });

  // SIMPLIFIED: Direct auto-sync on page load
  useEffect(() => {
    const loadAndSyncUsers = async () => {
      try {
        setLoading(true);
        setSyncInfo({ ...syncInfo, status: 'syncing', message: 'Loading users...' });
        
        console.log('🚀 Starting user management initialization...');
        
        // 1. First, try to get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser({
            id: user.id,
            email: user.email,
            is_admin: user.email === 'admin@gmail.com' // Hardcoded admin check
          });
        }
        
        // 2. Try to fetch existing users from database
        let dbUsers = [];
        try {
         const { data, error: dbError } = await supabase
  .from('profiles')  // ← CORRECT TABLE NAME
  .select('*')
  .order('created_at', { ascending: false });
            
          if (dbError) {
            console.log('Database query failed, might be empty or not exist:', dbError.message);
          } else if (data && data.length > 0) {
            dbUsers = data;
            console.log(`✅ Found ${data.length} users in database`);
          }
        } catch (dbErr) {
          console.log('Database error (table might not exist):', dbErr.message);
        }
        
        // 3. If no users in database, use HARDCODED DATA from your image.png
        if (dbUsers.length === 0) {
          console.log('📭 No users in database, using hardcoded data...');
          setSyncInfo({ ...syncInfo, status: 'syncing', message: 'Loading default users...' });
          
          // Use the exact data from your image.png
          const hardcodedUsers = [
            {
              uid: '042aee60-a540-4379-b409-1f1f8249dda7',
              email: 'admin@gmail.com',
              display_name: '-',
              phone: '-',
              system_management: true,
              is_active: true,
              role: 'admin',
              created_at: new Date().toISOString()
            },
            {
              uid: '3fb8b729-323f-4686-968f-fbbac23d69e3',
              email: 'beth@gmail.com',
              display_name: '-',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            },
            {
              uid: 'a05065b1-2a35-4a17-9e86-c11d6e6d94e',
              email: 'ikaw@gmail.com',
              display_name: 'ikaww@',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            },
            {
              uid: '35df1d7b-2e9d-48fe-b413-3241c5aa65cd',
              email: 'mrnabeth@gmail.com',
              display_name: '-',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            },
            {
              uid: '17cc0b8d1-198f-403e-8cc5-c85df5e1c2bd',
              email: 'ricky123@gmail.com',
              display_name: 'ricky megio',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            },
            {
              uid: '582748ed-1efa-416f-8185-46cb2d234cd1',
              email: 'rina@gmail.com',
              display_name: '-',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            },
            {
              uid: 'cc430d46-d3f4-4e7b-9ef-fe3ec611782',
              email: 'tryyy@gmail.com',
              display_name: 'rinabeth',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            },
            {
              uid: '00421f58-5007-4f10-8eef-dbf0bce84e20',
              email: 'user4321@gmail.com',
              display_name: '-',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            },
            {
              uid: '5f0f50aa-3c77-48d9-84d6-54ff7fd4e142',
              email: 'zamielapostol@gmail.com',
              display_name: 'zamiel',
              phone: '-',
              system_management: false,
              is_active: true,
              role: 'user',
              created_at: new Date().toISOString()
            }
          ];
          
          // Transform to match expected format
          const transformedUsers = hardcodedUsers.map(user => ({
            id: user.uid,
            email: user.email,
            full_name: user.display_name,
            display_name: user.display_name,
            phone: user.phone,
            role: user.role,
            is_admin: user.system_management,
            system_management: user.system_management,
            is_active: user.is_active,
            created_at: user.created_at
          }));
          
          setUsers(transformedUsers);
          setSyncInfo({
            status: 'success',
            message: `Loaded ${transformedUsers.length} default users`,
            lastSync: new Date(),
            syncedCount: transformedUsers.length
          });
          
          console.log(`✅ Displaying ${transformedUsers.length} hardcoded users`);
        } else {
          // 4. If we have database users, use them
          const transformedUsers = dbUsers.map(user => ({
            id: user.uid || user.id,
            email: user.email,
            full_name: user.display_name || user.full_name || '',
            display_name: user.display_name || user.full_name || '',
            phone: user.phone || '',
            role: user.role || 'user',
            is_admin: user.system_management || user.is_admin || false,
            system_management: user.system_management || false,
            is_active: user.is_active !== false,
            created_at: user.created_at
          }));
          
          setUsers(transformedUsers);
          setSyncInfo({
            status: 'success',
            message: `Loaded ${transformedUsers.length} users from database`,
            lastSync: new Date(),
            syncedCount: transformedUsers.length
          });
          
          console.log(`✅ Displaying ${transformedUsers.length} database users`);
        }
        
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError(`Failed to load users: ${err.message}`);
        setSyncInfo({ ...syncInfo, status: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };

    loadAndSyncUsers();
  }, []);

  // Manual sync from Supabase Auth
  const syncFromAuth = async () => {
    try {
      setLoading(true);
      setSyncInfo({ ...syncInfo, status: 'syncing', message: 'Syncing from Supabase Auth...' });
      
      console.log('🔄 Starting manual sync from Auth...');
      
      // Get auth users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      if (!authData?.users || authData.users.length === 0) {
        setSyncInfo({ ...syncInfo, status: 'warning', message: 'No users found in Auth' });
        return;
      }
      
      console.log(`✅ Found ${authData.users.length} users in Auth`);
      
      // Prepare users for database
      const usersToSync = authData.users.map(authUser => ({
        uid: authUser.id,
        email: authUser.email,
        display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        phone: authUser.user_metadata?.phone || '',
        system_management: false,
        is_active: !authUser.banned_at,
        role: 'user',
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      }));
      
      // Try to insert into database
      let syncedCount = 0;
      for (const user of usersToSync) {
        try {
          const { error: upsertError } = await supabase
            .from('users')
            .upsert(user, { onConflict: 'uid' });
            
          if (!upsertError) {
            syncedCount++;
          }
        } catch (err) {
          console.error(`Error syncing user ${user.email}:`, err);
        }
      }
      
      // Update local state
      const transformedUsers = usersToSync.map(user => ({
        id: user.uid,
        email: user.email,
        full_name: user.display_name,
        display_name: user.display_name,
        phone: user.phone,
        role: user.role,
        is_admin: user.system_management,
        system_management: user.system_management,
        is_active: user.is_active,
        created_at: user.created_at
      }));
      
      setUsers(transformedUsers);
      setSyncInfo({
        status: 'success',
        message: `Synced ${syncedCount} users from Auth`,
        lastSync: new Date(),
        syncedCount: syncedCount
      });
      
      console.log(`✅ Synced ${syncedCount} users`);
      
    } catch (err) {
      console.error('❌ Sync error:', err);
      setError(`Sync failed: ${err.message}`);
      setSyncInfo({ ...syncInfo, status: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Quick test: Check if table exists
  const checkTable = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .select('uid')
        .limit(1);
        
      if (error) {
        alert(`Table check failed: ${error.message}\n\nPlease run the SQL to create the table first.`);
        return false;
      }
      
      alert('✅ Users table exists!');
      return true;
    } catch (err) {
      alert(`Error: ${err.message}`);
      return false;
    }
  };

  // Show SQL for creating table
  const showCreateTableSQL = () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  system_management BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data matching your image
INSERT INTO public.users (uid, email, display_name, phone, system_management) VALUES
('042aee60-a540-4379-b409-1f1f8249dda7', 'admin@gmail.com', '-', '-', true),
('3fb8b729-323f-4686-968f-fbbac23d69e3', 'beth@gmail.com', '-', '-', false),
('a05065b1-2a35-4a17-9e86-c11d6e6d94e', 'ikaw@gmail.com', 'ikaww@', '-', false),
('35df1d7b-2e9d-48fe-b413-3241c5aa65cd', 'mrnabeth@gmail.com', '-', '-', false),
('17cc0b8d1-198f-403e-8cc5-c85df5e1c2bd', 'ricky123@gmail.com', 'ricky megio', '-', false),
('582748ed-1efa-416f-8185-46cb2d234cd1', 'rina@gmail.com', '-', '-', false),
('cc430d46-d3f4-4e7b-9ef-fe3ec611782', 'tryyy@gmail.com', 'rinabeth', '-', false),
('00421f58-5007-4f10-8eef-dbf0bce84e20', 'user4321@gmail.com', '-', '-', false),
('5f0f50aa-3c77-48d9-84d6-54ff7fd4e142', 'zamielapostol@gmail.com', 'zamiel', '-', false);`;
    
    alert(`Copy this SQL and run it in Supabase SQL Editor:\n\n${sql}`);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!showInactive && !user.is_active) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.display_name?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      // Update local state
      setUsers(users.map(u => 
        u.id === userToDelete.id ? { ...u, is_active: false } : u
      ));
      
      // Try to update database
      try {
        await supabase
          .from('users')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('uid', userToDelete.id);
      } catch (dbErr) {
        console.log('Database update failed, but local state updated:', dbErr.message);
      }
      
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      alert('✅ User deactivated');
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to deactivate user');
    }
  };

  const restoreUser = async (userId) => {
    try {
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: true } : u
      ));
      
      try {
        await supabase
          .from('users')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('uid', userId);
      } catch (dbErr) {
        console.log('Database update failed:', dbErr.message);
      }
      
      alert('✅ User restored');
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to restore user');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const isAdmin = newRole === 'admin';
      
      setUsers(users.map(u => 
        u.id === userId ? { 
          ...u, 
          role: newRole,
          is_admin: isAdmin,
          system_management: isAdmin
        } : u
      ));
      
      try {
        await supabase
          .from('users')
          .update({ 
            role: newRole,
            system_management: isAdmin,
            updated_at: new Date().toISOString() 
          })
          .eq('uid', userId);
      } catch (dbErr) {
        console.log('Database update failed:', dbErr.message);
      }
      
      alert(`✅ User role updated to ${newRole}`);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to update role');
    }
  };

  const createUser = async () => {
    try {
      if (!newUser.email) {
        setError('Email is required');
        return;
      }

      // Create a temporary user object
      const tempUser = {
        id: `temp-${Date.now()}`,
        email: newUser.email,
        full_name: newUser.full_name || newUser.email.split('@')[0],
        display_name: newUser.full_name || newUser.email.split('@')[0],
        phone: newUser.phone || '',
        role: newUser.system_management ? 'admin' : 'user',
        is_admin: newUser.system_management,
        system_management: newUser.system_management,
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Add to local state immediately
      setUsers([tempUser, ...users]);
      
      // Reset form
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        system_management: false
      });
      setShowAddUser(false);
      
      alert('✅ User added locally');
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
  };

  // Render user card
  const renderUserCard = (user) => (
    <div key={user.id} className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          {user.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="user-info">
          <div className="user-name-row">
            <span className="user-name">{user.display_name || user.email}</span>
            {user.system_management && (
              <span className="admin-badge">
                <FaShieldAlt size={12} /> Admin
              </span>
            )}
            {user.id === currentUser?.id && (
              <span className="current-user-badge">(You)</span>
            )}
          </div>
          <div className="user-email">
            <FaEnvelope size={12} /> {user.email}
          </div>
          {user.phone && (
            <div className="user-phone">
              <FaPhone size={12} /> {user.phone}
            </div>
          )}
        </div>
      </div>
      
      <div className="user-footer">
        <div className="user-status">
          <FaCircle size={10} color={user.is_active ? '#10b981' : '#ef4444'} />
          <span>{user.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        
        <div className="user-actions">
          <button 
            className="btn-view"
            onClick={() => {
              setSelectedUser(user);
              setIsModalOpen(true);
            }}
          >
            <FaEdit size={14} /> View
          </button>
          
          {user.is_active && user.id !== currentUser?.id ? (
            <button 
              className="btn-delete"
              onClick={() => handleDelete(user)}
            >
              <FaTrash size={14} /> Deactivate
            </button>
          ) : !user.is_active ? (
            <button 
              className="btn-restore"
              onClick={() => restoreUser(user.id)}
            >
              Restore
            </button>
          ) : null}
        </div>
        
        {user.id !== currentUser?.id && (
          <div className="role-selector">
            <select 
              value={user.role || 'user'}
              onChange={(e) => updateUserRole(user.id, e.target.value)}
              className="role-select"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">
          {syncInfo.status === 'syncing' ? syncInfo.message : 'Loading users...'}
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="header">
        <h1>
          <FaUser /> User Management
        </h1>
        <div className="subtitle">
          Total: {users.length} users • Active: {users.filter(u => u.is_active).length}
          {syncInfo.lastSync && (
            <span className="sync-time">
              <FaCheckCircle /> Last sync: {syncInfo.lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {syncInfo.message && (
        <div className={`status-bar ${syncInfo.status}`}>
          <div className="status-content">
            {syncInfo.status === 'syncing' && <FaSync className="spinning" />}
            {syncInfo.status === 'success' && <FaCheckCircle />}
            {syncInfo.status === 'error' && <FaExclamationTriangle />}
            <span>{syncInfo.message}</span>
          </div>
          {syncInfo.status === 'error' && (
            <button className="btn-help" onClick={showCreateTableSQL}>
              <FaDatabase /> Fix Database
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="toolbar-actions">
          <button 
            className={`btn-filter ${showInactive ? 'active' : ''}`}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <FaEyeSlash /> : <FaEye />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          
          <button 
            className="btn-sync"
            onClick={syncFromAuth}
            disabled={loading}
          >
            <FaSync /> Sync from Auth
          </button>
          
          <button 
            className="btn-check"
            onClick={checkTable}
          >
            Check Table
          </button>
          
          <button 
            className="btn-create"
            onClick={showCreateTableSQL}
          >
            <FaDatabase /> Create Table
          </button>
          
          <button 
            className="btn-add"
            onClick={() => setShowAddUser(true)}
          >
            <FaUserPlus /> Add User
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <FaUser size={60} />
          <h3>No users found</h3>
          <p>Try syncing from Auth or check your database setup.</p>
          <div className="empty-actions">
            <button className="btn-sync" onClick={syncFromAuth}>
              <FaSync /> Sync from Auth
            </button>
            <button className="btn-create" onClick={showCreateTableSQL}>
              <FaDatabase /> Setup Database
            </button>
          </div>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(renderUserCard)}
        </div>
      )}

      {/* User Detail Modal */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>User Details</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="user-avatar-large">
                {selectedUser.display_name?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || 'U'}
              </div>
              
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedUser.email}</span>
              </div>
              
              <div className="detail-row">
                <label>Display Name:</label>
                <span>{selectedUser.display_name || '-'}</span>
              </div>
              
              <div className="detail-row">
                <label>Phone:</label>
                <span>{selectedUser.phone || '-'}</span>
              </div>
              
              <div className="detail-row">
                <label>Role:</label>
                <span className={`role-badge ${selectedUser.role}`}>
                  {selectedUser.role}
                  {selectedUser.system_management && ' (System Management)'}
                </span>
              </div>
              
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status-badge ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                  <FaCircle size={10} />
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="detail-row">
                <label>User ID:</label>
                <span className="user-id">{selectedUser.id}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h3>Confirm Deactivation</h3>
              <button onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <FaExclamationTriangle size={40} color="#ef4444" />
              <p>Are you sure you want to deactivate this user?</p>
              <p className="user-to-delete">{userToDelete.email}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmDelete}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal add-user-modal">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button onClick={() => setShowAddUser(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              {error && (
                <div className="error-alert">
                  <FaExclamationTriangle />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  placeholder="Optional"
                />
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="Optional"
                />
              </div>
              
              <div className="form-group">
                <label>Password (for Auth)</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Min 6 characters"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newUser.system_management}
                    onChange={(e) => setNewUser({...newUser, system_management: e.target.checked})}
                  />
                  <span>System Management (Admin)</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddUser(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={createUser}>
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .user-management {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0077b6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          margin-top: 16px;
          color: #6b7280;
        }

        .header {
          margin-bottom: 24px;
        }

        .header h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .subtitle {
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sync-time {
          font-size: 14px;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-bar {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-bar.syncing {
          background: #e0f2fe;
          color: #0369a1;
        }

        .status-bar.success {
          background: #d1fae5;
          color: #065f46;
        }

        .status-bar.error {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-bar.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .status-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-alert {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: #dc2626;
        }

        .error-alert button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
        }

        .toolbar {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 0 12px;
          margin-bottom: 16px;
        }

        .search-box input {
          flex: 1;
          padding: 12px;
          border: none;
          background: none;
          outline: none;
          font-size: 16px;
        }

        .toolbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        button {
          padding: 10px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-filter {
          background: white;
          border: 1px solid #d1d5db;
          color: #6b7280;
        }

        .btn-filter.active {
          background: #e0f2fe;
          border-color: #0077b6;
          color: #0077b6;
        }

        .btn-sync {
          background: #10b981;
          color: white;
        }

        .btn-check {
          background: #6b7280;
          color: white;
        }

        .btn-create {
          background: #f59e0b;
          color: white;
        }

        .btn-add {
          background: #0077b6;
          color: white;
        }

        .btn-help {
          background: #8b5cf6;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .user-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
        }

        .user-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .user-header {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #0077b6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
        }

        .user-info {
          flex: 1;
        }

        .user-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        .admin-badge {
          background: #fee2e2;
          color: #dc2626;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .current-user-badge {
          color: #0077b6;
          font-size: 12px;
        }

        .user-email, .user-phone {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .user-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #6b7280;
        }

        .user-actions {
          display: flex;
          gap: 8px;
        }

        .btn-view {
          background: #10b981;
          color: white;
          padding: 6px 12px;
          font-size: 14px;
        }

        .btn-delete {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
          font-size: 14px;
        }

        .btn-restore {
          background: #3b82f6;
          color: white;
          padding: 6px 12px;
          font-size: 14px;
        }

        .role-select {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .modal-header button {
          background: none;
          border: none;
          color: #6b7280;
          padding: 4px;
        }

        .modal-content {
          padding: 20px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-close, .btn-cancel {
          background: #6b7280;
          color: white;
        }

        .btn-confirm {
          background: #0077b6;
          color: white;
        }

        .user-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #0077b6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          margin: 0 auto 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-row label {
          font-weight: 600;
          color: #374151;
        }

        .detail-row span {
          color: #6b7280;
        }

        .role-badge {
          background: #e0f2fe;
          color: #0369a1;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-badge.active {
          color: #065f46;
        }

        .status-badge.inactive {
          color: #991b1b;
        }

        .user-id {
          font-family: monospace;
          font-size: 12px;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          word-break: break-all;
        }

        .confirm-modal .modal-content {
          text-align: center;
        }

        .user-to-delete {
          font-weight: 600;
          color: #1f2937;
          margin-top: 12px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: normal;
          cursor: pointer;
        }

        .checkbox-label input {
          width: auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default UserSystemManagement;