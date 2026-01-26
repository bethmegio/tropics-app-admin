import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaCalendarAlt,
  FaDownload,
  FaFilter,
  FaDollarSign,
  FaShoppingBag,
  FaUsers,
  FaShoppingCart,
  FaBox,
  FaClock,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaPrint,
  FaFileExcel,
  FaFilePdf,
  FaCalendar,
  FaCalendarDay,
  FaCalendarWeek,
  // REMOVE: FaCalendarMonth - doesn't exist
  FaChevronDown
} from 'react-icons/fa';
import { supabase } from '../supabase';

// ====================
// REUSABLE CHART COMPONENTS
// ====================

// Bar Chart Component
const BarChart = ({ data, height = 200, color = '#3b82f6' }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      height: `${height}px`,
      padding: '20px 0',
      gap: '8px'
    }}>
      {data.map((item, index) => (
        <div key={index} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <div style={{
            height: `${(item.value / maxValue) * 100}%`,
            width: '30px',
            background: color,
            borderRadius: '6px 6px 0 0',
            position: 'relative',
            minHeight: '10px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              whiteSpace: 'nowrap'
            }}>
              ₱{item.value.toLocaleString()}
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '8px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component
const PieChart = ({ data, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'
  ];

  return (
    <div style={{
      position: 'relative',
      width: `${size}px`,
      height: `${size}px`,
      margin: '0 auto'
    }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const largeArc = angle > 180 ? 1 : 0;
          
          const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
          const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
          
          const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
          
          const slice = (
            <path
              key={index}
              d={path}
              fill={colors[index % colors.length]}
              stroke="#fff"
              strokeWidth="1"
            />
          );
          
          currentAngle += angle;
          return slice;
        })}
      </svg>
      
      {/* Legend */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {data.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: colors[index % colors.length]
            }} />
            <span style={{ fontSize: '13px', color: '#374151' }}>
              {item.name} ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart Component
const LineChart = ({ data, height = 200, color = '#3b82f6' }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - (item.value / maxValue) * 100
  }));

  const path = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div style={{
      position: 'relative',
      height: `${height}px`,
      width: '100%'
    }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y, i) => (
          <line
            key={i}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Dots */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill={color}
          />
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px'
      }}>
        {data.map((item, index) => (
          <div key={index} style={{
            fontSize: '11px',
            color: '#6b7280',
            textAlign: 'center',
            transform: 'rotate(-45deg)',
            transformOrigin: 'center'
          }}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================
// STAT CARD COMPONENT
// ====================
const ReportStatCard = ({ icon: Icon, title, value, change, color, bgColor }) => {
  const isPositive = change > 0;
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{
          backgroundColor: bgColor,
          padding: '10px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {title}
        </div>
      </div>
      
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '8px'
      }}>
        {value}
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {isPositive ? (
          <FaArrowUp size={12} color="#10b981" />
        ) : (
          <FaArrowDown size={12} color="#ef4444" />
        )}
        <span style={{
          fontSize: '14px',
          color: isPositive ? '#10b981' : '#ef4444',
          fontWeight: '500'
        }}>
          {Math.abs(change).toFixed(1)}%
        </span>
        <span style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginLeft: '4px'
        }}>
          vs last period
        </span>
      </div>
    </div>
  );
};

