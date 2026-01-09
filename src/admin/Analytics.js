import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    totalServices: 0,
    totalProducts: 0,
    recentBookings: [],
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all analytics data in parallel
      const [
        usersResult,
        bookingsResult,
        pendingBookingsResult,
        approvedBookingsResult,
        servicesResult,
        productsResult,
        recentBookingsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setAnalytics({
        totalUsers: usersResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        pendingBookings: pendingBookingsResult.count || 0,
        approvedBookings: approvedBookingsResult.count || 0,
        totalServices: servicesResult.count || 0,
        totalProducts: productsResult.count || 0,
        recentBookings: recentBookingsResult.data || [],
        monthlyRevenue: calculateMonthlyRevenue(recentBookingsResult.data || [])
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const calculateMonthlyRevenue = (bookings) => {
    // Simple calculation - in a real app, you'd calculate based on approved bookings with pricing
    return bookings
      .filter(b => b.status === 'approved')
      .reduce((total, booking) => {
        // Assuming each booking has a price field or you calculate based on service
        return total + (booking.price || 0);
      }, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics Dashboard</h1>
        <p style={styles.subtitle}>View detailed reports and insights</p>
      </div>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            👥
          </div>
          <div style={styles.metricContent}>
            <h3 style={styles.metricNumber}>{analytics.totalUsers}</h3>
            <p style={styles.metricLabel}>Total Users</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            📋
          </div>
          <div style={styles.metricContent}>
            <h3 style={styles.metricNumber}>{analytics.totalBookings}</h3>
            <p style={styles.metricLabel}>Total Bookings</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            ⏳
          </div>
          <div style={styles.metricContent}>
            <h3 style={styles.metricNumber}>{analytics.pendingBookings}</h3>
            <p style={styles.metricLabel}>Pending Bookings</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            ✅
          </div>
          <div style={styles.metricContent}>
            <h3 style={styles.metricNumber}>{analytics.approvedBookings}</h3>
            <p style={styles.metricLabel}>Approved Bookings</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            🔧
          </div>
          <div style={styles.metricContent}>
            <h3 style={styles.metricNumber}>{analytics.totalServices}</h3>
            <p style={styles.metricLabel}>Services</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            📦
          </div>
          <div style={styles.metricContent}>
            <h3 style={styles.metricNumber}>{analytics.totalProducts}</h3>
            <p style={styles.metricLabel}>Products</p>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        {/* Recent Bookings */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Bookings</h2>
          <div style={styles.bookingsList}>
            {analytics.recentBookings.length === 0 ? (
              <p style={styles.emptyText}>No recent bookings</p>
            ) : (
              analytics.recentBookings.map(booking => (
                <div key={booking.id} style={styles.bookingItem}>
                  <div style={styles.bookingInfo}>
                    <div style={styles.bookingHeader}>
                      <span style={styles.bookingName}>{booking.name}</span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(booking.status)
                        }}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div style={styles.bookingDetails}>
                      <span>{booking.service}</span>
                      <span>•</span>
                      <span>{booking.location}</span>
                      <span>•</span>
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={styles.bookingTime}>
                    {new Date(booking.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Booking Status Breakdown */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Booking Status Overview</h2>
          <div style={styles.statusOverview}>
            <div style={styles.statusItem}>
              <div style={styles.statusBar}>
                <div
                  style={{
                    ...styles.statusFill,
                    backgroundColor: '#10b981',
                    width: `${analytics.totalBookings > 0 ? (analytics.approvedBookings / analytics.totalBookings) * 100 : 0}%`
                  }}
                />
              </div>
              <div style={styles.statusInfo}>
                <span style={styles.statusLabel}>Approved</span>
                <span style={styles.statusCount}>{analytics.approvedBookings}</span>
              </div>
            </div>

            <div style={styles.statusItem}>
              <div style={styles.statusBar}>
                <div
                  style={{
                    ...styles.statusFill,
                    backgroundColor: '#f59e0b',
                    width: `${analytics.totalBookings > 0 ? (analytics.pendingBookings / analytics.totalBookings) * 100 : 0}%`
                  }}
                />
              </div>
              <div style={styles.statusInfo}>
                <span style={styles.statusLabel}>Pending</span>
                <span style={styles.statusCount}>{analytics.pendingBookings}</span>
              </div>
            </div>

            <div style={styles.statusItem}>
              <div style={styles.statusBar}>
                <div
                  style={{
                    ...styles.statusFill,
                    backgroundColor: '#ef4444',
                    width: `${analytics.totalBookings > 0 ? ((analytics.totalBookings - analytics.approvedBookings - analytics.pendingBookings) / analytics.totalBookings) * 100 : 0}%`
                  }}
                />
              </div>
              <div style={styles.statusInfo}>
                <span style={styles.statusLabel}>Rejected</span>
                <span style={styles.statusCount}>{analytics.totalBookings - analytics.approvedBookings - analytics.pendingBookings}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  loading: {
    textAlign: 'center',
    padding: '50px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #0077b6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  metricCard: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '25px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #e5e7eb',
  },
  metricIcon: {
    fontSize: '32px',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  metricContent: {
    flex: 1,
  },
  metricNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    fontWeight: '500',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  section: {
    background: '#f8fafc',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
  },
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  bookingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  bookingName: {
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    color: '#6b7280',
  },
  bookingTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '20px',
  },
  statusOverview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statusBar: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  statusFill: {
    height: '100%',
    borderRadius: '4px',
  },
  statusInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  statusCount: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600',
  },
};

export default Analytics;