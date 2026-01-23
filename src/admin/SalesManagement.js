import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  FaCalendarCheck, 
  FaShoppingBag, 
  FaFileInvoice, 
  FaUsers, 
  FaChartBar,
  FaDollarSign,
  FaShoppingCart,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaPercentage,
  FaSearch,
  FaFilter,
  FaPrint,
  FaDownload,
  FaEye,
  FaTrash,
  FaEdit,
  FaPlus,
  FaCog,
  FaBell,
  FaChartLine,
  FaCalendar,
  FaStore,
  FaMobileAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaTools,
  FaCar,
  FaCarAlt,
  FaOilCan,
  FaShieldAlt,
  FaUserCircle,
  FaTag,
  FaStar,
  FaList,
  FaThLarge,
  FaSync
} from 'react-icons/fa';


// ====================
// MAIN COMPONENT
// ====================
const SalesManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [realtimeOrders, setRealtimeOrders] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to real-time orders
    const orderSubscription = supabase
      .channel('orders')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setRealtimeOrders(prev => prev + 1);
          // Add notification for new order
          setNotifications(prev => [
            ...prev,
            {
              id: Date.now(),
              type: 'new_order',
              message: `New order #${payload.new.id} received`,
              time: new Date().toLocaleTimeString(),
              read: false
            }
          ]);
        }
      )
      .subscribe();

    return () => {
      orderSubscription.unsubscribe();
    };
  }, []);

  const tabs = [
    { key: 'dashboard', icon: <FaChartBar />, label: 'Dashboard', count: realtimeOrders },
    { key: 'orders', icon: <FaShoppingBag />, label: 'Orders' },
    { key: 'services', icon: <FaTools />, label: 'Services' },
    { key: 'bookings', icon: <FaCalendarCheck />, label: 'Bookings' },
    { key: 'customers', icon: <FaUsers />, label: 'Customers' },
    { key: 'reports', icon: <FaFileInvoice />, label: 'Analytics' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>
              <FaShoppingBag style={{ marginRight: '12px' }} />
              Sales Management
            </h1>
            <p style={styles.subtitle}>Track sales, manage orders, and analyze performance</p>
          </div>
          <div style={styles.headerActions}>
            {notifications.length > 0 && (
              <div style={styles.notificationBadge}>
                {notifications.filter(n => !n.read).length}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.tabContainer}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{
              ...styles.tabButton,
              background: activeTab === tab.key ? 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)' : 'transparent',
              color: activeTab === tab.key ? '#ffffff' : '#023e8a',
              borderBottom: activeTab === tab.key ? '3px solid #0077b6' : 'none',
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span style={styles.tabLabel}>{tab.label}</span>
            {tab.count > 0 && (
              <span style={styles.tabBadge}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'orders' && <OrdersScreen />}
        {activeTab === 'services' && <ServicesScreen />}
        {activeTab === 'bookings' && <BookingManagement />}
        {activeTab === 'customers' && <CustomersScreen />}
        {activeTab === 'reports' && <AnalyticsScreen />}
      </div>
    </div>
  );
};

// ====================
// DASHBOARD SCREEN COMPONENT
// ====================
const DashboardScreen = () => {
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    conversionRate: 0,
    monthlyRevenue: [],
    topServices: [],
    recentOrders: [],
    todayOrders: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [services, setServices] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let dateFilter = new Date();
      switch(timeRange) {
        case 'today':
          dateFilter.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'quarter':
          dateFilter.setMonth(dateFilter.getMonth() - 3);
          break;
        case 'year':
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          break;
      }

      // Fetch orders with service data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('users')
        .select('id, created_at')
        .gte('created_at', dateFilter.toISOString());

      if (customersError) throw customersError;

      // Fetch services for top services calculation
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('price', { ascending: false });

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Calculate metrics
      const totalRevenue = ordersData?.reduce((sum, order) => 
        sum + (order.total_amount || order.total || 0), 0) || 0;

      const totalOrders = ordersData?.length || 0;
      const totalCustomers = customersData?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;
      const completedOrders = ordersData?.filter(order => order.status === 'completed').length || 0;
      const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

      // Calculate today's metrics
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayOrdersData = ordersData?.filter(order => 
        new Date(order.created_at) >= todayStart
      ) || [];
      const todayOrders = todayOrdersData.length;
      const todayRevenue = todayOrdersData.reduce((sum, order) => sum + (order.total_amount || order.total || 0), 0);

      // Calculate monthly revenue
      const monthlyRevenue = calculateMonthlyRevenue(ordersData || []);
      
      // Calculate top services from order items
      const serviceRevenue = {};
      ordersData?.forEach(order => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach(item => {
            if (item.service_id) {
              const serviceName = servicesData?.find(s => s.id === item.service_id)?.name || `Service #${item.service_id}`;
              if (!serviceRevenue[serviceName]) {
                serviceRevenue[serviceName] = { revenue: 0, orders: 0 };
              }
              serviceRevenue[serviceName].revenue += (item.quantity || 1) * (item.price || 0);
              serviceRevenue[serviceName].orders += 1;
            }
          });
        }
      });

      const topServices = Object.entries(serviceRevenue)
        .map(([name, data]) => ({
          name,
          revenue: data.revenue,
          orders: data.orders
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      // Get recent orders
      const recentOrders = ordersData?.slice(0, 5).map(order => ({
        ...order,
        customer_name: order.customer_name || 'Walk-in Customer',
        customer_phone: order.customer_phone || 'N/A',
        channel: order.channel || 'walk-in',
        total: order.total_amount || order.total || 0
      })) || [];

      setDashboardData({
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        pendingOrders,
        completedOrders,
        conversionRate,
        monthlyRevenue,
        topServices,
        recentOrders,
        todayOrders,
        todayRevenue
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const calculateMonthlyRevenue = (orders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthOrders = orders.filter(order => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === index && orderDate.getFullYear() === new Date().getFullYear();
      });
      
      const revenue = monthOrders.reduce((sum, order) => sum + (order.total_amount || order.total || 0), 0);
      
      return {
        month,
        revenue,
        growth: index > 0 ? ((revenue / (dashboardData.monthlyRevenue[index-1]?.revenue || 1) - 1) * 100) || 0 : 0
      };
    });
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      {/* Header with Refresh */}
      <div style={styles.dashboardHeader}>
        <h2 style={styles.dashboardTitle}>Sales Overview</h2>
        <div style={styles.headerControls}>
          <div style={styles.timeRangeSelector}>
            {['today', 'week', 'month', 'quarter', 'year'].map(range => (
              <button
                key={range}
                style={{
                  ...styles.timeRangeButton,
                  background: timeRange === range ? '#0077b6' : '#f8fafc',
                  color: timeRange === range ? '#ffffff' : '#374151'
                }}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button style={styles.refreshButton} onClick={refreshDashboard}>
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Today's Stats */}
      <div style={styles.todayStats}>
        <div style={styles.todayStatCard}>
          <div style={styles.todayStatIcon}>
            <FaShoppingCart size={24} color="#0077b6" />
          </div>
          <div>
            <div style={styles.todayStatLabel}>Today's Orders</div>
            <div style={styles.todayStatValue}>{dashboardData.todayOrders}</div>
          </div>
        </div>
        <div style={styles.todayStatCard}>
          <div style={styles.todayStatIcon}>
            <FaDollarSign size={24} color="#10b981" />
          </div>
          <div>
            <div style={styles.todayStatLabel}>Today's Revenue</div>
            <div style={styles.todayStatValue}>₱{dashboardData.todayRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        {[
          {
            title: 'Total Revenue',
            value: `₱${dashboardData.totalRevenue.toLocaleString()}`,
            change: '+12.5%',
            icon: <FaDollarSign />,
            color: '#065f46',
            bgColor: '#d1fae5'
          },
          {
            title: 'Total Orders',
            value: dashboardData.totalOrders,
            change: '+8.3%',
            icon: <FaShoppingCart />,
            color: '#1d4ed8',
            bgColor: '#dbeafe'
          },
          {
            title: 'Total Customers',
            value: dashboardData.totalCustomers,
            change: '+5.7%',
            icon: <FaUsers />,
            color: '#92400e',
            bgColor: '#fef3c7'
          },
          {
            title: 'Avg Order Value',
            value: `₱${dashboardData.averageOrderValue.toFixed(2)}`,
            change: '+4.2%',
            icon: <FaChartLine />,
            color: '#be185d',
            bgColor: '#fce7f3'
          },
          {
            title: 'Pending Orders',
            value: dashboardData.pendingOrders,
            change: '-2.1%',
            icon: <FaClock />,
            color: '#991b1b',
            bgColor: '#fee2e2'
          },
          {
            title: 'Completed Orders',
            value: dashboardData.completedOrders,
            change: '+15.8%',
            icon: <FaCheckCircle />,
            color: '#166534',
            bgColor: '#dcfce7'
          }
        ].map((kpi, index) => (
          <div key={index} style={styles.kpiCard}>
            <div style={{ ...styles.kpiIcon, background: kpi.bgColor }}>
              {React.cloneElement(kpi.icon, { size: 24, color: kpi.color })}
            </div>
            <div style={styles.kpiContent}>
              <div style={styles.kpiLabel}>{kpi.title}</div>
              <div style={styles.kpiValue}>{kpi.value}</div>
              <div style={styles.kpiChange}>
                {kpi.change.startsWith('+') ? (
                  <FaArrowUp size={12} color="#10b981" />
                ) : (
                  <FaArrowDown size={12} color="#ef4444" />
                )}
                <span style={{ 
                  color: kpi.change.startsWith('+') ? '#10b981' : '#ef4444',
                  marginLeft: '4px'
                }}>
                  {kpi.change} from last {timeRange}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Data */}
      <div style={styles.chartsGrid}>
        {/* Revenue Chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Monthly Revenue Trend</h3>
            <div style={styles.chartTimeRange}>{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}ly</div>
          </div>
          <div style={styles.chartContent}>
            <div style={styles.revenueChart}>
              {dashboardData.monthlyRevenue.slice(-6).map((item, index) => (
                <div key={index} style={styles.revenueBarContainer}>
                  <div style={styles.revenueBarLabel}>{item.month}</div>
                  <div style={styles.revenueBarWrapper}>
                    <div 
                      style={{
                        ...styles.revenueBar,
                        height: `${Math.min(100, (item.revenue / 10000) * 100)}%`,
                        background: item.growth > 0 
                          ? 'linear-gradient(to top, #0077b6, #00b4d8)'
                          : 'linear-gradient(to top, #ef4444, #f87171)'
                      }}
                    >
                      <div style={styles.revenueBarValue}>₱{item.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={styles.revenueGrowth}>
                    {item.growth > 0 ? (
                      <FaArrowUp size={10} color="#10b981" />
                    ) : (
                      <FaArrowDown size={10} color="#ef4444" />
                    )}
                    <span style={{ 
                      color: item.growth > 0 ? '#10b981' : '#ef4444',
                      fontSize: '11px',
                      marginLeft: '2px'
                    }}>
                      {Math.abs(item.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Services */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Top Performing Services</h3>
            <button style={styles.viewAllButton}>View Details</button>
          </div>
          <div style={styles.chartContent}>
            <div style={styles.topServicesList}>
              {dashboardData.topServices.map((service, index) => (
                <div key={index} style={styles.topServiceItem}>
                  <div style={styles.serviceRank}>{index + 1}</div>
                  <div style={styles.serviceInfo}>
                    <div style={styles.serviceName}>{service.name}</div>
                    <div style={styles.serviceStats}>
                      <span style={styles.serviceOrders}>{service.orders} orders</span>
                    </div>
                  </div>
                  <div style={styles.serviceRevenue}>
                    <div style={styles.revenueAmount}>₱{service.revenue.toLocaleString()}</div>
                    <div style={styles.revenuePercentage}>
                      {((service.revenue / dashboardData.totalRevenue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div style={{ ...styles.chartCard, gridColumn: 'span 2' }}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Recent Orders</h3>
            <button style={styles.viewAllButton}>View All</button>
          </div>
          <div style={styles.chartContent}>
            <div style={styles.recentOrdersTable}>
              <div style={styles.tableHeader}>
                <div style={styles.tableCell}>Order #</div>
                <div style={styles.tableCell}>Customer</div>
                <div style={styles.tableCell}>Date</div>
                <div style={styles.tableCell}>Amount</div>
                <div style={styles.tableCell}>Status</div>
                <div style={styles.tableCell}>Channel</div>
              </div>
              {dashboardData.recentOrders.map((order, index) => (
                <div key={index} style={styles.tableRow}>
                  <div style={styles.tableCell}>
                    <span style={styles.orderId}>#{order.id?.toString().substring(0, 8) || 'N/A'}</span>
                  </div>
                  <div style={styles.tableCell}>
                    <div style={styles.customerCell}>
                      <FaUserCircle size={16} color="#6b7280" />
                      <span>{order.customer_name || 'Walk-in Customer'}</span>
                    </div>
                  </div>
                  <div style={styles.tableCell}>
                    {new Date(order.created_at).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div style={styles.tableCell}>
                    <span style={styles.amountCell}>₱{order.total?.toLocaleString() || 0}</span>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={{
                      ...styles.statusBadge,
                      background: getStatusColor(order.status).background,
                      color: getStatusColor(order.status).color
                    }}>
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                    </span>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={{
                      ...styles.channelBadge,
                      background: order.channel === 'mobile' ? '#e0f2fe' : '#f0f9ff',
                      color: order.channel === 'mobile' ? '#0369a1' : '#0c4a6e'
                    }}>
                      {order.channel === 'mobile' ? <FaMobileAlt /> : <FaStore />}
                      {order.channel === 'mobile' ? ' Mobile' : ' In-store'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================
// ORDERS SCREEN COMPONENT
// ====================
const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  
  // ... other state variables ...

  // Fetch orders from database
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setDebugInfo('🔄 Fetching orders...');
      console.log('🔄 Fetching orders...');
      
      // First, let's check if we can connect to supabase
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection error:', testError);
        setDebugInfo(`❌ Connection error: ${testError.message}`);
        return;
      }
      
      console.log('✅ Supabase connection successful');
      setDebugInfo('✅ Connected to database');
      
      // Fetch orders with all details
      const { data, error, count } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            services (name, description, category, duration)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching orders:', error);
        setDebugInfo(`❌ Fetch error: ${error.message}`);
        throw error;
      }
      
      console.log(`✅ Successfully fetched ${data?.length || 0} orders:`, data);
      setDebugInfo(`✅ Found ${data?.length || 0} orders in database`);
      
      // If data is empty, try fetching without joins
      if (!data || data.length === 0) {
        console.log('⚠️ No orders found with joins, trying without...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (simpleError) {
          throw simpleError;
        }
        
        console.log(`✅ Found ${simpleData?.length || 0} orders (simple query):`, simpleData);
        setDebugInfo(`✅ Found ${simpleData?.length || 0} orders (simple query)`);
        setOrders(simpleData || []);
        return;
      }
      
      setOrders(data || []);
      
    } catch (error) {
      console.error('💥 Error in fetchOrders:', error);
      setDebugInfo(`💥 Error: ${error.message}`);
      
      // Try alternative approach
      try {
        console.log('🔄 Trying alternative query...');
        const { data: altData } = await supabase
          .from('orders')
          .select('id, customer_name, status, total, created_at')
          .order('created_at', { ascending: false })
          .limit(50);
          
        console.log('Alternative query result:', altData);
        setOrders(altData || []);
        setDebugInfo(`✅ Found ${altData?.length || 0} orders (alternative query)`);
      } catch (altError) {
        console.error('Alternative query failed:', altError);
      }
    } finally {
      setLoading(false);
    }
  };

  // On component mount
  useEffect(() => {
    console.log('📦 OrdersScreen mounted');
    fetchOrders();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);
          setDebugInfo(`📡 Real-time: ${payload.eventType} order #${payload.new?.id}`);
          fetchOrders(); // Refresh orders on any change
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ... rest of the component code ...

  // Add a debug panel to see what's happening
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0',
          fontSize: '14px',
          color: '#475569'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Debug Info:</strong>
            <button 
              onClick={fetchOrders}
              style={{
                background: '#0077b6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Refresh Data
            </button>
          </div>
          <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
            {debugInfo || 'No debug info yet'}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            Orders in state: {orders.length} | Loading: {loading.toString()}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.screenContainer}>
      <div style={styles.screenHeader}>
        <div>
          <h2 style={styles.screenTitle}>Admin Order Management</h2>
          <p style={styles.screenSubtitle}>
            {loading ? 'Loading...' : `${orders.length} orders found`}
          </p>
        </div>
        <div style={styles.screenActions}>
          <button style={styles.refreshButton} onClick={fetchOrders}>
            <FaSync /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {renderDebugInfo()}

      {/* Show loading state */}
      {loading && orders.length === 0 ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading orders from database...</p>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '10px' }}>
            {debugInfo}
          </p>
        </div>
      ) : (
        // Show orders table when data is loaded
        <div style={styles.ordersTableContainer}>
          <table style={styles.ordersTable}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: '#6b7280'
                  }}>
                    <div style={{ marginBottom: '16px' }}>
                      <FaShoppingBag size={48} color="#d1d5db" />
                    </div>
                    <h3 style={{ marginBottom: '8px' }}>No Orders Found</h3>
                    <p style={{ marginBottom: '20px' }}>
                      There are no orders in the database yet.
                    </p>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '16px', 
                      borderRadius: '8px',
                      textAlign: 'left',
                      maxWidth: '500px',
                      margin: '0 auto'
                    }}>
                      <h4 style={{ marginBottom: '8px' }}>Debug Tips:</h4>
                      <ul style={{ 
                        margin: '0', 
                        paddingLeft: '20px',
                        fontSize: '14px'
                      }}>
                        <li>Check if orders table exists in Supabase</li>
                        <li>Verify your Supabase connection settings</li>
                        <li>Check browser console for errors</li>
                        <li>Try creating a test order first</li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.orderId}>#{order.id}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.customerCell}>
                        <div style={styles.customerName}>
                          {order.customer_name || 'Walk-in Customer'}
                        </div>
                        <div style={styles.customerContact}>
                          {order.customer_phone || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.amountCell}>
                        ₱{order.total?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: getStatusColor(order.status).background,
                        color: getStatusColor(order.status).color
                      }}>
                        {order.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.viewButton}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetails(true);
                        }}
                      >
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}


      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Order Details #{selectedOrder.id}</h2>
              <button style={styles.closeButton} onClick={() => setShowDetails(false)}>
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              {/* Quick Actions Bar */}
              <div style={styles.quickActions}>
                {selectedOrder.status === 'pending' && (
                  <>
                    <button 
                      style={styles.quickAcceptButton}
                      onClick={() => acceptOrder(selectedOrder.id)}
                    >
                      <FaCheckCircle /> Accept Order
                    </button>
                    <button 
                      style={styles.quickDeclineButton}
                      onClick={() => {
                        setShowDetails(false);
                        setShowActionPanel(true);
                      }}
                    >
                      <FaTimesCircle /> Decline Order
                    </button>
                  </>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button 
                    style={styles.quickProgressButton}
                    onClick={() => markInProgress(selectedOrder.id)}
                  >
                    <FaClock /> Start Progress
                  </button>
                )}
                {selectedOrder.status === 'in_progress' && (
                  <button 
                    style={styles.quickCompleteButton}
                    onClick={() => completeOrder(selectedOrder.id)}
                  >
                    <FaCheckCircle /> Mark Complete
                  </button>
                )}
              </div>

              {/* Order Information */}
              <div style={styles.orderInfoGrid}>
                <div style={styles.infoGroup}>
                  <h3 style={styles.infoTitle}>Customer Information</h3>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Name:</span>
                    <span style={styles.infoValue}>{selectedOrder.customer_name || 'Walk-in Customer'}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Phone:</span>
                    <span style={styles.infoValue}>{selectedOrder.customer_phone || 'N/A'}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Email:</span>
                    <span style={styles.infoValue}>{selectedOrder.customer_email || 'N/A'}</span>
                  </div>
                </div>

                <div style={styles.infoGroup}>
                  <h3 style={styles.infoTitle}>Order Information</h3>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Status:</span>
                    <span style={{
                      ...styles.statusBadge,
                      background: getStatusColor(selectedOrder.status).background,
                      color: getStatusColor(selectedOrder.status).color
                    }}>
                      {selectedOrder.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Channel:</span>
                    <span style={styles.infoValue}>{selectedOrder.channel || 'walk-in'}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Payment:</span>
                    <span style={styles.infoValue}>{selectedOrder.payment_method || 'cash'}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Order Date:</span>
                    <span style={styles.infoValue}>
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div style={styles.itemsSection}>
                <h3 style={styles.sectionTitle}>Order Items</h3>
                <div style={styles.itemsTable}>
                  {selectedOrder.order_items?.map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                      <div style={styles.itemInfo}>
                        <div style={styles.itemName}>
                          {item.services?.name || `Service #${item.service_id}`}
                        </div>
                        <div style={styles.itemDescription}>
                          {item.services?.description || 'Service item'}
                          {item.services?.duration && (
                            <span style={{marginLeft: '8px', color: '#6b7280'}}>
                              ({item.services.duration} mins)
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={styles.itemDetails}>
                        <div style={styles.itemQuantity}>Qty: {item.quantity || 1}</div>
                        <div style={styles.itemPrice}>₱{item.price?.toLocaleString() || 0} each</div>
                        <div style={styles.itemTotal}>
                          ₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                      No items found in this order
                    </div>
                  )}
                </div>
              </div>

              {/* Order Total */}
              <div style={styles.totalSection}>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Subtotal:</span>
                  <span style={styles.totalValue}>₱{selectedOrder.subtotal?.toLocaleString() || '0'}</span>
                </div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Tax:</span>
                  <span style={styles.totalValue}>₱{selectedOrder.tax?.toLocaleString() || '0'}</span>
                </div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Discount:</span>
                  <span style={styles.totalValue}>-₱{selectedOrder.discount?.toLocaleString() || '0'}</span>
                </div>
                <div style={{...styles.totalRow, borderTop: '2px solid #e5e7eb', paddingTop: '12px'}}>
                  <span style={{...styles.totalLabel, fontWeight: 'bold', fontSize: '18px'}}>Total:</span>
                  <span style={{...styles.totalValue, fontSize: '24px', fontWeight: 'bold', color: '#0077b6'}}>
                    ₱{calculateOrderTotal(selectedOrder).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedOrder.admin_notes && (
                <div style={styles.notesSection}>
                  <h3 style={styles.sectionTitle}>Admin Notes</h3>
                  <div style={styles.notesBox}>
                    {selectedOrder.admin_notes}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button style={styles.printButton} onClick={() => window.print()}>
                <FaPrint /> Print Receipt
              </button>
              <button style={styles.closeModalButton} onClick={() => setShowDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Panel for Decline/Cancel */}
      {showActionPanel && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.actionModal}>
            <div style={styles.modalHeader}>
              <h3>
                {selectedOrder.status === 'pending' ? 'Decline Order' : 'Cancel Order'} #{selectedOrder.id}
              </h3>
              <button 
                style={styles.closeButton} 
                onClick={() => {
                  setShowActionPanel(false);
                  setActionMessage('');
                }}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.warningBox}>
                <FaTimesCircle size={24} color="#ef4444" />
                <div>
                  <h4 style={{margin: '0 0 8px 0', color: '#991b1b'}}>
                    {selectedOrder.status === 'pending' ? 'Decline Order' : 'Cancel Order'}
                  </h4>
                  <p style={{margin: 0, color: '#6b7280'}}>
                    {selectedOrder.status === 'pending' 
                      ? 'This order will be marked as declined. Please provide a reason for declining.'
                      : 'This order will be cancelled. Please provide a reason for cancellation.'}
                  </p>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  Reason for {selectedOrder.status === 'pending' ? 'declining' : 'cancelling'} *
                </label>
                <textarea
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  style={styles.actionTextarea}
                  placeholder="Enter reason for declining/cancelling this order..."
                  rows="4"
                  required
                />
              </div>

              <div style={styles.actionModalButtons}>
                <button
                  style={styles.cancelActionButton}
                  onClick={() => {
                    setShowActionPanel(false);
                    setActionMessage('');
                  }}
                  disabled={processingAction}
                >
                  Go Back
                </button>
                <button
                  style={styles.confirmActionButton}
                  onClick={() => declineOrder(selectedOrder.id, actionMessage)}
                  disabled={!actionMessage.trim() || processingAction}
                >
                  {processingAction ? 'Processing...' : 'Confirm ' + 
                    (selectedOrder.status === 'pending' ? 'Decline' : 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================
// SERVICES SCREEN COMPONENT
// ====================
const ServicesScreen = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'maintenance',
    price: 0,
    duration: 60,
    active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('price', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration)
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        alert('Service updated successfully!');
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
        alert('Service added successfully!');
      }

      fetchServices();
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'maintenance',
      price: 0,
      duration: 60,
      active: true
    });
    setEditingService(null);
    setShowForm(false);
  };

  const editService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      duration: service.duration,
      active: service.active
    });
    setShowForm(true);
  };

  const toggleServiceStatus = async (serviceId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev => prev.map(service => 
        service.id === serviceId ? { ...service, active: !currentStatus } : service
      ));
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Error updating service: ' + error.message);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'maintenance':
        return <FaOilCan />;
      case 'repair':
        return <FaTools />;
      case 'tires':
        return <FaCarAlt />;
      case 'car_wash':
        return <FaCar />;
      case 'inspection':
        return <FaShieldAlt />;
      default:
        return <FaTag />;
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading services...</p>
      </div>
    );
  }

  return (
    <div style={styles.screenContainer}>
      <div style={styles.screenHeader}>
        <div>
          <h2 style={styles.screenTitle}>Service Management</h2>
          <p style={styles.screenSubtitle}>{services.length} services available</p>
        </div>
        <button 
          style={styles.addButton} 
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Add Service
        </button>
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button style={styles.closeButton} onClick={resetForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Service Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={styles.formInput}
                    required
                    placeholder="e.g., Oil Change, Tire Rotation"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={styles.formInput}
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="tires">Tires</option>
                    <option value="car_wash">Car Wash</option>
                    <option value="inspection">Inspection</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Price (₱) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={styles.formInput}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    style={styles.formInput}
                    min="1"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.formTextarea}
                  placeholder="Describe the service details..."
                  rows="3"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  Active (Available for booking)
                </label>
              </div>

              <div style={styles.formActions}>
                <button 
                  type="button" 
                  style={styles.cancelButton}
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.submitButton}
                >
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div style={styles.servicesGrid}>
        {services.map(service => (
          <div key={service.id} style={styles.serviceCard}>
            <div style={styles.serviceCardHeader}>
              <div style={{
                ...styles.serviceIcon,
                background: getCategoryColor(service.category)
              }}>
                {getCategoryIcon(service.category)}
              </div>
              <div style={styles.serviceStatus}>
                <div style={{
                  ...styles.statusDot,
                  background: service.active ? '#10b981' : '#ef4444'
                }} />
                <span>{service.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            <div style={styles.serviceCardBody}>
              <h3 style={styles.serviceName}>{service.name}</h3>
              <p style={styles.serviceDescription}>{service.description || 'No description provided.'}</p>
              
              <div style={styles.serviceDetails}>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Category</div>
                  <div style={styles.detailValue}>
                    <span style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {service.category}
                    </span>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Duration</div>
                  <div style={styles.detailValue}>{service.duration} min</div>
                </div>
              </div>
            </div>

            <div style={styles.serviceCardFooter}>
              <div style={styles.servicePrice}>
                <div style={styles.priceLabel}>Price</div>
                <div style={styles.priceValue}>₱{service.price.toLocaleString()}</div>
              </div>
              <div style={styles.serviceActions}>
                <button
                  style={styles.editButton}
                  onClick={() => editService(service)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  style={service.active ? styles.deactivateButton : styles.activateButton}
                  onClick={() => toggleServiceStatus(service.id, service.active)}
                >
                  {service.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================
// BOOKING MANAGEMENT COMPONENT
// ====================
const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching bookings...');
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('❌ Bookings fetch error:', bookingsError);
        alert('Error loading bookings: ' + bookingsError.message);
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log(`✅ Found ${bookingsData?.length || 0} bookings:`, bookingsData);

      const formattedBookings = (bookingsData || []).map(booking => ({
        id: booking.id,
        customer_name: booking.name || 'Guest',
        customer_email: booking.email || 'No email',
        customer_phone: booking.contact || 'No phone',
        service_name: booking.service || 'General Service',
        scheduled_date: booking.date || new Date().toISOString().split('T')[0],
        scheduled_time: booking.time || '10:00',
        status: booking.status || 'pending',
        notes: booking.message || '',
        location: booking.location || 'N/A',
        created_at: booking.created_at
      }));

      setBookings(formattedBookings);
      
    } catch (error) {
      console.error('💥 Error in fetchBookings:', error);
      alert('Failed to load bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      console.log('Updating booking status:', { bookingId, newStatus });
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      alert(`Booking marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status: ' + error.message);
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking: ' + error.message);
    }
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone?.includes(searchTerm) ||
        booking.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    return filtered;
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div style={styles.screenContainer}>
      <div style={styles.screenHeader}>
        <div>
          <h2 style={styles.screenTitle}>Booking Management</h2>
          <p style={styles.screenSubtitle}>Manage customer appointments and schedules</p>
        </div>
        <div style={styles.screenActions}>
          <button style={styles.refreshButton} onClick={fetchBookings}>
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ background: '#e0f2fe', padding: '16px', borderRadius: '10px' }}>
            <FaCalendarCheck size={24} color="#0077b6" />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Bookings</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.total}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '10px' }}>
            <FaClock size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Pending</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.pending}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '10px' }}>
            <FaCheckCircle size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Confirmed</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.confirmed}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '10px' }}>
            <FaTimesCircle size={24} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Cancelled</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersPanel}>
        <div style={styles.filterRow}>
          <div style={styles.searchGroup}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by customer name, email, phone, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            style={styles.clearButton}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            <FaFilter /> Clear Filters
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div style={styles.ordersTable}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Service</th>
              <th style={styles.th}>Date & Time</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  No bookings found
                </td>
              </tr>
            ) : (
              filteredBookings.map(booking => {
                const statusColor = getStatusColor(booking.status);
                return (
                  <tr key={booking.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.customerCell}>
                        <div style={styles.customerName}>{booking.customer_name}</div>
                        <div style={styles.customerEmail}>{booking.customer_email}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>{booking.service_name}</div>
                      <small style={{ color: '#6b7280' }}>{booking.location}</small>
                    </td>
                    <td style={styles.td}>
                      <div>{new Date(booking.scheduled_date).toLocaleDateString()}</div>
                      <small style={{ color: '#6b7280' }}>{booking.scheduled_time}</small>
                    </td>
                    <td style={styles.td}>
                      <div>{booking.customer_phone}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: statusColor.background,
                        color: statusColor.color
                      }}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        {booking.status === 'pending' && (
                          <button
                            style={styles.confirmButton}
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            title="Confirm booking"
                          >
                            <FaCheckCircle />
                          </button>
                        )}

                        {booking.status === 'confirmed' && (
                          <button
                            style={styles.completeButton}
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            title="Mark as completed"
                          >
                            ✓
                          </button>
                        )}

                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button
                            style={styles.cancelButtonSmall}
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            title="Cancel booking"
                          >
                            <FaTimesCircle />
                          </button>
                        )}

                        <button
                          style={styles.deleteButton}
                          onClick={() => deleteBooking(booking.id)}
                          title="Delete booking"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ====================
// CUSTOMERS SCREEN
// ====================
const CustomersScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          created_at,
          profiles (full_name, phone, address)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const { data: ordersData } = await supabase
        .from('orders')
        .select('customer_id, total');

      const orderTotals = {};
      const orderCounts = {};
      ordersData?.forEach(order => {
        if (order.customer_id) {
          orderTotals[order.customer_id] = (orderTotals[order.customer_id] || 0) + (order.total || 0);
          orderCounts[order.customer_id] = (orderCounts[order.customer_id] || 0) + 1;
        }
      });

      const enrichedCustomers = usersData.map(user => ({
        id: user.id,
        email: user.email,
        name: user.profiles?.full_name || 'Unknown',
        phone: user.profiles?.phone || 'N/A',
        address: user.profiles?.address || 'N/A',
        joined_date: new Date(user.created_at).toLocaleDateString(),
        total_orders: orderCounts[user.id] || 0,
        total_spent: orderTotals[user.id] || 0,
        last_order: 'N/A'
      }));

      setCustomers(enrichedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading customers...</p>
      </div>
    );
  }

  return (
    <div style={styles.screenContainer}>
      <div style={styles.screenHeader}>
        <div>
          <h2 style={styles.screenTitle}>Customer Management</h2>
          <p style={styles.screenSubtitle}>{customers.length} customers registered</p>
        </div>
        <button style={styles.exportButton}>
          <FaDownload /> Export Customers
        </button>
      </div>

      <div style={styles.customersTable}>
        <div style={styles.tableHeader}>
          <div style={styles.tableCell}>Customer</div>
          <div style={styles.tableCell}>Contact</div>
          <div style={styles.tableCell}>Joined Date</div>
          <div style={styles.tableCell}>Total Orders</div>
          <div style={styles.tableCell}>Total Spent</div>
          <div style={styles.tableCell}>Actions</div>
        </div>
        {customers.map((customer, index) => (
          <div key={index} style={styles.tableRow}>
            <div style={styles.tableCell}>
              <div style={styles.customerCell}>
                <div style={styles.customerAvatar}>
                  {customer.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={styles.customerName}>{customer.name}</div>
                  <div style={styles.customerEmail}>{customer.email}</div>
                </div>
              </div>
            </div>
            <div style={styles.tableCell}>
              <div style={styles.contactCell}>
                <div style={styles.contactPhone}>{customer.phone}</div>
                <div style={styles.contactAddress}>{customer.address}</div>
              </div>
            </div>
            <div style={styles.tableCell}>{customer.joined_date}</div>
            <div style={styles.tableCell}>
              <span style={styles.orderCount}>{customer.total_orders}</span>
            </div>
            <div style={styles.tableCell}>
              <span style={styles.totalSpent}>₱{customer.total_spent.toLocaleString()}</span>
            </div>
            <div style={styles.tableCell}>
              <button style={styles.viewCustomerButton}>
                <FaEye /> View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================
// ANALYTICS SCREEN
// ====================
const AnalyticsScreen = () => {
  const [analyticsData, setAnalyticsData] = useState({
    salesTrend: [],
    topCustomers: [],
    servicePerformance: [],
    revenueByChannel: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [ordersResponse, customersResponse, servicesResponse] = await Promise.all([
        supabase.from('orders').select('*').gte('created_at', getDateFilter()),
        supabase.from('users').select('id, email, created_at'),
        supabase.from('services').select('*')
      ]);

      const salesTrend = processSalesTrend(ordersResponse.data || []);
      const topCustomers = processTopCustomers(ordersResponse.data || []);
      const servicePerformance = processServicePerformance(ordersResponse.data || []);
      const revenueByChannel = processRevenueByChannel(ordersResponse.data || []);

      setAnalyticsData({
        salesTrend,
        topCustomers,
        servicePerformance,
        revenueByChannel
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const date = new Date();
    switch(dateRange) {
      case 'week': date.setDate(date.getDate() - 7); break;
      case 'month': date.setMonth(date.getMonth() - 1); break;
      case 'quarter': date.setMonth(date.getMonth() - 3); break;
      case 'year': date.setFullYear(date.getFullYear() - 1); break;
    }
    return date.toISOString();
  };

  const processSalesTrend = (orders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthOrders = orders.filter(order => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === index && orderDate.getFullYear() === new Date().getFullYear();
      });
      
      const revenue = monthOrders.reduce((sum, order) => sum + (order.total_amount || order.total || 0), 0);
      
      return {
        month,
        revenue,
        orders: monthOrders.length
      };
    });
  };

  const processTopCustomers = (orders) => {
    const customerTotals = {};
    
    orders.forEach(order => {
      if (order.customer_id) {
        if (!customerTotals[order.customer_id]) {
          customerTotals[order.customer_id] = {
            id: order.customer_id,
            name: order.customer_name || 'Unknown',
            total: 0,
            orders: 0
          };
        }
        customerTotals[order.customer_id].total += order.total_amount || order.total || 0;
        customerTotals[order.customer_id].orders += 1;
      }
    });

    return Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const processServicePerformance = (orders) => {
    const servicePerformance = {};
    
    orders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach(item => {
          const serviceName = item.services?.name || `Service #${item.service_id}`;
          if (!servicePerformance[serviceName]) {
            servicePerformance[serviceName] = {
              name: serviceName,
              revenue: 0,
              orders: 0
            };
          }
          servicePerformance[serviceName].revenue += (item.quantity || 1) * (item.price || 0);
          servicePerformance[serviceName].orders += 1;
        });
      }
    });

    return Object.values(servicePerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const processRevenueByChannel = (orders) => {
    const channelRevenue = {};
    
    orders.forEach(order => {
      const channel = order.channel || 'walk-in';
      if (!channelRevenue[channel]) {
        channelRevenue[channel] = {
          channel,
          revenue: 0,
          orders: 0
        };
      }
      channelRevenue[channel].revenue += order.total_amount || order.total || 0;
      channelRevenue[channel].orders += 1;
    });

    return Object.values(channelRevenue);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={styles.screenContainer}>
      <div style={styles.screenHeader}>
        <h2 style={styles.screenTitle}>Sales Analytics</h2>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          style={styles.analyticsSelect}
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div style={styles.analyticsGrid}>
        <div style={styles.analyticsCard}>
          <h3 style={styles.analyticsTitle}>Sales Trend</h3>
          <div style={styles.chartPlaceholder}>
            <FaChartLine size={48} color="#d1d5db" />
            <p>Revenue: ₱{analyticsData.salesTrend.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}</p>
            <p>Orders: {analyticsData.salesTrend.reduce((sum, item) => sum + item.orders, 0)}</p>
          </div>
        </div>

        <div style={styles.analyticsCard}>
          <h3 style={styles.analyticsTitle}>Top Customers</h3>
          <div style={styles.chartPlaceholder}>
            <FaUsers size={48} color="#d1d5db" />
            {analyticsData.topCustomers.slice(0, 3).map((customer, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <div>{customer.name}</div>
                <small>₱{customer.total.toLocaleString()}</small>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.analyticsCard}>
          <h3 style={styles.analyticsTitle}>Service Performance</h3>
          <div style={styles.chartPlaceholder}>
            <FaTools size={48} color="#d1d5db" />
            {analyticsData.servicePerformance.slice(0, 3).map((service, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <div>{service.name}</div>
                <small>₱{service.revenue.toLocaleString()}</small>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.analyticsCard}>
          <h3 style={styles.analyticsTitle}>Revenue by Channel</h3>
          <div style={styles.chartPlaceholder}>
            <FaShoppingBag size={48} color="#d1d5db" />
            {analyticsData.revenueByChannel.map((channel, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <div>{channel.channel}</div>
                <small>₱{channel.revenue.toLocaleString()}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================
// HELPER FUNCTIONS
// ====================
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return { background: '#fef3c7', color: '#92400e' };
    case 'confirmed':
      return { background: '#dbeafe', color: '#1e40af' };
    case 'in_progress':
      return { background: '#f0f9ff', color: '#0369a1' };
    case 'completed':
      return { background: '#d1fae5', color: '#065f46' };
    case 'cancelled':
      return { background: '#fee2e2', color: '#991b1b' };
    default:
      return { background: '#f3f4f6', color: '#6b7280' };
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'maintenance':
      return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    case 'repair':
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    case 'tires':
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    case 'car_wash':
      return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    case 'inspection':
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    default:
      return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  }
};

// ====================
// STYLES
// ====================
const styles = {


  
  container: {
    background: '#f8fafc',
    minHeight: '100vh',
    padding: '24px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 10px 25px rgba(30, 58, 138, 0.15)',
    color: 'white',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.9,
    margin: 0,
    fontWeight: '400'
  },
  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  notificationBadge: {
    background: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  tabContainer: {
    display: 'flex',
    background: 'white',
    borderRadius: '12px',
    padding: '8px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    overflowX: 'auto',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flex: 1,
    justifyContent: 'center',
    minWidth: '120px',
  },
  tabIcon: {
    fontSize: '18px',
  },
  tabLabel: {
    fontSize: '15px',
  },
  tabBadge: {
    background: '#ef4444',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center',
  },
  content: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    textAlign: 'center',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #0077b6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  // Dashboard Styles
  dashboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  dashboardTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  timeRangeSelector: {
    display: 'flex',
    gap: '8px',
    background: '#f8fafc',
    padding: '4px',
    borderRadius: '8px',
  },
  timeRangeButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  refreshButton: {
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#e5e7eb',
    },
  },
  todayStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  todayStatCard: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    border: '1px solid #e2e8f0',
  },
  todayStatIcon: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  todayStatLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '4px',
  },
  todayStatValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  kpiCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
    },
  },
  kpiIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px',
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  kpiChange: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  chartCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  chartHeader: {
    padding: '24px 24px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  chartTimeRange: {
    fontSize: '13px',
    color: '#64748b',
    background: '#f8fafc',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  chartContent: {
    padding: '24px',
  },
  revenueChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '200px',
    gap: '16px',
  },
  revenueBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  revenueBarLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '12px',
    fontWeight: '500',
  },
  revenueBarWrapper: {
    width: '48px',
    height: '160px',
    background: '#f8fafc',
    borderRadius: '12px',
    position: 'relative',
    overflow: 'hidden',
  },
  revenueBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: '12px',
    transition: 'height 0.3s ease',
  },
  revenueBarValue: {
    position: 'absolute',
    top: '-30px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '12px',
    color: '#475569',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  revenueGrowth: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px',
  },
  topServicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  topServiceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    transition: 'background 0.2s',
    ':hover': {
      background: '#f1f5f9',
    },
  },
  serviceRank: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
    color: 'white',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '15px',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '6px',
    fontSize: '15px',
  },
  serviceStats: {
    fontSize: '13px',
    color: '#64748b',
  },
  serviceOrders: {
    background: '#e0f2fe',
    color: '#0369a1',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  serviceRevenue: {
    textAlign: 'right',
  },
  revenueAmount: {
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px',
    fontSize: '16px',
  },
  revenuePercentage: {
    fontSize: '13px',
    color: '#64748b',
  },
  recentOrdersTable: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    fontWeight: '600',
    color: '#475569',
    fontSize: '14px',
    marginBottom: '8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'center',
    transition: 'background 0.2s',
    ':hover': {
      background: '#f8fafc',
    },
    ':last-child': {
      borderBottom: 'none',
    },
  },
  tableCell: {
    padding: '8px 12px',
    fontSize: '14px',
  },
  orderId: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#1e293b',
  },
  customerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  amountCell: {
    fontWeight: '600',
    color: '#0077b6',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  channelBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  viewAllButton: {
    background: 'transparent',
    color: '#0077b6',
    border: '1px solid #0077b6',
    padding: '8px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#0077b6',
      color: 'white',
    },
  },
  // Screen Container Styles
  screenContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  screenHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  screenTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
  },
  screenSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  screenActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  filterToggleButton: {
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f1f5f9',
    },
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    background: '#f8fafc',
    padding: '4px',
    borderRadius: '8px',
  },
  viewButton: {
    background: 'transparent',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  exportButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
    },
  },
  filtersPanel: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  filterRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '20px',
    ':last-child': {
      marginBottom: 0,
    },
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    display: 'block',
    fontSize: '13px',
    color: '#475569',
    marginBottom: '8px',
    fontWeight: '500',
  },
  filterSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
      boxShadow: '0 0 0 3px rgba(0, 119, 182, 0.1)',
    },
  },
  dateRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dateInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
    },
  },
  dateSeparator: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  searchGroup: {
    flex: 2,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
      boxShadow: '0 0 0 3px rgba(0, 119, 182, 0.1)',
    },
  },
  clearButton: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#e2e8f0',
    },
  },
  ordersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  orderCard: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
    },
  },
  orderCardHeader: {
    padding: '24px 24px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  orderCardTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  orderId: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  orderStatus: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderCardChannel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b',
  },
  orderCardBody: {
    padding: '16px 24px',
  },
  orderCustomer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  customerName: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '15px',
  },
  customerPhone: {
    fontSize: '13px',
    color: '#64748b',
  },
  orderDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  orderDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500',
  },
  orderTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  totalLabel: {
    fontSize: '14px',
    color: '#64748b',
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0077b6',
  },
  orderCardActions: {
    padding: '20px 24px',
    background: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetailsButton: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f1f5f9',
    },
  },
  statusActions: {
    display: 'flex',
    gap: '8px',
  },
  confirmButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#059669',
    },
  },
  cancelButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#dc2626',
    },
  },
  progressButton: {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#d97706',
    },
  },
  completeButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#0369a1',
    },
  },
  ordersTable: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid #f1f5f9',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    background: '#f8fafc',
    color: '#475569',
    fontWeight: '600',
    fontSize: '14px',
    borderBottom: '1px solid #e2e8f0',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s',
    ':hover': {
      background: '#f8fafc',
    },
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#475569',
  },
  customerCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  amount: {
    fontWeight: '600',
    color: '#0077b6',
  },
  tableActionButton: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f1f5f9',
    },
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#94a3b8',
    transition: 'color 0.2s',
    ':hover': {
      color: '#475569',
    },
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  orderInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  infoGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#64748b',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: '500',
  },
  itemsSection: {
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 16px 0',
  },
  itemsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
  },
  itemDescription: {
    fontSize: '13px',
    color: '#64748b',
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: '14px',
    color: '#475569',
  },
  itemPrice: {
    fontSize: '14px',
    color: '#475569',
  },
  itemTotal: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0077b6',
  },
  totalSection: {
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  totalLabel: {
    fontSize: '14px',
    color: '#64748b',
  },
  totalValue: {
    fontSize: '16px',
    color: '#1e293b',
    fontWeight: '500',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  printButton: {
    background: '#475569',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#334155',
    },
  },
  closeModalButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#0369a1',
    },
  },
  // Services Screen Styles
  addButton: {
    background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0, 119, 182, 0.2)',
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formLabel: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500',
  },
  formInput: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
      boxShadow: '0 0 0 3px rgba(0, 119, 182, 0.1)',
    },
  },
  formTextarea: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '80px',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
      boxShadow: '0 0 0 3px rgba(0, 119, 182, 0.1)',
    },
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  submitButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
    },
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  serviceCard: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
    },
  },
  serviceCardHeader: {
    padding: '24px 24px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  serviceStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  serviceCardBody: {
    padding: '0 24px',
  },
  serviceName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  serviceDescription: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
  },
  serviceDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500',
  },
  serviceCardFooter: {
    padding: '20px 24px',
    background: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  priceLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  priceValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0077b6',
  },
  serviceActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f1f5f9',
    },
  },
  deactivateButton: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#fee2e2',
    },
  },
  activateButton: {
    background: '#f0fdf4',
    color: '#059669',
    border: '1px solid #bbf7d0',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#dcfce7',
    },
  },
  // Customers Screen Styles
  customersTable: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
  },
  customerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  customerName: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '14px',
  },
  customerEmail: {
    fontSize: '13px',
    color: '#64748b',
  },
  contactCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  contactPhone: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: '500',
  },
  contactAddress: {
    fontSize: '13px',
    color: '#64748b',
  },
  orderCount: {
    background: '#e0f2fe',
    color: '#0369a1',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  totalSpent: {
    fontWeight: '600',
    color: '#0077b6',
    fontSize: '15px',
  },
  viewCustomerButton: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f1f5f9',
    },
  },
  // Booking Management Styles
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  cancelButtonSmall: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#fee2e2',
    },
  },
  deleteButton: {
    background: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#e5e7eb',
    },
  },
  // Analytics Screen Styles
  analyticsSelect: {
    padding: '12px 24px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
    },
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  analyticsCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  analyticsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 20px 0',
  },
  chartPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: '#f8fafc',
    borderRadius: '12px',
    textAlign: 'center',
    gap: '16px',
    color: '#6b7280',
    fontSize: '14px',
  },
  // Table Styles
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    padding: '16px',
    background: '#f8fafc',
    fontWeight: '600',
    color: '#475569',
    fontSize: '14px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'center',
    ':last-child': {
      borderBottom: 'none',
    },
  },
};

// Add CSS animations
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  button {
    font-family: inherit;
  }
  
  input, select, textarea {
    font-family: inherit;
  }
`;
document.head.appendChild(style);

export default SalesManagement;