// ====================
// MAIN REPORTS SCREEN COMPONENT
// ====================
const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [reportData, setReportData] = useState({
    // Summary Stats
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    
    // Time-based Stats
    revenueGrowth: 0,
    orderGrowth: 0,
    customerGrowth: 0,
    
    // Category Breakdown
    revenueByCategory: [],
    ordersByCategory: [],
    
    // Product Performance
    topProducts: [],
    topServices: [],
    
    // Customer Analysis
    newCustomers: 0,
    returningCustomers: 0,
    customerRetention: 0,
    
    // Sales Channels
    walkInSales: 0,
    mobileSales: 0,
    channelDistribution: [],
    
    // Payment Methods
    paymentMethods: [],
    
    // Time Analysis
    dailyRevenue: [],
    hourlySales: [],
    monthlyTrend: [],
    
    // Comparison Data
    previousPeriod: {
      revenue: 0,
      orders: 0,
      customers: 0
    }
  });

  // Predefined date ranges - FIXED: Use FaCalendar instead of FaCalendarMonth
  const dateRanges = [
    { value: 'today', label: 'Today', icon: <FaCalendarDay /> },
    { value: 'yesterday', label: 'Yesterday', icon: <FaCalendarDay /> },
    { value: 'week', label: 'This Week', icon: <FaCalendarWeek /> },
    { value: 'last_week', label: 'Last Week', icon: <FaCalendarWeek /> },
    { value: 'month', label: 'This Month', icon: <FaCalendar /> }, // Changed to FaCalendar
    { value: 'last_month', label: 'Last Month', icon: <FaCalendar /> }, // Changed to FaCalendar
    { value: 'quarter', label: 'This Quarter', icon: <FaCalendarAlt /> },
    { value: 'year', label: 'This Year', icon: <FaCalendarAlt /> },
    { value: 'custom', label: 'Custom Range', icon: <FaCalendarAlt /> }
  ];

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let start = new Date();
      let end = new Date();
      let previousStart = new Date();
      let previousEnd = new Date();
      
      switch(dateRange) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          previousStart.setDate(previousStart.getDate() - 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd = new Date(previousStart);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'yesterday':
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          previousStart.setDate(previousStart.getDate() - 2);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd = new Date(previousStart);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start.setDate(start.getDate() - 7);
          previousStart.setDate(previousStart.getDate() - 14);
          previousEnd.setDate(previousEnd.getDate() - 8);
          break;
        case 'last_week':
          start.setDate(start.getDate() - 14);
          end.setDate(end.getDate() - 8);
          previousStart.setDate(previousStart.getDate() - 21);
          previousEnd.setDate(previousEnd.getDate() - 15);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          previousStart.setMonth(previousStart.getMonth() - 2);
          previousEnd.setMonth(previousEnd.getMonth() - 1);
          break;
        case 'last_month':
          start.setMonth(start.getMonth() - 2);
          end.setMonth(end.getMonth() - 1);
          previousStart.setMonth(previousStart.getMonth() - 3);
          previousEnd.setMonth(previousEnd.getMonth() - 2);
          break;
        case 'quarter':
          start.setMonth(start.getMonth() - 3);
          previousStart.setMonth(previousStart.getMonth() - 6);
          previousEnd.setMonth(previousEnd.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          previousStart.setFullYear(previousStart.getFullYear() - 2);
          previousEnd.setFullYear(previousEnd.getFullYear() - 1);
          break;
        case 'custom':
          if (!startDate || !endDate) {
            start.setMonth(start.getMonth() - 1);
          } else {
            start = new Date(startDate);
            end = new Date(endDate);
          }
          break;
      }

      // If custom dates not set, end is today
      if (dateRange !== 'custom' || !endDate) {
        end = new Date();
      }

      // Fetch orders for current period
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              category,
              price
            )
          )
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch orders for previous period
      const { data: previousOrdersData, error: previousOrdersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      if (previousOrdersError) throw previousOrdersError;

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('users')
        .select('id, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (customersError) throw customersError;

      // Fetch previous period customers
      const { data: previousCustomersData } = await supabase
        .from('users')
        .select('id, created_at')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      // Calculate metrics for current period
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const totalOrders = ordersData?.length || 0;
      const totalCustomers = customersData?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate metrics for previous period
      const previousRevenue = previousOrdersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const previousOrders = previousOrdersData?.length || 0;
      const previousCustomers = previousCustomersData?.length || 0;
      
      // Calculate growth percentages
      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Analyze categories
      const categoryAnalysis = {};
      ordersData?.forEach(order => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach(item => {
            if (item.products) {
              const category = item.products.category || 'uncategorized';
              if (!categoryAnalysis[category]) {
                categoryAnalysis[category] = {
                  revenue: 0,
                  orders: 0,
                  items: 0
                };
              }
              categoryAnalysis[category].revenue += (item.quantity || 1) * (item.price || 0);
              categoryAnalysis[category].orders += 1;
              categoryAnalysis[category].items += item.quantity || 1;
            }
          });
        }
      });

      // Analyze products
      const productAnalysis = {};
      ordersData?.forEach(order => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach(item => {
            if (item.products) {
              const productName = item.products.name || `Product #${item.product_id}`;
              if (!productAnalysis[productName]) {
                productAnalysis[productName] = {
                  revenue: 0,
                  quantity: 0,
                  orders: 0
                };
              }
              productAnalysis[productName].revenue += (item.quantity || 1) * (item.price || 0);
              productAnalysis[productName].quantity += item.quantity || 1;
              productAnalysis[productName].orders += 1;
            }
          });
        }
      });

      // Analyze payment methods
      const paymentAnalysis = {};
      ordersData?.forEach(order => {
        const method = order.payment_method || 'cash';
        if (!paymentAnalysis[method]) {
          paymentAnalysis[method] = {
            count: 0,
            revenue: 0
          };
        }
        paymentAnalysis[method].count += 1;
        paymentAnalysis[method].revenue += order.total || 0;
      });

      // Analyze sales channels
      const channelAnalysis = {
        walkIn: { revenue: 0, orders: 0 },
        mobile: { revenue: 0, orders: 0 }
      };
      
      ordersData?.forEach(order => {
        if (order.channel === 'mobile') {
          channelAnalysis.mobile.revenue += order.total || 0;
          channelAnalysis.mobile.orders += 1;
        } else {
          channelAnalysis.walkIn.revenue += order.total || 0;
          channelAnalysis.walkIn.orders += 1;
        }
      });

      // Daily revenue analysis (last 7 days)
      const dailyRevenue = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayRevenue = ordersData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === date.toDateString();
        }).reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        
        dailyRevenue.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: dayRevenue
        });
      }

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthRevenue = ordersData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear();
        }).reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        
        monthlyTrend.push({
          label: monthName,
          value: monthRevenue
        });
      }

      // Customer retention calculation
      const uniqueCustomerIds = [...new Set(ordersData?.map(order => order.user_id).filter(Boolean))];
      const returningCustomers = uniqueCustomerIds.length;
      
      // Process data for charts
      const revenueByCategory = Object.entries(categoryAnalysis)
        .map(([category, data]) => ({
          name: category.replace('_', ' ').toUpperCase(),
          value: data.revenue
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const topProducts = Object.entries(productAnalysis)
        .map(([name, data]) => ({
          name: name,
          revenue: data.revenue,
          quantity: data.quantity,
          orders: data.orders
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const paymentMethods = Object.entries(paymentAnalysis)
        .map(([method, data]) => ({
          name: method.toUpperCase(),
          value: data.revenue,
          count: data.count
        }))
        .sort((a, b) => b.value - a.value);

      const channelDistribution = [
        { name: 'WALK-IN', value: channelAnalysis.walkIn.revenue },
        { name: 'MOBILE APP', value: channelAnalysis.mobile.revenue }
      ];

      // Calculate conversion rate (simplified)
      const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

      // Set report data
      setReportData({
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        conversionRate: conversionRate.toFixed(1),
        
        revenueGrowth: calculateGrowth(totalRevenue, previousRevenue),
        orderGrowth: calculateGrowth(totalOrders, previousOrders),
        customerGrowth: calculateGrowth(totalCustomers, previousCustomers),
        
        revenueByCategory,
        ordersByCategory: Object.entries(categoryAnalysis).map(([cat, data]) => ({
          name: cat,
          value: data.orders
        })),
        
        topProducts,
        topServices: [], // You can add service analysis here
        
        newCustomers: totalCustomers,
        returningCustomers,
        customerRetention: totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : 0,
        
        walkInSales: channelAnalysis.walkIn.revenue,
        mobileSales: channelAnalysis.mobile.revenue,
        channelDistribution,
        
        paymentMethods,
        
        dailyRevenue,
        hourlySales: [], // You can add hourly analysis here
        monthlyTrend,
        
        previousPeriod: {
          revenue: previousRevenue,
          orders: previousOrders,
          customers: previousCustomers
        }
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      alert('Error loading report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      setShowExportDropdown(false);
      
      // Prepare data for export
      const exportData = {
        period: dateRange,
        dateRange: `${startDate || 'Auto'} to ${endDate || 'Today'}`,
        generated: new Date().toISOString(),
        ...reportData
      };
      
      if (format === 'csv') {
        // Convert to CSV
        const csvContent = convertToCSV(exportData);
        downloadFile(csvContent, `sales-report-${Date.now()}.csv`, 'text/csv');
      } else if (format === 'json') {
        // Download as JSON
        downloadFile(JSON.stringify(exportData, null, 2), `sales-report-${Date.now()}.json`, 'application/json');
      } else {
        // For PDF, we would need a PDF generation library
        alert(`Export to ${format} would require additional setup`);
      }
      
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report');
    } finally {
      setExportLoading(false);
    }
  };

  const convertToCSV = (data) => {
    // Simplified CSV conversion
    const rows = [];
    
    // Add summary section
    rows.push('Sales Report Summary');
    rows.push(`Period: ${dateRange}`);
    rows.push(`Date Range: ${startDate || 'Auto'} to ${endDate || 'Today'}`);
    rows.push(`Generated: ${new Date().toLocaleString()}`);
    rows.push('');
    
    // Add key metrics
    rows.push('Key Metrics');
    rows.push('Metric,Value');
    rows.push(`Total Revenue,${reportData.totalRevenue}`);
    rows.push(`Total Orders,${reportData.totalOrders}`);
    rows.push(`Total Customers,${reportData.totalCustomers}`);
    rows.push(`Average Order Value,${reportData.averageOrderValue.toFixed(2)}`);
    rows.push(`Conversion Rate,${reportData.conversionRate}%`);
    rows.push('');
    
    // Add growth metrics
    rows.push('Growth Metrics (%)');
    rows.push('Metric,Growth');
    rows.push(`Revenue,${reportData.revenueGrowth.toFixed(1)}`);
    rows.push(`Orders,${reportData.orderGrowth.toFixed(1)}`);
    rows.push(`Customers,${reportData.customerGrowth.toFixed(1)}`);
    
    return rows.join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
          Loading analytics data...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FaChartLine />
            Sales Analytics & Reports
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Comprehensive sales performance analysis and insights
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaPrint />
            Print
          </button>
          
          <div style={{ position: 'relative' }} className="export-dropdown">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={exportLoading}
              style={{
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
                opacity: exportLoading ? 0.7 : 1
              }}
            >
              <FaDownload />
              Export
              <FaChevronDown size={12} />
            </button>
            
            {/* Export dropdown */}
            {showExportDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e5e7eb',
                minWidth: '180px',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => handleExport('csv')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: '#374151',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaFileExcel color="#21a366" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: '#374151',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaFileExcel color="#f59e0b" />
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: '#374151',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaFilePdf color="#f40f02" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaFilter />
            Filter Reports
          </h3>
          
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaCalendarAlt />
            {dateRange === 'custom' && startDate && endDate 
              ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
              : dateRanges.find(r => r.value === dateRange)?.label || 'Select Range'
            }
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 2 }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {dateRanges.slice(0, 8).map(range => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: dateRange === range.value ? '#3b82f6' : '#f3f4f6',
                    color: dateRange === range.value ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {range.icon}
                  {range.label}
                </button>
              ))}
              <button
                onClick={() => setDateRange('custom')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: dateRange === 'custom' ? '#3b82f6' : '#f3f4f6',
                  color: dateRange === 'custom' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaCalendarAlt />
                Custom Range
              </button>
            </div>
          </div>
          
          {dateRange === 'custom' && (
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
              flex: 3
            }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <button
                onClick={fetchReportData}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  height: '36px'
                }}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <ReportStatCard
          icon={FaDollarSign}
          title="Total Revenue"
          value={`₱${reportData.totalRevenue.toLocaleString()}`}
          change={reportData.revenueGrowth}
          color="#065f46"
          bgColor="#d1fae5"
        />
        
        <ReportStatCard
          icon={FaShoppingBag}
          title="Total Orders"
          value={reportData.totalOrders}
          change={reportData.orderGrowth}
          color="#1e40af"
          bgColor="#dbeafe"
        />
        
        <ReportStatCard
          icon={FaUsers}
          title="Total Customers"
          value={reportData.totalCustomers}
          change={reportData.customerGrowth}
          color="#92400e"
          bgColor="#fef3c7"
        />
        
        <ReportStatCard
          icon={FaShoppingCart}
          title="Avg Order Value"
          value={`₱${reportData.averageOrderValue.toFixed(2)}`}
          change={0}
          color="#7c3aed"
          bgColor="#ede9fe"
        />
        
        <ReportStatCard
          icon={FaBox}
          title="Conversion Rate"
          value={`${reportData.conversionRate}%`}
          change={0}
          color="#be185d"
          bgColor="#fce7f3"
        />
        
        <ReportStatCard
          icon={FaCheckCircle}
          title="Customer Retention"
          value={`${reportData.customerRetention}%`}
          change={0}
          color="#0f766e"
          bgColor="#ccfbf1"
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Revenue Trend Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaChartLine />
              Monthly Revenue Trend
            </h3>
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              Last 6 Months
            </span>
          </div>
          <LineChart 
            data={reportData.monthlyTrend}
            height={200}
            color="#3b82f6"
          />
        </div>

        {/* Daily Revenue Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaChartBar />
              Daily Revenue (Last 7 Days)
            </h3>
          </div>
          <BarChart 
            data={reportData.dailyRevenue}
            height={200}
            color="#10b981"
          />
        </div>

        {/* Revenue by Category */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaChartPie />
              Revenue by Category
            </h3>
          </div>
          <PieChart 
            data={reportData.revenueByCategory}
            size={180}
          />
        </div>

        {/* Sales Channel Distribution */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaShoppingBag />
              Sales Channel Distribution
            </h3>
          </div>
          <PieChart 
            data={reportData.channelDistribution}
            size={180}
          />
        </div>
      </div>

      {/* Detailed Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Top Products Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaBox />
            Top Performing Products
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Product
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Revenue
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Quantity
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.topProducts.length > 0 ? (
                  reportData.topProducts.map((product, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {product.name}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#059669'
                      }}>
                        ₱{product.revenue.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {product.quantity}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {product.orders}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      No product data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaDollarSign />
            Payment Methods Analysis
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Payment Method
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Orders
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Revenue
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.paymentMethods.length > 0 ? (
                  reportData.paymentMethods.map((method, index) => {
                    const percentage = (method.value / reportData.totalRevenue) * 100;
                    return (
                      <tr key={index} style={{
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <td style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {method.name}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          {method.count}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#059669'
                        }}>
                          ₱{method.value.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontSize: '14px',
                          color: '#3b82f6',
                          fontWeight: '600'
                        }}>
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      No payment method data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaChartLine />
          Performance Summary
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              Period Comparison
            </div>
            <div style={{
              fontSize: '14px',
              color: '#374151'
            }}>
              Current vs Previous Period
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              Revenue Growth
            </div>
            <div style={{
              fontSize: '16px',
              color: reportData.revenueGrowth >= 0 ? '#10b981' : '#ef4444',
              fontWeight: '600'
            }}>
              {reportData.revenueGrowth >= 0 ? '+' : ''}{reportData.revenueGrowth.toFixed(1)}%
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              Order Growth
            </div>
            <div style={{
              fontSize: '16px',
              color: reportData.orderGrowth >= 0 ? '#10b981' : '#ef4444',
              fontWeight: '600'
            }}>
              {reportData.orderGrowth >= 0 ? '+' : ''}{reportData.orderGrowth.toFixed(1)}%
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              Best Performing Category
            </div>
            <div style={{
              fontSize: '14px',
              color: '#374151',
              fontWeight: '500'
            }}>
              {reportData.revenueByCategory[0]?.name || 'N/A'}
            </div>
          </div>
        </div>
        
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            <strong>Insights:</strong> {reportData.revenueGrowth >= 0 
              ? 'Sales performance is trending positively with growth across key metrics.'
              : 'Sales performance requires attention with negative growth trends.'
            }
            {reportData.topProducts.length > 0 && ` Top product "${reportData.topProducts[0]?.name}" contributed significantly to revenue.`}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          @media print {
            body * {
              visibility: hidden;
            }
            .print-section, .print-section * {
              visibility: visible;
            }
            .print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ReportsScreen;