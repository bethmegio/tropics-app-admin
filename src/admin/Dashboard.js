// Dashboard.js - Admin dashboard with sidebar navigation and nested routing
import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import UserSystemManagement from './UserSystemManagement'
import ProductManagement from './ProductManagement'
import ServiceManagement from './ServiceManagement'
import SalesManagement from './SalesManagement'
import Settings from './Settings'
import InventoryManagement from './InventoryManagement'
import ServiceScheduling from './ServiceScheduling'
import ActivityLog from './ActivityLog'
import Sidebar from './Sidebar'
import { FaShoppingBag, FaCalendarAlt, FaBoxOpen } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts'
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    marginBottom: '20px',
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
  sectionTitle: {
    fontSize: '20px',
    color: '#1f2937',
    margin: '0 0 20px 0',
    fontWeight: '600',
  },
  notificationContainer: {
    position: 'relative',
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
  chartSection: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginBottom: '30px',
  },
  chartControls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  button: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  activeButton: {
    padding: '8px 16px',
    border: '1px solid #0077b6',
    background: '#e0f2fe',
    color: '#0077b6',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  debugButtons: {
    margin: '20px 0 30px 0', 
    display: 'flex', 
    gap: '10px',
    padding: '15px',
    background: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bae6fd'
  },
  debugButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px'
  }
};

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePage, setActivePage] = useState('dashboard')
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminStats, setAdminStats] = useState({
    totalSalesToday: 0,
    totalSalesThisMonth: 0,
    pendingServiceBookings: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // 🔍 DEBUG: Log dashboard info
  console.log('🔍 Dashboard Debug Info:', {
    userEmail: user?.email,
    userId: user?.id,
    currentPath: location.pathname,
    activePage,
    loading,
    authError
  });

  // Update active page based on URL
  useEffect(() => {
    const path = location.pathname.split('/')
    const currentPage = path[path.length - 1] || 'dashboard'
    setActivePage(currentPage)
    console.log('📍 Active page updated:', currentPage, 'from path:', location.pathname);
  }, [location])

  const fetchPendingCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')

      if (error) throw error
      setPendingCount(count || 0)
      
      // Update admin stats
      setAdminStats(prev => ({
        ...prev,
        pendingServiceBookings: count || 0
      }))
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }, [])

  const fetchPendingOrdersCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')

      if (error) throw error
      setPendingOrdersCount(count || 0)
      
      // Update admin stats
      setAdminStats(prev => ({
        ...prev,
        pendingOrders: count || 0
      }))
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
    console.log('🧭 Navigating to:', page);
  }

  const fetchAdminStats = async () => {
    try {
      // Get today's date in UTC
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startOfToday = today.toISOString()
      
      // Get first day of current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      // Total Sales Today
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', startOfToday)

      let totalSalesToday = 0
      if (!todayError && todayOrders) {
        totalSalesToday = todayOrders.reduce((sum, order) => sum + (order.total_amount || order.total || 0), 0)
      }

      // Total Sales This Month
      const { data: monthOrders, error: monthError } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth)

      let totalSalesThisMonth = 0
      if (!monthError && monthOrders) {
        totalSalesThisMonth = monthOrders.reduce((sum, order) => sum + (order.total_amount || order.total || 0), 0)
      }

      // Pending Service Bookings
      const { count: pendingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')

      // Pending Orders for Approval
      const { count: pendingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')

      // Low Stock Products
      const { count: lowStock, error: stockError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .lte('stock_quantity', 5)

      // Log any errors for debugging (optional)
      if (bookingsError) console.error('Bookings error:', bookingsError)
      if (ordersError) console.error('Orders error:', ordersError)
      if (stockError) console.error('Stock error:', stockError)

      setAdminStats({
        totalSalesToday: totalSalesToday,
        totalSalesThisMonth: totalSalesThisMonth,
        pendingServiceBookings: pendingBookings || 0,
        pendingOrders: pendingOrders || 0,
        lowStockProducts: lowStock || 0
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  useEffect(() => {
    // Real-time subscriptions
    const bookingsChannel = supabase
      .channel('bookings-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: 'status=eq.pending'
        },
        (payload) => {
          fetchPendingCount()
        }
      )
      .subscribe()

    const ordersChannel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending'
        },
        (payload) => {
          fetchPendingOrdersCount()
        }
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
        marginLeft: sidebarOpen ? '280px' : '80px',
      }}>
        {/* Always show the dashboard content when on dashboard route */}
        {activePage === 'dashboard' && <DashboardHome stats={adminStats} user={user} />}
        
        <Routes>
          {/* Main dashboard route */}
          <Route index element={<DashboardHome stats={adminStats} user={user} />} />
          {/* Sub-routes */}
          <Route path="users" element={<UserSystemManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="sales" element={<SalesManagement />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="service-scheduling" element={<ServiceScheduling />} />
          <Route path="activity-log" element={<ActivityLog />} />
          
          {/* 🔍 DEBUG ROUTE */}
          <Route path="test-debug" element={
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              minHeight: 'calc(100vh - 60px)'
            }}>
              <h1 style={{ fontSize: '32px', color: '#10b981', marginBottom: '20px' }}>
                ✅ Debug Route Working!
              </h1>
              <div style={{
                background: '#f0f9ff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #bae6fd'
              }}>
                <h3 style={{ color: '#0077b6', marginBottom: '10px' }}>Debug Information:</h3>
                <p><strong>Current Time:</strong> {new Date().toLocaleString()}</p>
                <p><strong>User Email:</strong> {user?.email || 'Not logged in'}</p>
                <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
                <p><strong>Current Path:</strong> {window.location.pathname}</p>
              </div>
              <div style={{
                background: '#f0fdf4',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #a7f3d0'
              }}>
                <h3 style={{ color: '#10b981', marginBottom: '10px' }}>Next Steps:</h3>
                <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                  <li>Go to <a href="/dashboard/activity-log" style={{ color: '#0077b6', fontWeight: '500' }}>/dashboard/activity-log</a> to check Activity Log</li>
                  <li>Check browser console (F12) for any errors</li>
                  <li>Check if you can see the Activity Logs link in the sidebar</li>
                  <li>Verify your database connection is working</li>
                </ul>
              </div>
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fbbf24'
              }}>
                <h4 style={{ color: '#d97706', marginBottom: '10px' }}>Quick Actions:</h4>
                <button 
                  onClick={() => window.location.href = '/dashboard/activity-log'}
                  style={{
                    marginRight: '10px',
                    padding: '8px 16px',
                    background: '#0077b6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Go to Activity Logs
                </button>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  style={{
                    marginRight: '10px',
                    padding: '8px 16px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Back to Dashboard
                </button>
                <button 
                  onClick={() => window.open('https://supabase.com/dashboard/project/_/editor', '_blank')}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Open Supabase
                </button>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </div>
  )
}

// Dashboard Home Component - UPDATED to include user prop
function DashboardHome({ stats, user }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [chartData, setChartData] = useState([])
  const [chartView, setChartView] = useState('weekly')
  const [salesChannelData, setSalesChannelData] = useState([])
  const [paymentMethodData, setPaymentMethodData] = useState([])

  useEffect(() => {
    fetchSalesTrendsData(chartView)

    // Real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchSalesTrendsData(chartView)
    }, 30000)

    return () => clearInterval(interval)
  }, [chartView])

  useEffect(() => {
    fetchSalesChannelData()
    fetchPaymentMethodData()
  }, [])

  const fetchSalesTrendsData = async (view) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, total')
        .eq('status', 'completed')

      if (error) throw error

      const grouped = {}
      orders.forEach(order => {
        const date = new Date(order.created_at)
        const total = order.total_amount || order.total || 0
        
        let key
        if (view === 'weekly') {
          // Get week start (Monday)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay() + 1)
          weekStart.setHours(0, 0, 0, 0)
          key = weekStart.toISOString().split('T')[0]
        } else if (view === 'monthly') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        } else if (view === 'yearly') {
          key = date.getFullYear().toString()
        }
        
        if (!grouped[key]) grouped[key] = 0
        // Assuming profit is 80% of total (simple calculation)
        grouped[key] += total * 0.8
      })

      const data = Object.entries(grouped)
        .map(([date, profit]) => ({ date, profit }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      setChartData(data)
    } catch (error) {
      console.error('Error fetching profit data:', error)
      // Fallback data
      setChartView('weekly')
      setChartData([
        { date: '2024-01', profit: 15000 },
        { date: '2024-02', profit: 18000 },
        { date: '2024-03', profit: 22000 },
        { date: '2024-04', profit: 19000 },
        { date: '2024-05', profit: 25000 },
        { date: '2024-06', profit: 28000 },
      ])
    }
  }

  const fetchSalesChannelData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, total, source')
        .eq('status', 'completed')

      if (error) throw error

      const grouped = { 'In-store': 0, 'Online': 0 }
      orders.forEach(order => {
        const total = order.total_amount || order.total || 0
        const source = order.source || 'in-store'
        const channel = source === 'online' || source === 'mobile' ? 'Online' : 'In-store'
        grouped[channel] += total
      })

      const data = Object.entries(grouped).map(([channel, sales]) => ({
        channel,
        sales,
        color: channel === 'In-store' ? '#8884d8' : '#82ca9d'
      }))

      setSalesChannelData(data)
    } catch (error) {
      console.error('Error fetching sales channel data:', error)
      // Fallback data
      setSalesChannelData([
        { channel: 'In-store', sales: 45000, color: '#8884d8' },
        { channel: 'Online', sales: 32000, color: '#82ca9d' }
      ])
    }
  }

  const fetchPaymentMethodData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, total, payment_method')
        .eq('status', 'completed')

      if (error) throw error

      const grouped = {}
      orders.forEach(order => {
        const total = order.total_amount || order.total || 0
        const method = order.payment_method || 'Cash'
        if (!grouped[method]) grouped[method] = 0
        grouped[method] += total
      })

      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F']
      const data = Object.entries(grouped).map(([method, value], index) => ({
        name: method,
        value,
        color: colors[index % colors.length]
      }))

      setPaymentMethodData(data)
    } catch (error) {
      console.error('Error fetching payment method data:', error)
      // Fallback data
      setPaymentMethodData([
        { name: 'Cash', value: 40000, color: '#8884d8' },
        { name: 'GCash', value: 37000, color: '#82ca9d' },
        { name: 'Credit Card', value: 28000, color: '#ffc658' }
      ])
    }
  }

  return (
    <div style={pageStyles.container}>
      <div style={pageStyles.header}>
        <div>
          <h1 style={pageStyles.title}>Admin Dashboard</h1>
          <p style={pageStyles.subtitle}>Complete overview of your business</p>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
            Logged in as: <strong>{user?.email}</strong>
          </p>
        </div>
        <div style={pageStyles.notificationContainer}>
          <button
            style={pageStyles.notificationButton}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            {/* Bell icon SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0077b6' }}>
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            </svg>
            {(stats.pendingServiceBookings + stats.pendingOrders) > 0 && (
              <span style={pageStyles.notificationBadge}>
                {stats.pendingServiceBookings + stats.pendingOrders}
              </span>
            )}
          </button>
          {showNotifications && (
            <div style={pageStyles.notificationDropdown}>
              <h4 style={pageStyles.notificationTitle}>Notifications</h4>
              {stats.pendingServiceBookings > 0 && (
                <div style={pageStyles.notificationItem}>
                  <FaCalendarAlt style={{ marginRight: 8, color: '#f59e0b' }} />
                  {stats.pendingServiceBookings} pending booking{stats.pendingServiceBookings > 1 ? 's' : ''}
                </div>
              )}
              {stats.pendingOrders > 0 && (
                <div style={pageStyles.notificationItem}>
                  <FaShoppingBag style={{ marginRight: 8, color: '#3b82f6' }} />
                  {stats.pendingOrders} pending order{stats.pendingOrders > 1 ? 's' : ''}
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div style={pageStyles.notificationItem}>
                  <FaBoxOpen style={{ marginRight: 8, color: '#ef4444' }} />
                  {stats.lowStockProducts} low stock product{stats.lowStockProducts > 1 ? 's' : ''}
                </div>
              )}
              {(stats.pendingServiceBookings + stats.pendingOrders + stats.lowStockProducts) === 0 && (
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
            <FaShoppingBag size={24} color="#0077b6" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Total Sales Today</h3>
            <p style={pageStyles.statNumber}>₱{stats.totalSalesToday.toLocaleString()}</p>
            <small style={pageStyles.statChange}>Today's revenue</small>
          </div>
        </div>

        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#f0fdf4'}}>
            <FaShoppingBag size={24} color="#10b981" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Total Sales This Month</h3>
            <p style={pageStyles.statNumber}>₱{stats.totalSalesThisMonth.toLocaleString()}</p>
            <small style={pageStyles.statChange}>Monthly revenue</small>
          </div>
        </div>

        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#fffbeb'}}>
            <FaCalendarAlt size={24} color="#f59e0b" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Pending Service Bookings</h3>
            <p style={pageStyles.statNumber}>{stats.pendingServiceBookings}</p>
            <small style={pageStyles.statChange}>Awaiting approval</small>
          </div>
        </div>

        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#fef2f2'}}>
            <FaShoppingBag size={24} color="#ef4444" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Pending Orders</h3>
            <p style={pageStyles.statNumber}>{stats.pendingOrders}</p>
            <small style={pageStyles.statChange}>For approval</small>
          </div>
        </div>

        <div style={pageStyles.statCard}>
          <div style={{...pageStyles.statIcon, background: '#fce7f3'}}>
            <FaBoxOpen size={24} color="#db2777" />
          </div>
          <div style={pageStyles.statContent}>
            <h3 style={pageStyles.statLabel}>Low Stock Products</h3>
            <p style={pageStyles.statNumber}>{stats.lowStockProducts}</p>
            <small style={pageStyles.statChange}>Stock ≤ 5</small>
          </div>
        </div>
      </div>

      {/* 🔍 DEBUG BUTTONS */}
      <div style={pageStyles.debugButtons}>
        <button 
          onClick={() => window.location.href = '/dashboard/activity-log'}
          style={{...pageStyles.debugButton, background: '#0077b6'}}
        >
          🚀 Go to Activity Logs
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard/test-debug'}
          style={{...pageStyles.debugButton, background: '#10b981'}}
        >
          🐛 Test Debug Route
        </button>
        <button 
          onClick={() => {
            console.log('🔄 Manual refresh clicked');
            window.location.reload();
          }}
          style={{...pageStyles.debugButton, background: '#f59e0b'}}
        >
          🔄 Refresh Page
        </button>
        <button 
          onClick={() => {
            console.log('📊 Checking console for errors...');
            console.log('User:', user);
            console.log('Stats:', stats);
          }}
          style={{...pageStyles.debugButton, background: '#8b5cf6'}}
        >
          📊 Check Console
        </button>
      </div>

      {/* Profits Chart */}
      <div style={pageStyles.chartSection}>
        <h3 style={pageStyles.sectionTitle}>Profits Trend</h3>
        <div style={pageStyles.chartControls}>
          <button onClick={() => setChartView('weekly')} style={chartView === 'weekly' ? pageStyles.activeButton : pageStyles.button}>Weekly</button>
          <button onClick={() => setChartView('monthly')} style={chartView === 'monthly' ? pageStyles.activeButton : pageStyles.button}>Monthly</button>
          <button onClick={() => setChartView('yearly')} style={chartView === 'yearly' ? pageStyles.activeButton : pageStyles.button}>Yearly</button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Profit']} />
            <Line type="monotone" dataKey="profit" stroke="#0077b6" strokeWidth={2} dot={{ fill: '#0077b6' }} isAnimationActive={true} animationDuration={1000} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sales Channel Chart */}
      <div style={pageStyles.chartSection}>
        <h3 style={pageStyles.sectionTitle}>Sales by Channel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesChannelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="channel" />
            <YAxis />
            <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Sales']} />
            <Bar dataKey="sales">
              {salesChannelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Method Chart */}
      <div style={pageStyles.chartSection}>
        <h3 style={pageStyles.sectionTitle}>Payment Method Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={paymentMethodData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {paymentMethodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Amount']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}