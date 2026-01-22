// PaymentsManagement.js - Component for payments management module
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { FaCreditCard, FaMoneyBillWave, FaChartLine, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// ====================
// MAIN COMPONENT
// ====================
const PaymentsManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { key: 'overview', icon: <FaChartLine />, label: 'Overview' },
    { key: 'records', icon: <FaCreditCard />, label: 'Payment Records' },
    { key: 'analytics', icon: <FaChartLine />, label: 'Analytics' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Payments Management</h1>
            <p style={styles.subtitle}>Track and analyze payment transactions</p>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{
              ...styles.tabButton,
              background: activeTab === tab.key ? 'var(--blue-gradient)' : 'var(--white)',
              color: activeTab === tab.key ? 'var(--white)' : 'var(--dark-blue)',
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'overview' && <PaymentsOverview />}
        {activeTab === 'records' && <PaymentRecords />}
        {activeTab === 'analytics' && <PaymentAnalytics />}
      </div>
    </div>
  );
};

// ====================
// PAYMENTS OVERVIEW COMPONENT
// ====================
const PaymentsOverview = () => {
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    cashPayments: 0,
    gcashPayments: 0,
    todayPayments: 0,
    todayAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStats();
  }, []);

  const fetchPaymentStats = async () => {
    try {
      setLoading(true);

      // Get all payments (assuming payments are linked to orders)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, payment_method, created_at')
        .eq('status', 'accepted');

      if (error) throw error;

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      let totalPayments = 0;
      let totalAmount = 0;
      let cashPayments = 0;
      let gcashPayments = 0;
      let todayPayments = 0;
      let todayAmount = 0;

      orders.forEach(order => {
        const amount = order.total || 0;
        totalPayments++;
        totalAmount += amount;

        if (order.payment_method === 'cash') {
          cashPayments++;
        } else if (order.payment_method === 'gcash') {
          gcashPayments++;
        }

        const orderDate = new Date(order.created_at);
        if (orderDate >= startOfToday) {
          todayPayments++;
          todayAmount += amount;
        }
      });

      setStats({
        totalPayments,
        totalAmount,
        cashPayments,
        gcashPayments,
        todayPayments,
        todayAmount
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading payment overview...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#e0f2fe'}}>
            <FaCreditCard size={24} color="#0077b6" />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statLabel}>Total Payments</h3>
            <p style={styles.statNumber}>{stats.totalPayments}</p>
            <small style={styles.statChange}>All time transactions</small>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f0fdf4'}}>
            <FaMoneyBillWave size={24} color="#10b981" />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statLabel}>Total Revenue</h3>
            <p style={styles.statNumber}>₱{stats.totalAmount.toLocaleString()}</p>
            <small style={styles.statChange}>All time revenue</small>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fef3c7'}}>
            <FaMoneyBillWave size={24} color="#f59e0b" />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statLabel}>Today's Payments</h3>
            <p style={styles.statNumber}>{stats.todayPayments}</p>
            <small style={styles.statChange}>₱{stats.todayAmount.toLocaleString()} today</small>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fce7f3'}}>
            <FaChartLine size={24} color="#db2777" />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statLabel}>Cash vs GCash</h3>
            <p style={styles.statNumber}>{stats.cashPayments} / {stats.gcashPayments}</p>
            <small style={styles.statChange}>Cash / GCash payments</small>
          </div>
        </div>
      </div>

      <div style={styles.chartSection}>
        <h3 style={styles.sectionTitle}>Payment Method Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Cash', value: stats.cashPayments },
                { name: 'GCash', value: stats.gcashPayments }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#8884d8" />
              <Cell fill="#82ca9d" />
            </Pie>
            <Tooltip formatter={(value) => [value, 'Payments']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ====================
// PAYMENT RECORDS COMPONENT
// ====================
const PaymentRecords = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [paginatedPayments, setPaginatedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    let filtered = payments;

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(payment => new Date(payment.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(payment => new Date(payment.created_at) <= toDate);
    }

    // Filter by payment method
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method === paymentFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toString().includes(searchTerm)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, dateFrom, dateTo, paymentFilter]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedPayments(filteredPayments.slice(startIndex, endIndex));
  }, [filteredPayments, currentPage, pageSize]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      alert('Error loading payments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading payment records...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by customer or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.dateFilters}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={styles.dateInput}
            placeholder="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={styles.dateInput}
            placeholder="To date"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Payment Types</option>
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
        </select>

        <button
          onClick={() => {
            setSearchTerm('');
            setDateFrom('');
            setDateTo('');
            setPaymentFilter('all');
            setCurrentPage(1);
          }}
          style={styles.clearButton}
        >
          Clear Filters
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>
                  No payments found.
                </td>
              </tr>
            ) : (
              paginatedPayments.map(payment => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>{payment.customer_name || 'Unknown'}</td>
                  <td>₱{payment.total?.toLocaleString()}</td>
                  <td>
                    <span style={{
                      background: payment.payment_method === 'cash' ? '#d1fae5' : '#dbeafe',
                      color: payment.payment_method === 'cash' ? '#065f46' : '#1e40af',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {payment.payment_method || 'Cash'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      background: '#d1fae5',
                      color: '#065f46',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Completed
                    </span>
                  </td>
                  <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredPayments.length > pageSize && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {Math.ceil(filteredPayments.length / pageSize)}
          </span>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredPayments.length / pageSize), currentPage + 1))}
            disabled={currentPage === Math.ceil(filteredPayments.length / pageSize)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ====================
// PAYMENT ANALYTICS COMPONENT
// ====================
const PaymentAnalytics = () => {
  const [chartData, setChartData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Get payments by date for line chart
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total, payment_method')
        .eq('status', 'accepted')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date for line chart
      const dateGroups = {};
      const methodGroups = { cash: 0, gcash: 0 };

      orders.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = { date, cash: 0, gcash: 0, total: 0 };
        }

        const method = order.payment_method || 'cash';
        dateGroups[date][method] += order.total || 0;
        dateGroups[date].total += order.total || 0;

        if (method === 'cash') methodGroups.cash += order.total || 0;
        else if (method === 'gcash') methodGroups.gcash += order.total || 0;
      });

      const lineData = Object.values(dateGroups).sort((a, b) => a.date.localeCompare(b.date));
      const pieData = [
        { name: 'Cash', value: methodGroups.cash, color: '#8884d8' },
        { name: 'GCash', value: methodGroups.gcash, color: '#82ca9d' }
      ];

      setChartData(lineData);
      setPaymentMethodData(pieData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.chartSection}>
        <h3 style={styles.sectionTitle}>Payment Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`₱${value}`, 'Amount']} />
            <Bar dataKey="cash" stackId="a" fill="#8884d8" name="Cash" />
            <Bar dataKey="gcash" stackId="a" fill="#82ca9d" name="GCash" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartSection}>
        <h3 style={styles.sectionTitle}>Payment Method Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={paymentMethodData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#8884d8" />
              <Cell fill="#82ca9d" />
            </Pie>
            <Tooltip formatter={(value) => [`₱${value}`, 'Amount']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ====================
// STYLES
// ====================
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
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: '32px',
    color: 'var(--dark-blue)',
    margin: '0 0 8px 0',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '16px',
    color: 'var(--sky-blue)',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '30px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  content: {
    // Add any content styles
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--sky-blue)',
    borderTop: '4px solid var(--dark-blue)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
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
  chartSection: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#1f2937',
    margin: '0 0 20px 0',
    fontWeight: '600',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  dateFilters: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    minWidth: '200px',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
  },
  clearButton: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#f3f4f6',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tableContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: 'var(--dark-blue)',
    color: 'white',
    fontWeight: 'bold',
  },
  td: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #f3f4f6',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px',
    padding: '20px',
  },
  pageButton: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pageInfo: {
    fontSize: '14px',
    color: 'var(--sky-blue)',
  },
};

export default PaymentsManagement;