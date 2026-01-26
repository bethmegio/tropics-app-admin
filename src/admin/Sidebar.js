import React, { useState, useEffect } from 'react';
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
  FaWarehouse,
  FaClipboardList,
  FaChevronRight,
  FaChevronLeft,
  FaHome,
  FaUserCircle,
  FaBell,
  FaCaretDown,
  FaCaretRight,
  FaSun,
  FaMoon,
  FaEnvelope,
  FaExclamationCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaTrash,
  FaCheck,
  FaEllipsisV,
  FaRegBell
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
  const location = useLocation();
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationSound, setNotificationSound] = useState(true);
  
  // Get current time for greeting
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Notification types
  const NOTIFICATION_TYPES = {
    INFO: 'info',
    WARNING: 'warning',
    SUCCESS: 'success',
    ERROR: 'error',
    ORDER: 'order',
    USER: 'user',
    SYSTEM: 'system'
  };
  
  // Define getBadgeCount function - MUST BE DEFINED BEFORE menuItems
  const getBadgeCount = (id) => {
    if (id === 'sales') return pendingOrdersCount || 0;
    if (id === 'users') return pendingCount || 0;
    return 0;
  };

  // Helper function to get icon component by type
  const getIconByName = (iconName) => {
    switch(iconName) {
      case 'shopping-bag': return <FaShoppingBag />;
      case 'exclamation-circle': return <FaExclamationCircle />;
      case 'users': return <FaUsers />;
      case 'check-circle': return <FaCheckCircle />;
      case 'info-circle': return <FaInfoCircle />;
      case 'concierge-bell': return <FaConciergeBell />;
      case 'envelope': return <FaEnvelope />;
      case 'bell': return <FaBell />;
      default: return <FaBell />;
    }
  };
  
  // Sample notification data - using icon names instead of React elements
  const initialNotifications = [
    {
      id: 1,
      title: 'New Order Received',
      message: 'Order #ORD-2024-00123 has been placed',
      type: NOTIFICATION_TYPES.ORDER,
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
      icon: 'shopping-bag',
      color: '#3b82f6',
      action: { path: '/dashboard/sales', label: 'View Order' }
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      message: 'Chlorine tablets stock is below minimum level',
      type: NOTIFICATION_TYPES.WARNING,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      icon: 'exclamation-circle',
      color: '#f59e0b',
      action: { path: '/dashboard/inventory', label: 'Restock' }
    },
    {
      id: 3,
      title: 'New User Registration',
      message: 'John Doe has registered as a new customer',
      type: NOTIFICATION_TYPES.USER,
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      read: true,
      icon: 'users',
      color: '#10b981',
      action: { path: '/dashboard/users', label: 'View Profile' }
    },
    {
      id: 4,
      title: 'System Update',
      message: 'Version 2.1.0 has been deployed successfully',
      type: NOTIFICATION_TYPES.SUCCESS,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
      icon: 'check-circle',
      color: '#10b981'
    },
    {
      id: 5,
      title: 'Scheduled Maintenance',
      message: 'System maintenance scheduled for tomorrow 2:00 AM',
      type: NOTIFICATION_TYPES.INFO,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      read: true,
      icon: 'info-circle',
      color: '#06b6d4'
    }
  ];
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Load notifications from localStorage or initialize with sample data
    const savedNotifications = localStorage.getItem('dashboard_notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      // Convert timestamp strings back to Date objects
      const notificationsWithDates = parsed.map(notification => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
      setNotifications(notificationsWithDates);
    } else {
      setNotifications(initialNotifications);
    }
    
    // Load notification preferences
    const soundPref = localStorage.getItem('notification_sound');
    if (soundPref !== null) {
      setNotificationSound(soundPref === 'true');
    }
    
    // Poll for new notifications (simulated)
    const notificationInterval = setInterval(checkForNewNotifications, 60000);
    
    return () => {
      clearInterval(timer);
      clearInterval(notificationInterval);
    };
  }, []);
  
  useEffect(() => {
    // Save notifications to localStorage whenever they change
    localStorage.setItem('dashboard_notifications', JSON.stringify(notifications));
    
    // Update unread count
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
    // Update document title with unread count
    if (unread > 0) {
      document.title = `(${unread}) Tropics Pool Management`;
    } else {
      document.title = 'Tropics Pool Management';
    }
  }, [notifications]);
  
  const checkForNewNotifications = () => {
    // Simulate receiving new notifications
    const shouldAddNotification = Math.random() > 0.7; // 30% chance
    
    if (shouldAddNotification) {
      const newNotification = {
        id: Date.now(),
        title: ['New Pool Service Request', 'Payment Received', 'Inventory Alert', 'New Customer Inquiry'][Math.floor(Math.random() * 4)],
        message: [
          'New swimming pool service requested in downtown area',
          'Payment of $249.99 for Order #ORD-2024-00125 has been processed',
          'Pool filter cartridges need replacement soon',
          'Customer inquiry about summer pool maintenance packages'
        ][Math.floor(Math.random() * 4)],
        type: [NOTIFICATION_TYPES.ORDER, NOTIFICATION_TYPES.SUCCESS, NOTIFICATION_TYPES.WARNING, NOTIFICATION_TYPES.INFO][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
        read: false,
        icon: ['concierge-bell', 'check-circle', 'exclamation-circle', 'envelope'][Math.floor(Math.random() * 4)],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#06b6d4'][Math.floor(Math.random() * 4)]
      };
      
      addNotification(newNotification);
    }
  };
  
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep only last 20
    
    // Play notification sound if enabled
    if (notificationSound) {
      playNotificationSound();
    }
  };
  
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };
  
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  const toggleNotificationSound = () => {
    const newValue = !notificationSound;
    setNotificationSound(newValue);
    localStorage.setItem('notification_sound', newValue.toString());
  };
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const getTimeString = () => {
    return currentTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return timestamp.toLocaleDateString();
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.INFO: return <FaInfoCircle />;
      case NOTIFICATION_TYPES.WARNING: return <FaExclamationCircle />;
      case NOTIFICATION_TYPES.SUCCESS: return <FaCheckCircle />;
      case NOTIFICATION_TYPES.ERROR: return <FaExclamationCircle />;
      case NOTIFICATION_TYPES.ORDER: return <FaShoppingBag />;
      case NOTIFICATION_TYPES.USER: return <FaUsers />;
      default: return <FaBell />;
    }
  };
  
  const getNotificationColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.INFO: return '#06b6d4';
      case NOTIFICATION_TYPES.WARNING: return '#f59e0b';
      case NOTIFICATION_TYPES.SUCCESS: return '#10b981';
      case NOTIFICATION_TYPES.ERROR: return '#ef4444';
      case NOTIFICATION_TYPES.ORDER: return '#3b82f6';
      case NOTIFICATION_TYPES.USER: return '#8b5cf6';
      default: return '#64748b';
    }
  };
  
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <FaTachometerAlt />, 
      path: '/dashboard',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: <FaUsers />, 
      path: '/dashboard/users',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    { 
      id: 'sales', 
      label: 'Sales Management', 
      icon: <FaShoppingBag />, 
      path: '/dashboard/sales',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    { 
      id: 'products', 
      label: 'Products & Services', 
      icon: <FaBoxOpen />, 
      path: '/dashboard/products',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: <FaWarehouse />, 
      path: '/dashboard/inventory',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: <FaChartBar />, 
      path: '/dashboard/reports',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    },
    { 
      id: 'activity-log', 
      label: 'Activity Logs', 
      icon: <FaHistory />, 
      path: '/dashboard/activity-log',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
    },
  ];

  const styles = {
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: sidebarOpen ? '280px' : '85px',
      height: '100vh',
      background: isDarkMode 
        ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
      color: 'white',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowX: 'hidden',
      zIndex: 1001,
      boxShadow: '8px 0 30px rgba(0, 0, 0, 0.15)',
      borderRight: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : 'none',
    },
    toggleButton: {
      position: 'absolute',
      top: '25px',
      right: sidebarOpen ? '20px' : 'calc(50% - 12px)',
      background: 'rgba(255,255,255,0.15)',
      border: 'none',
      color: 'white',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      ':hover': {
        background: 'rgba(255,255,255,0.25)',
        transform: sidebarOpen ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1.1)',
      }
    },
    
    // Notification Panel Styles
    notificationsPanel: {
      position: 'fixed',
      top: '80px',
      right: '20px',
      width: '380px',
      maxHeight: '500px',
      background: isDarkMode ? '#1e293b' : 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      zIndex: 1002,
      display: showNotifications ? 'flex' : 'none',
      flexDirection: 'column',
      overflow: 'hidden',
      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
    },
    notificationsHeader: {
      padding: '20px',
      borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: isDarkMode ? '#0f172a' : '#f8fafc',
    },
    notificationsTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: isDarkMode ? 'white' : '#1e293b',
    },
    notificationsCount: {
      background: '#3b82f6',
      color: 'white',
      borderRadius: '12px',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: '600',
    },
    notificationsActions: {
      display: 'flex',
      gap: '10px',
    },
    actionButton: {
      background: 'transparent',
      border: 'none',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 12px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      ':hover': {
        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        color: isDarkMode ? 'white' : '#1e293b',
      }
    },
    notificationsList: {
      flex: 1,
      overflowY: 'auto',
      maxHeight: '400px',
    },
    notificationItem: {
      padding: '16px 20px',
      borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      background: isDarkMode ? 'transparent' : 'white',
      ':hover': {
        background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      }
    },
    notificationUnread: {
      background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
      borderLeft: '3px solid #3b82f6',
    },
    notificationIcon: {
      position: 'absolute',
      left: '20px',
      top: '18px',
      fontSize: '16px',
    },
    notificationContent: {
      marginLeft: '32px',
    },
    notificationTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: isDarkMode ? 'white' : '#1e293b',
      marginBottom: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    notificationMessage: {
      fontSize: '13px',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      lineHeight: '1.4',
      marginBottom: '8px',
    },
    notificationMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
    },
    notificationTime: {
      color: isDarkMode ? '#64748b' : '#94a3b8',
    },
    notificationActions: {
      display: 'flex',
      gap: '8px',
      opacity: 0,
      transition: 'opacity 0.2s ease',
    },
    notificationItemHover: {
      ':hover $notificationActions': {
        opacity: 1,
      }
    },
    notificationActionBtn: {
      background: 'transparent',
      border: 'none',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      cursor: 'pointer',
      fontSize: '12px',
      padding: '2px 6px',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      ':hover': {
        color: isDarkMode ? 'white' : '#1e293b',
        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      }
    },
    notificationsEmpty: {
      padding: '40px 20px',
      textAlign: 'center',
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      opacity: 0.5,
    },
    notificationsFooter: {
      padding: '16px 20px',
      borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      background: isDarkMode ? '#0f172a' : '#f8fafc',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    soundToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
      ':hover': {
        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        color: isDarkMode ? 'white' : '#1e293b',
      }
    },
    
    // Existing styles...
    logoContainer: {
      padding: sidebarOpen ? '40px 20px 30px' : '40px 10px 30px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'center',
      position: 'relative',
    },
    logo: {
      fontSize: sidebarOpen ? '28px' : '22px',
      fontWeight: '800',
      color: 'white',
      marginBottom: sidebarOpen ? '12px' : '0',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      letterSpacing: '1px',
      background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    brandName: {
      fontSize: '11px',
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      display: sidebarOpen ? 'block' : 'none',
      marginTop: '5px',
      fontWeight: '500',
    },
    greetingContainer: {
      padding: sidebarOpen ? '25px 20px 15px' : '25px 10px 15px',
      display: sidebarOpen ? 'block' : 'none',
    },
    greeting: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.8)',
      marginBottom: '4px',
    },
    time: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'white',
      letterSpacing: '1px',
    },
    menu: {
      padding: '15px 0',
      height: 'calc(100vh - 320px)',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.3) transparent',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      padding: sidebarOpen ? '16px 20px' : '16px 10px',
      color: 'rgba(255,255,255,0.8)',
      textDecoration: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      margin: '4px 10px',
      borderRadius: '12px',
      overflow: 'hidden',
      ':hover': {
        background: 'rgba(255,255,255,0.1)',
        transform: 'translateX(5px)',
        color: 'white',
      }
    },
    activeMenuItem: {
      background: 'rgba(255,255,255,0.15)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      transform: 'translateX(5px)',
      '::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: 'linear-gradient(180deg, #48cae4 0%, #0096c7 100%)',
        borderRadius: '0 4px 4px 0',
      }
    },
    menuIcon: {
      fontSize: '20px',
      minWidth: '24px',
      marginRight: sidebarOpen ? '16px' : '0',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuLabel: {
      fontSize: '14px',
      fontWeight: '500',
      display: sidebarOpen ? 'block' : 'none',
      flex: 1,
      letterSpacing: '0.3px',
    },
    badge: {
      position: 'absolute',
      right: '20px',
      background: '#ef4444',
      color: 'white',
      borderRadius: '12px',
      minWidth: '24px',
      height: '24px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
      animation: 'pulse 2s infinite',
    },
    userSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: sidebarOpen ? '20px' : '20px 10px',
      background: 'rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: sidebarOpen ? 'all' : 'none',
    },
    userAvatar: {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
      fontWeight: 'bold',
      fontSize: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      border: '2px solid rgba(255,255,255,0.2)',
    },
    userDetails: {
      flex: 1,
      minWidth: 0,
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    userEmail: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.7)',
      marginTop: '2px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginBottom: '15px',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: sidebarOpen ? 'all' : 'none',
    },
    themeToggle: {
      flex: 1,
      padding: '10px',
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      ':hover': {
        background: 'rgba(255,255,255,0.2)',
      }
    },
    notificationsButton: {
      width: '40px',
      padding: '10px',
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transition: 'all 0.3s ease',
      ':hover': {
        background: 'rgba(255,255,255,0.2)',
      }
    },
    notificationDot: {
      position: 'absolute',
      top: '5px',
      right: '5px',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#ef4444',
      border: '2px solid rgba(30, 64, 175, 0.8)',
      animation: 'pulse 2s infinite',
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: sidebarOpen ? 'flex-start' : 'center',
      width: '100%',
      padding: '14px',
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '10px',
      color: '#fecaca',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '600',
      letterSpacing: '0.5px',
      ':hover': {
        background: 'rgba(239, 68, 68, 0.3)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
      }
    },
    logoutIcon: {
      marginRight: sidebarOpen ? '10px' : '0',
      fontSize: '16px',
      transition: 'all 0.3s ease',
    },
    logoutText: {
      display: sidebarOpen ? 'block' : 'none',
    },
    glowEffect: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
    },
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-panel') && !event.target.closest('.notifications-button')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    // Mark all as read when opening notifications
    if (!showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <>
      <div style={styles.sidebar}>
        {/* Toggle Button */}
        <button 
          style={styles.toggleButton} 
          onClick={onToggle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
            e.currentTarget.style.transform = sidebarOpen 
              ? 'rotate(180deg) scale(1.1)' 
              : 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.transform = sidebarOpen 
              ? 'rotate(180deg)' 
              : 'rotate(0deg)';
          }}
        >
          {sidebarOpen ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
        </button>
        
        {/* Logo Section */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>TROPICS POOL</div>
          <div style={styles.brandName}>Management System</div>
        </div>
        
        {/* Greeting Section */}
        {sidebarOpen && (
          <div style={styles.greetingContainer}>
            <div style={styles.greeting}>{getGreeting()}!</div>
            <div style={styles.time}>{getTimeString()}</div>
          </div>
        )}
        
        {/* Menu Items */}
        <div style={styles.menu}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badgeCount = getBadgeCount(item.id);
            const isHovered = hoveredItem === item.id;
            
            return (
              <React.Fragment key={item.id}>
                <Link
                  to={item.path}
                  style={{
                    ...styles.menuItem,
                    ...(isActive ? styles.activeMenuItem : {}),
                  }}
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Glow effect on hover */}
                  {isHovered && !isActive && (
                    <div style={{
                      ...styles.glowEffect,
                      opacity: 0.5,
                      background: item.gradient,
                    }} />
                  )}
                  
                  {/* Active gradient background */}
                  {isActive && (
                    <div style={{
                      ...styles.glowEffect,
                      opacity: 0.3,
                      background: item.gradient,
                    }} />
                  )}
                  
                  {/* Icon with color */}
                  <div style={{
                    ...styles.menuIcon,
                    color: isActive ? '#48cae4' : 'inherit',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}>
                    {item.icon}
                  </div>
                  
                  {/* Menu label */}
                  <div style={styles.menuLabel}>{item.label}</div>
                  
                  {/* Badge */}
                  {badgeCount > 0 && (
                    <div style={styles.badge}>{badgeCount > 99 ? '99+' : badgeCount}</div>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </div>
        
        {/* User Section */}
        <div style={styles.userSection}>
          {/* Action Buttons */}
          {sidebarOpen && (
            <div style={styles.actionButtons}>
              <button 
                style={styles.themeToggle}
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <FaSun /> : <FaMoon />}
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
              
              <button 
                style={styles.notificationsButton}
                onClick={toggleNotifications}
                className="notifications-button"
              >
                <FaBell />
                {unreadCount > 0 && <div style={styles.notificationDot} />}
              </button>
            </div>
          )}
          
          {/* User Info */}
          {sidebarOpen && user && (
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                {getInitials(user.full_name || user.email)}
              </div>
              <div style={styles.userDetails}>
                <div style={styles.userName}>{user.full_name || 'Admin User'}</div>
                <div style={styles.userEmail}>{user.email}</div>
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <button 
            style={styles.logoutButton} 
            onClick={onLogout}
            onMouseEnter={(e) => {
              if (sidebarOpen) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (sidebarOpen) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={styles.logoutIcon}>
              <FaSignOutAlt />
            </div>
            {sidebarOpen && <div style={styles.logoutText}>Logout</div>}
          </button>
        </div>
        
        {/* CSS Animations */}
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes slideIn {
              from { transform: translateY(-10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes slideInFromRight {
              from { transform: translateX(20px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            
            .notification-enter {
              animation: slideInFromRight 0.3s ease forwards;
            }
            
            ::-webkit-scrollbar {
              width: 6px;
            }
            
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            
            ::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.3);
              border-radius: 3px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.5);
            }
          `}
        </style>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div 
          style={styles.notificationsPanel}
          className="notifications-panel"
        >
          {/* Header */}
          <div style={styles.notificationsHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.notificationsTitle}>Notifications</div>
              {unreadCount > 0 && (
                <div style={styles.notificationsCount}>
                  {unreadCount} new
                </div>
              )}
            </div>
            <div style={styles.notificationsActions}>
              {notifications.length > 0 && (
                <>
                  <button 
                    style={styles.actionButton}
                    onClick={markAllAsRead}
                  >
                    <FaCheck /> Mark all read
                  </button>
                  <button 
                    style={styles.actionButton}
                    onClick={clearAllNotifications}
                  >
                    <FaTrash /> Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={styles.notificationsList}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  style={{
                    ...styles.notificationItem,
                    ...(!notification.read ? styles.notificationUnread : {}),
                    animation: 'slideInFromRight 0.3s ease forwards',
                  }}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.action?.path) {
                      window.location.href = notification.action.path;
                    }
                  }}
                >
                  <div style={{
                    ...styles.notificationIcon,
                    color: notification.color || getNotificationColor(notification.type)
                  }}>
                    {getIconByName(notification.icon) || getNotificationIcon(notification.type)}
                  </div>
                  
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationTitle}>
                      <span>{notification.title}</span>
                      {!notification.read && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                    
                    <div style={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    
                    <div style={styles.notificationMeta}>
                      <div style={styles.notificationTime}>
                        {getTimeAgo(notification.timestamp)}
                      </div>
                      
                      <div style={styles.notificationActions}>
                        <button 
                          style={styles.notificationActionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <FaCheck size={10} />
                        </button>
                        <button 
                          style={styles.notificationActionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          title="Delete notification"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.notificationsEmpty}>
                <div style={styles.emptyIcon}>
                  <FaRegBell />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                  No notifications
                </div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  You're all caught up!
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={styles.notificationsFooter}>
              <div 
                style={styles.soundToggle}
                onClick={toggleNotificationSound}
              >
                {notificationSound ? <FaBell /> : <FaRegBell />}
                <span>Sound {notificationSound ? 'On' : 'Off'}</span>
              </div>
              
              <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                {notifications.length} notifications
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay when notifications are open */}
      {showNotifications && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
};

export default Sidebar;