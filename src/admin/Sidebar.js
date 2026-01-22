// src/admin/Sidebar.js
import React from 'react';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaShoppingBag, 
  FaWrench, 
  FaChartLine, 
  FaBoxOpen, 
  FaCalendarAlt, 
  FaCog, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaShoppingCart
} from 'react-icons/fa';

const Sidebar = ({ 
  sidebarOpen, 
  activePage, 
  pendingCount, 
  pendingOrdersCount, 
  user, 
  onToggle, 
  onNavigate, 
  onLogout 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { id: 'users', label: 'User Management', icon: <FaUsers /> },
    { id: 'products', label: 'Products', icon: <FaShoppingBag /> },
    { id: 'services', label: 'Services', icon: <FaWrench /> },
    { id: 'sales', label: 'Sales', icon: <FaChartLine /> },
    { id: 'inventory', label: 'Inventory', icon: <FaBoxOpen /> },
    { id: 'service-scheduling', label: 'Service Scheduling', icon: <FaCalendarAlt /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  const styles = {
    sidebar: {
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      background: 'linear-gradient(180deg, #023e8a 0%, #0077b6 100%)',
      width: sidebarOpen ? '280px' : '80px',
      transition: 'width 0.3s ease',
      zIndex: 1000,
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      color: 'white',
    },
    sidebarHeader: {
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    toggleButton: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      color: 'white',
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '18px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      whiteSpace: 'nowrap',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '700',
    },
    userInfo: {
      padding: '20px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
    },
    userDetails: {
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '2px',
    },
    userRole: {
      fontSize: '12px',
      opacity: 0.8,
    },
    menu: {
      flex: 1,
      padding: '20px 0',
      overflowY: 'auto',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '14px 20px',
      textDecoration: 'none',
      color: 'rgba(255,255,255,0.8)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderLeft: '4px solid transparent',
    },
    menuItemActive: {
      background: 'rgba(255,255,255,0.1)',
      color: 'white',
      borderLeft: '4px solid #00b4d8',
    },
    menuIcon: {
      fontSize: '18px',
      minWidth: '24px',
    },
    menuLabel: {
      marginLeft: '16px',
      fontSize: '14px',
      fontWeight: '500',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      whiteSpace: 'nowrap',
    },
    badge: {
      marginLeft: 'auto',
      background: '#ef4444',
      color: 'white',
      fontSize: '10px',
      fontWeight: 'bold',
      padding: '2px 6px',
      borderRadius: '10px',
      minWidth: '18px',
      textAlign: 'center',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
    },
    notifications: {
      padding: '20px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
    },
    notificationItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      marginBottom: '10px',
      padding: '8px',
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.05)',
    },
    notificationCount: {
      background: '#ef4444',
      color: 'white',
      fontSize: '11px',
      fontWeight: 'bold',
      padding: '2px 6px',
      borderRadius: '10px',
      minWidth: '20px',
      textAlign: 'center',
    },
    footer: {
      padding: '20px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      background: 'rgba(239, 68, 68, 0.2)',
      border: 'none',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
    },
    logoutText: {
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      whiteSpace: 'nowrap',
    },
  };

  return (
    <div style={styles.sidebar}>
      {/* Header with logo and toggle button */}
      <div style={styles.sidebarHeader}>
        <div style={styles.logo}>
          <div style={{ fontSize: '24px' }}>🚀</div>
          {sidebarOpen && <span style={styles.logoText}>Admin Panel</span>}
        </div>
        <button 
          style={styles.toggleButton} 
          onClick={onToggle}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* User info */}
      <div style={styles.userInfo}>
        <div style={styles.userAvatar}>
          {user?.email?.[0]?.toUpperCase() || 'A'}
        </div>
        {sidebarOpen && (
          <div style={styles.userDetails}>
            <div style={styles.userName}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}
            </div>
            <div style={styles.userRole}>
              {user?.user_metadata?.is_admin ? 'Administrator' : 'Admin'}
            </div>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div style={styles.menu}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            style={{
              ...styles.menuItem,
              ...(activePage === item.id ? styles.menuItemActive : {}),
            }}
            onClick={() => onNavigate(item.id)}
            title={!sidebarOpen ? item.label : ''}
          >
            <div style={styles.menuIcon}>{item.icon}</div>
            {sidebarOpen && <span style={styles.menuLabel}>{item.label}</span>}
            
            {/* Badges for pending items */}
            {(item.id === 'dashboard' && (pendingCount > 0 || pendingOrdersCount > 0) && sidebarOpen) && (
              <div style={styles.badge}>
                {pendingCount + pendingOrdersCount}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notifications section */}
      {sidebarOpen && (pendingCount > 0 || pendingOrdersCount > 0) && (
        <div style={styles.notifications}>
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.7, 
            marginBottom: '12px',
            fontWeight: '500'
          }}>
            Pending Actions
          </div>
          {pendingCount > 0 && (
            <div style={styles.notificationItem}>
              <FaCalendarAlt />
              <span>Pending Bookings</span>
              <div style={styles.notificationCount}>{pendingCount}</div>
            </div>
          )}
          {pendingOrdersCount > 0 && (
            <div style={styles.notificationItem}>
              <FaShoppingCart />
              <span>Pending Orders</span>
              <div style={styles.notificationCount}>{pendingOrdersCount}</div>
            </div>
          )}
        </div>
      )}

      {/* Logout button */}
      <div style={styles.footer}>
        <button 
          style={styles.logoutButton} 
          onClick={onLogout}
          title={!sidebarOpen ? 'Logout' : ''}
        >
          <FaSignOutAlt />
          {sidebarOpen && <span style={styles.logoutText}>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;