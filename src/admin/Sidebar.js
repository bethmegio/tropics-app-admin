// Sidebar.js - Admin sidebar component
import React from 'react';
import { FaCalendarAlt, FaBoxOpen, FaSignOutAlt, FaTachometerAlt, FaUsers, FaChartLine, FaCog, FaShoppingBag, FaTools, FaUserCog } from 'react-icons/fa';

const styles = {
  sidebar: {
    background: 'linear-gradient(180deg, #023e8a 0%, #0077b6 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: 1000,
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    transition: 'width 0.3s ease',
  },
  sidebarHeader: {
    padding: '25px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#fff',
  },
  toggleButton: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  nav: {
    flex: 1,
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
    padding: '15px 20px',
    border: 'none',
    borderRadius: '0',
    width: '100%',
    fontSize: '15px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    fontWeight: '500',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: '20px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    minWidth: '20px',
    height: '20px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  userInfo: {
    padding: '15px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
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
  },
  userEmail: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: '500',
  },
  userRole: {
    margin: 0,
    fontSize: '12px',
    color: '#90e0ef',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: '8px',
    background: '#ef4444',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
  },
};

export default function Sidebar({ sidebarOpen, activePage, pendingCount, pendingOrdersCount, user, onToggle, onNavigate, onLogout }) {
  const menuItems = [
    { key: 'dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { key: 'sales', icon: <FaChartLine />, label: 'Sales Management' },
    { key: 'inventory', icon: <FaBoxOpen />, label: 'Inventory Management' },
    { key: 'service-scheduling', icon: <FaCalendarAlt />, label: 'Service Scheduling' },
    { key: 'orders', icon: <FaShoppingBag />, label: 'Orders', badge: pendingOrdersCount },
    { key: 'users', icon: <FaUsers />, label: 'Users' },
    { key: 'products', icon: <FaShoppingBag />, label: 'Products' },
    { key: 'services', icon: <FaTools />, label: 'Services' },
    { key: 'settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <div style={{
      ...styles.sidebar,
      width: sidebarOpen ? 280 : 80,
    }}>
      <div style={styles.sidebarHeader}>
        {sidebarOpen && <h2 style={styles.logo}>Admin Panel</h2>}
        <button
          onClick={onToggle}
          style={styles.toggleButton}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav style={styles.nav}>
        {menuItems.map(item => (
          <button
            key={item.key}
            style={{
              ...styles.navButton,
              backgroundColor: activePage === item.key ? '#0077b6' : 'transparent',
            }}
            onClick={() => onNavigate(item.key)}
          >
            <span style={{ marginRight: sidebarOpen ? 12 : 0 }}>
              {item.icon}
            </span>
            {sidebarOpen && <span>{item.label}</span>}
            {item.badge > 0 && (
              <span style={styles.notificationBadge}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={styles.sidebarFooter}>
        {sidebarOpen && (
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              <FaUserCog size={20} />
            </div>
            <div>
              <p style={styles.userEmail}>{user?.email}</p>
              <small style={styles.userRole}>Super Admin</small>
            </div>
          </div>
        )}

        <button style={styles.logoutButton} onClick={onLogout}>
          <FaSignOutAlt style={{ marginRight: sidebarOpen ? 8 : 0 }} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}