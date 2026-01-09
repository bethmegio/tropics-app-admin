// Dashboard.js - Admin dashboard with sidebar navigation and nested routing
import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import UserSystemManagement from './UserSystemManagement'
import ProductManagement from './ProductManagement'
import ServiceManagement from './ServiceManagement'
import OrderManagement from './OrderManagement'
import Settings from './Settings'
import SalesManagement from './SalesManagement'
import InventoryManagement from './InventoryManagement'
import ServiceScheduling from './ServiceScheduling'
import Sidebar from './Sidebar'
import { FaUsers, FaShoppingBag, FaTools, FaBoxOpen, FaCalendarAlt, FaBell } from 'react-icons/fa'
import { supabase } from '../supabase'

// Styles defined first
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Poppins, sans-serif',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 50%, #ffffff 100%)',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 50%, #ffffff 100%)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #e5e7eb',
    borderTop: '5px solid #0077b6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
};

// Page styles for dashboard content
const pageStyles = {
  container: {
    background: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    minHeight: 'calc(100vh - 60px)',
  },
  header: {
    marginBottom: '30px',
    position: 'relative',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #f3f4f6',
  },
  statIcon: {
    padding: '16px',
    borderRadius: '10px',
    background: '#f8fafc',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0',
    fontWeight: '500',
  },
  statNumber: {
    fontSize: '28px',
    color: '#1f2937',
    margin: '0 0 4px 0',
    fontWeight: '700',
  },
  statChange: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '500',
  },
  dashboardContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  quickActions: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #f3f4f6',
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#1f2937',
    margin: '0 0 20px 0',
    fontWeight: '600',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  actionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '25px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    gap: '12px',
    textAlign: 'center',
  },
  notificationContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  notificationButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    color: '#0077b6',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background 0.3s',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    minWidth: '18px',
    height: '18px',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '40px',
    right: 0,
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    width: '250px',
    zIndex: 1000,
    padding: '16px',
  },
  notificationTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#374151',
  },
};

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePage, setActivePage] = useState(location.pathname.split('/').pop() || 'dashboard')
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalServices: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const fetchPendingCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (error) throw error
      setPendingCount(count || 0)
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }, [])

  const fetchPendingOrdersCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (error) throw error
      setPendingOrdersCount(count || 0)
    } catch (error) {
      console.error('Error fetching pending orders count:', error)
    }
  }, [])

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setAuthError('Authentication error: ' + error.message)
          setLoading(false)
          return
        }

        if (!session) {
          setAuthError('No active session. Please log in.')
          setLoading(false)
          return
        }

        // User is authenticated, proceed with loading data
        setLoading(false)
        fetchPendingCount()
        fetchPendingOrdersCount()
        fetchAdminStats()

      } catch (error) {
        setAuthError('Error checking authentication: ' + error.message)
        setLoading(false)
      }
    }

    checkAuth()
  }, [fetchPendingCount, fetchPendingOrdersCount])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Error signing out: ' + error.message)
    }
  }

  const handleNavigation = (page) => {
    setActivePage(page)
    navigate(`/dashboard/${page}`)
  }

  const fetchAdminStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      // For products and services, you might need to adjust table names
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (productsError) console.error('Products error:', productsError)

      const { count: servicesCount, error: servicesError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })

      if (servicesError) console.error('Services error:', servicesError)

      // Fetch revenue from orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'accepted')

      let revenue = 0
      if (!ordersError && orders) {
        revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      }

      setAdminStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalServices: servicesCount || 0,
        revenue: revenue
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  useEffect(() => {
    // Real-time subscriptions
    const bookingsChannel = supabase
      .channel('pending-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        fetchPendingCount
      )
      .subscribe()

    const ordersChannel = supabase
      .channel('pending-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        fetchPendingOrdersCount
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bookingsChannel)
      supabase.removeChannel(ordersChannel)
    }
  }, [fetchPendingCount, fetchPendingOrdersCount])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Show loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  // Show auth error
  if (authError) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <h2>Authentication Required</h2>
          <p>{authError}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              background: '#0077b6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activePage={activePage}
        pendingCount={pendingCount}
        pendingOrdersCount={pendingOrdersCount}
        user={user}
        onToggle={toggleSidebar}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div style={{
        ...styles.content,
        marginLeft: sidebarOpen ? 280 : 80,
      }}>
        <Routes>
          <Route path="/" element={<DashboardHome stats={adminStats} pendingCount={pendingCount} pendingOrdersCount={pendingOrdersCount} />} />
          <Route path="/dashboard" element={<DashboardHome stats={adminStats} pendingCount={pendingCount} pendingOrdersCount={pendingOrdersCount} />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/users" element={<UserSystemManagement />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/services" element={<ServiceManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sales" element={<SalesManagement />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/service-scheduling" element={<ServiceScheduling />} />
        </Routes>
      </div>
    </div>
  )
}

