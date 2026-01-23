import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaUsers,
  FaShoppingBag,
  FaBoxOpen,
  FaConciergeBell,
  FaCalendarCheck,
  FaChartBar,
  FaHistory,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaWarehouse, // Changed from FaCog to FaWarehouse for inventory
  FaClipboardList // Alternative option
} from 'react-icons/fa';

const Sidebar = ({ sidebarOpen, activePage, pendingCount, pendingOrdersCount, user, onToggle, onNavigate, onLogout }) => {
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
    { id: 'users', label: 'User Management', icon: <FaUsers />, path: '/dashboard/users' },
    { id: 'sales', label: 'Sales Management', icon: <FaShoppingBag />, path: '/dashboard/sales' },
    { id: 'products', label: 'Products & Services', icon: <FaBoxOpen />, path: '/dashboard/products' },
    { id: 'inventory', label: 'Inventory Management', icon: <FaWarehouse />, path: '/dashboard/inventory' },
    { id: 'reports', label: 'Reports', icon: <FaChartBar />, path: '/dashboard/reports' },
    { id: 'activity-log', label: 'Activity Logs', icon: <FaHistory />, path: '/dashboard/activity-log' },
    // Changed from FaCog to FaWarehouse for inventory management
   
  ];

  const styles = {
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: sidebarOpen ? '280px' : '80px',
      height: '100vh',
      background: 'linear-gradient(180deg, #023e8a 0%, #0077b6 100%)',
      color: 'white',
      transition: 'width 0.3s ease',
      overflowX: 'hidden',
      zIndex: 1000,
      boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
    },
    toggleButton: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      color: 'white',
      borderRadius: '6px',
      padding: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoContainer: {
      padding: '30px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'center',
    },
    logo: {
      fontSize: sidebarOpen ? '24px' : '20px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: sidebarOpen ? '10px' : '0',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    brandName: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: '1px',
      display: sidebarOpen ? 'block' : 'none',
    },
    menu: {
      padding: '20px 0',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px 20px',
      color: 'rgba(255,255,255,0.8)',
      textDecoration: 'none',
      transition: 'all 0.3s',
      position: 'relative',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
    activeMenuItem: {
      background: 'rgba(255,255,255,0.15)',
      color: 'white',
      borderLeft: '4px solid #48cae4',
    },
    menuIcon: {
      fontSize: '18px',
      minWidth: '24px',
      marginRight: sidebarOpen ? '12px' : '0',
    },
    menuLabel: {
      fontSize: '14px',
      fontWeight: '500',
      display: sidebarOpen ? 'block' : 'none',
      flex: 1,
    },
    badge: {
      position: 'absolute',
      right: '20px',
      background: '#ef4444',
      color: 'white',
      borderRadius: '10px',
      minWidth: '20px',
      height: '20px',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
    },
    userSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '20px',
      background: 'rgba(0,0,0,0.2)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s',
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
      fontWeight: 'bold',
      fontSize: '16px',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
    },
    userEmail: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.7)',
      marginTop: '2px',
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: sidebarOpen ? 'flex-start' : 'center',
      width: '100%',
      padding: '12px',
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '14px',
      fontWeight: '500',
    },
    logoutIcon: {
      marginRight: sidebarOpen ? '8px' : '0',
      fontSize: '16px',
    },
    logoutText: {
      display: sidebarOpen ? 'block' : 'none',
    },
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadgeCount = (id) => {
    if (id === 'booking') return pendingCount;
    if (id === 'sales') return pendingOrdersCount;
    return 0;
  };

  return (
    <div style={styles.sidebar}>
      <button style={styles.toggleButton} onClick={onToggle}>
        {sidebarOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
      </button>
      
      <div style={styles.logoContainer}>
        <div style={styles.logo}>ADMIN PANEL</div>
        <div style={styles.brandName}>Business Management System</div>
      </div>
      
      <div style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const badgeCount = getBadgeCount(item.id);
          
          return (
            <Link
              key={item.id}
              to={item.path}
              style={{
                ...styles.menuItem,
                ...(isActive ? styles.activeMenuItem : {}),
              }}
              onClick={() => onNavigate(item.id)}
            >
              <div style={styles.menuIcon}>{item.icon}</div>
              <div style={styles.menuLabel}>{item.label}</div>
              {badgeCount > 0 && (
                <div style={styles.badge}>{badgeCount}</div>
              )}
            </Link>
          );
        })}
      </div>
      
      <div style={styles.userSection}>
        {sidebarOpen && user && (
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {getInitials(user.full_name || user.email)}
            </div>
            <div>
              <div style={styles.userName}>{user.full_name || 'Admin User'}</div>
              <div style={styles.userEmail}>{user.email}</div>
            </div>
          </div>
        )}
        
        <button style={styles.logoutButton} onClick={onLogout}>
          <div style={styles.logoutIcon}>
            <FaSignOutAlt />
          </div>
          {sidebarOpen && <div style={styles.logoutText}>Logout</div>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;