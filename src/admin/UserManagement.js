import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUserPlus, 
  FaEnvelope, 
  FaCalendar,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState(null);


  // Wrap fetchUsers in useCallback to prevent unnecessary re-renders
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('users')
        .select('*');
      
      // Filter by active status if needed
      if (!showInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showInactive]); // Add showInactive as dependency

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('users-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUsers]); // Now fetchUsers is included in dependencies

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
      setError(null);

      // Soft delete - update is_active to false
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userToDelete.id);

      if (updateError) throw updateError;

      // Update local state
      setUsers(users.map(user =>
        user.id === userToDelete.id ? { ...user, is_active: false } : user
      ));

      setShowDeleteConfirm(false);
      setUserToDelete(null);
      alert('User deactivated successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error deleting user');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const restoreUser = async (userId) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: true } : user
      ));
      
      alert('User restored successfully');
    } catch (err) {
      console.error('Error restoring user:', err);
      alert('Error restoring user');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      alert('User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Error updating user role');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        <p style={styles.subtitle}>
          Manage all system users ({users.length} total, {users.filter(u => u.is_active).length} active)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.toolbarActions}>
          <button 
            style={showInactive ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <FaEyeSlash style={{ marginRight: 8 }} /> : <FaEye style={{ marginRight: 8 }} />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          
          <button style={styles.addButton}>
            <FaUserPlus style={{ marginRight: 8 }} />
            Add New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={styles.tableContainer}>
        {filteredUsers.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No users found</p>
          </div>
        ) : (
          <div style={styles.table}>
            {/* Table Header */}
            <div style={styles.tableHeader}>
              <div style={styles.tableRow}>
                <div style={{...styles.tableCell, flex: 2}}>User</div>
                <div style={styles.tableCell}>Status</div>
                <div style={styles.tableCell}>Role</div>
                <div style={styles.tableCell}>Last Login</div>
                <div style={styles.tableCell}>Joined</div>
                <div style={styles.tableCell}>Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div style={styles.tableBody}>
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  style={{
                    ...styles.tableRow,
                    opacity: user.is_active ? 1 : 0.6,
                    background: user.is_active ? 'white' : '#f9fafb'
                  }}
                >
                  <div style={{...styles.tableCell, flex: 2}}>
                    <div style={styles.userInfo}>
                      <div style={styles.avatar}>
                        {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div style={styles.userDetails}>
                        <div style={styles.userName}>
                          {user.full_name || 'No Name'}
                          {user.username && (
                            <span style={styles.username}>@{user.username}</span>
                          )}
                        </div>
                        <div style={styles.userEmail}>
                          <FaEnvelope size={12} style={{ marginRight: 6 }} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.tableCell}>
                    <span style={user.is_active ? styles.statusActive : styles.statusInactive}>
                      {user.is_active ? (
                        <>
                          <FaCheckCircle style={{ marginRight: 4 }} />
                          Active
                        </>
                      ) : (
                        <>
                          <FaTimesCircle style={{ marginRight: 4 }} />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div style={styles.tableCell}>
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      style={styles.roleSelect}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </div>
                  
                  <div style={styles.tableCell}>
                    <div style={styles.dateInfo}>
                      {user.last_sign_in_at ? (
                        new Date(user.last_sign_in_at).toLocaleDateString()
                      ) : (
                        'Never'
                      )}
                    </div>
                  </div>
                  
                  <div style={styles.tableCell}>
                    <div style={styles.dateInfo}>
                      <FaCalendar size={12} style={{ marginRight: 6 }} />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <button 
                        style={styles.editButton}
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      
                      {user.is_active ? (
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDelete(user)}
                        >
                          <FaTrash />
                        </button>
                      ) : (
                        <button 
                          style={styles.restoreButton}
                          onClick={() => restoreUser(user.id)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {isModalOpen && selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Details</h3>
              <button
                style={styles.closeModalButton}
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.modalAvatar}>
                {selectedUser.full_name?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || 'U'}
              </div>

              <div style={styles.detailRow}>
                <strong>Name:</strong> {selectedUser.full_name || 'Not provided'}
              </div>
              <div style={styles.detailRow}>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              {selectedUser.username && (
                <div style={styles.detailRow}>
                  <strong>Username:</strong> {selectedUser.username}
                </div>
              )}
              <div style={styles.detailRow}>
                <strong>Role:</strong> {selectedUser.role || 'User'}
              </div>
              <div style={styles.detailRow}>
                <strong>Status:</strong>
                <span style={selectedUser.is_active ? styles.statusActive : styles.statusInactive}>
                  {selectedUser.is_active ? ' Active' : ' Inactive'}
                </span>
              </div>
              <div style={styles.detailRow}>
                <strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}
              </div>
              {selectedUser.last_sign_in_at && (
                <div style={styles.detailRow}>
                  <strong>Last Login:</strong> {new Date(selectedUser.last_sign_in_at).toLocaleString()}
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.modalTitle}>Deactivate User</h3>
            <p style={styles.confirmMessage}>
              Are you sure you want to deactivate "{userToDelete.full_name || userToDelete.email}"?
              The user will be marked as inactive and won't be able to access the system.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={cancelDelete}>
                Cancel
              </button>
              <button style={styles.deleteConfirmButton} onClick={confirmDelete}>
                Deactivate User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
    margin: 0,
  },
  errorContainer: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  errorText: {
    color: '#dc2626',
    margin: 0,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    gap: '20px',
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
    padding: '12px 12px 12px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  toolbarActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  filterButton: {
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
  },
  filterButtonActive: {
    background: '#e0f2fe',
    color: '#0077b6',
    border: '1px solid #0077b6',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
  },
  addButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '500',
  },
  tableContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
  },
  tableBody: {
    background: 'white',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
  },
  tableCell: {
    flex: 1,
    padding: '0 10px',
    minWidth: '120px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0077b6, #0096c7)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '18px',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  username: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '400',
  },
  userEmail: {
    fontSize: '14px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
  },
  statusActive: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
  },
  statusInactive: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
  },
  roleSelect: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
  dateInfo: {
    color: '#6b7280',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  deleteButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  restoreButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280',
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
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  modalOverlay: {
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
    padding: '20px',
  },
  modal: {
    background: 'white',
    padding: '0',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    margin: 0,
    color: '#1f2937',
  },
  closeModalButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  modalContent: {
    padding: '30px',
  },
  modalAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0077b6, #0096c7)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '32px',
    margin: '0 auto 20px',
  },
  detailRow: {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '15px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '20px 30px',
    borderTop: '1px solid #e5e7eb',
  },
  closeButton: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  confirmModal: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '400px',
    width: '90%',
  },
  confirmMessage: {
    margin: '0 0 24px 0',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  cancelButton: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  deleteConfirmButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

// Add CSS animation for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default UserManagement;