// Dashboard Home Component
function DashboardHome({ stats, pendingCount, pendingOrdersCount }) {
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)

  const quickActions = [
    {
      icon: <FaUsers size={28} />,
      label: 'Manage Users',
      description: 'View and manage all users',
      onClick: () => navigate('/dashboard/users'),
      color: '#8b5cf6'
    },
    {
      icon: <FaShoppingBag size={28} />,
      label: 'Orders',
      description: 'Manage customer orders',
      onClick: () => navigate('/dashboard/orders'),
      color: '#3b82f6'
    },
    {
      icon: <FaShoppingBag size={28} />,
      label: 'Products',
      description: 'Manage product catalog',
      onClick: () => navigate('/dashboard/products'),
      color: '#10b981'
    },
    {
      icon: <FaCalendarAlt size={28} />,
      label: 'Service Scheduling',
      description: 'Manage bookings and schedules',
      onClick: () => navigate('/dashboard/service-scheduling'),
      color: '#f59e0b'
    }
  ]

  return (
    <div style={pageStyles.container}>
      <div style={pageStyles.header}>
        <div style={pageStyles.headerContent}>
          <div>
            <h1 style={pageStyles.title}>Admin Dashboard</h1>
            <p style={pageStyles.subtitle}>Complete overview of your business</p>
          </div>
        </div>
        <div style={pageStyles.notificationContainer}>
          <button
            style={pageStyles.notificationButton}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell size={20} />
            {(pendingCount + pendingOrdersCount) > 0 && (
              <span style={pageStyles.notificationBadge}>
                {pendingCount + pendingOrdersCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div style={pageStyles.notificationDropdown}>
              <h4 style={pageStyles.notificationTitle}>Notifications</h4>
              {pendingCount > 0 && (
                <div style={pageStyles.notificationItem}>
                  <FaCalendarAlt style={{ marginRight: 8, color: '#f59e0b' }} />
                  {pendingCount} pending booking{pendingCount > 1 ? 's' : ''}
                </div>
              )}
              {pendingOrdersCount > 0 && (
                <div style={pageStyles.notificationItem}>
                  <FaShoppingBag style={{ marginRight: 8, color: '#3b82f6' }} />
                  {pendingOrdersCount} pending order{pendingOrdersCount > 1 ? 's' : ''}
                </div>
              )}
              {(pendingCount + pendingOrdersCount) === 0 && (
                <div style={pageStyles.notificationItem}>
                  No new notifications
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div style={pageStyles.statsGrid}>
        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#e0f2fe'}}>
            <FaUsers size={24} color="#0077b6" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Total Users</h3>
            <p style={pageStyles.statNumber}>{stats.totalUsers}</p>
            <small style={pageStyles.statChange}>Registered users</small>
          </div>
        </div>

        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#f0fdf4'}}>
            <FaShoppingBag size={24} color="#10b981" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Products</h3>
            <p style={pageStyles.statNumber}>{stats.totalProducts}</p>
            <small style={pageStyles.statChange}>Active products</small>
          </div>
        </div>

        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#fffbeb'}}>
            <FaTools size={24} color="#f59e0b" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Services</h3>
            <p style={pageStyles.statNumber}>{stats.totalServices}</p>
            <small style={pageStyles.statChange}>Available services</small>
          </div>
        </div>

        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#fef2f2'}}>
            <FaBoxOpen size={24} color="#ef4444" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Revenue</h3>
            <p style={pageStyles.statNumber}>${stats.revenue.toLocaleString()}</p>
            <small style={pageStyles.statChange}>This month</small>
          </div>
        </div>
      </div>

      <div style={pageStyles.dashboardContent}>
        {/* Quick Actions */}
        <div style={pageStyles.quickActions}>
          <h3 style={pageStyles.sectionTitle}>Quick Actions</h3>
          <div style={pageStyles.actionGrid}>
            {quickActions.map((action, index) => (
              <button 
                key={index}
                style={{
                  ...pageStyles.actionButton,
                  background: `linear-gradient(135deg, ${action.color}, ${action.color}dd)`
                }}
                onClick={action.onClick}
              >
                {action.icon}
                <span>{action.label}</span>
                <small>{action.description}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}