// ServiceScheduling.js - Component for service scheduling module
import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaHistory, FaCog, FaCalendarCheck, FaTimes } from 'react-icons/fa';
import Calendar from 'react-calendar';
import { supabase } from '../supabase';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';

const CalendarScreen = ({ currentUser }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('bookings-calendar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        fetchBookings
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('❌ Calendar fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const bookingsForSelected = bookings.filter(
    (b) =>
      format(new Date(b.date), 'yyyy-MM-dd') ===
      format(selectedDate, 'yyyy-MM-dd')
  );

  const updateStatus = async (id, newStatus) => {
    if (!currentUser?.is_admin) {
      alert('Only admin can update status');
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      fetchBookings();
    }
  };

  const statusDates = {
    approved: new Set(),
    pending: new Set(),
    rejected: new Set(),
  };

  bookings.forEach((b) => {
    const dateStr = format(new Date(b.date), 'yyyy-MM-dd');
    if (b.status === 'approved') statusDates.approved.add(dateStr);
    else if (b.status === 'pending') statusDates.pending.add(dateStr);
    else if (b.status === 'rejected') statusDates.rejected.add(dateStr);
  });

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateStr = format(date, 'yyyy-MM-dd');

    return (
      <div style={styles.dotContainer}>
        {statusDates.approved.has(dateStr) && <div style={styles.dotGreen} />}
        {statusDates.pending.has(dateStr) && <div style={styles.dotOrange} />}
        {statusDates.rejected.has(dateStr) && <div style={styles.dotRed} />}
      </div>
    );
  };

  return (
    <div style={styles.calendarContainer}>
      <h2 style={styles.sectionTitle}>Service Calendar</h2>
      <p style={styles.sectionSubtitle}>View and manage service bookings</p>
      <div style={styles.calendarWrapper}>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={tileContent}
        />
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={styles.dotGreen}></span>
          <span>Approved</span>
        </div>

        <div style={styles.legendItem}>
          <span style={styles.dotOrange}></span>
          <span>Pending</span>
        </div>

        <div style={styles.legendItem}>
          <span style={styles.dotRed}></span>
          <span>Rejected</span>
        </div>
      </div>

      <div style={styles.listWrapper}>
        <h3 style={styles.dateHeader}>
          Bookings on {format(selectedDate, 'MMMM dd, yyyy')}
        </h3>

        {loading ? (
          <p>Loading...</p>
        ) : bookingsForSelected.length === 0 ? (
          <p style={styles.noData}>No bookings for this day.</p>
        ) : (
          <ul style={styles.list}>
            {bookingsForSelected.map((b) => (
              <li key={b.id} style={styles.listItem}>
                <div style={{ flex: 1 }}>
                  <strong>{b.name}</strong> — {b.service}{' '}
                  <span
                    style={{
                      color:
                        b.status === 'approved'
                          ? '#22c55e'
                          : b.status === 'pending'
                          ? '#f59e0b'
                          : '#ef4444',
                      fontWeight: 'bold',
                    }}
                  >
                    ({b.status})
                  </span>
                </div>
                {currentUser?.is_admin && (
                  <div style={styles.actionButtons}>
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b.id, 'approved')} style={styles.approveBtn}>
                          Accept
                        </button>
                        <button onClick={() => updateStatus(b.id, 'rejected')} style={styles.rejectBtn}>
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === 'approved' && (
                      <button onClick={() => updateStatus(b.id, 'pending')} style={styles.pendingBtn}>
                        Pending
                      </button>
                    )}
                    {b.status === 'rejected' && (
                      <button onClick={() => updateStatus(b.id, 'pending')} style={styles.pendingBtn}>
                        Pending
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ====================
// ALL BOOKINGS COMPONENT
// ====================
const AllBookings = ({ currentUser }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('all-bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        fetchBookings
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('❌ Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    if (!currentUser?.is_admin) {
      alert('❌ Only admin can update status');
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('❌ Error updating status: ' + error.message);
    } else {
      fetchBookings();
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div style={styles.requestsContainer}>
      <h2 style={styles.sectionTitle}>All Bookings</h2>
      <p style={styles.sectionSubtitle}>Complete list of all customer bookings</p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Service</th>
            <th>Location</th>
            <th>Date</th>
            <th>Status</th>
            {currentUser?.is_admin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={currentUser?.is_admin ? 6 : 5} style={{ textAlign: 'center', color: '#888' }}>
                No bookings yet.
              </td>
            </tr>
          ) : (
            bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.service}</td>
                <td>{b.location}</td>
                <td>{b.date}</td>
                <td>
                  <span
                    style={{
                      color:
                        b.status === 'approved'
                          ? 'green'
                          : b.status === 'rejected'
                          ? 'red'
                          : '#555',
                      fontWeight: 'bold',
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                {currentUser?.is_admin && (
                  <td>
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b.id, 'approved')} style={styles.approveBtn}>
                          Approve
                        </button>
                        <button onClick={() => updateStatus(b.id, 'rejected')} style={styles.rejectBtn}>
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === 'approved' && (
                      <button onClick={() => updateStatus(b.id, 'pending')} style={styles.pendingBtn}>
                        Mark Pending
                      </button>
                    )}
                    {b.status === 'rejected' && (
                      <button onClick={() => updateStatus(b.id, 'pending')} style={styles.pendingBtn}>
                        Mark Pending
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ====================
// SERVICE REQUESTS COMPONENT
// ====================
const ServiceRequests = ({ currentUser }) => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignData, setAssignData] = useState({
    date: '',
    time: '',
    staff: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .order('date', { ascending: true });

      if (error) throw error;
      setPendingBookings(data || []);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleAssignBooking = (booking) => {
    setSelectedBooking(booking);
    setAssignData({
      date: booking.date || '',
      time: '',
      staff: ''
    });
    setShowAssignModal(true);
  };

  const handleRejectBooking = (booking) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmAssignBooking = async () => {
    if (!assignData.date || !assignData.time || !assignData.staff) {
      alert('Please fill in all assignment details');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'approved',
          assigned_date: assignData.date,
          assigned_time: assignData.time,
          assigned_staff: assignData.staff
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Send notification to customer
      await sendNotification(selectedBooking, 'approved', {
        date: assignData.date,
        time: assignData.time,
        staff: assignData.staff
      });

      fetchPendingBookings();
      setShowAssignModal(false);
      setSelectedBooking(null);
      alert('Booking approved and assigned successfully!');
    } catch (error) {
      console.error('Error assigning booking:', error);
      alert('Error assigning booking: ' + error.message);
    }
  };

  const confirmRejectBooking = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Send notification to customer
      await sendNotification(selectedBooking, 'rejected', { reason: rejectReason });

      fetchPendingBookings();
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason('');
      alert('Booking rejected successfully!');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Error rejecting booking: ' + error.message);
    }
  };

  const sendNotification = async (booking, status, details) => {
    // This would integrate with your notification system
    // For now, we'll just log it
    console.log(`Notification sent to ${booking.name} for booking ${booking.id}:`, {
      status,
      details,
      message: status === 'approved'
        ? `Your booking has been approved! Date: ${details.date}, Time: ${details.time}, Staff: ${details.staff}`
        : `Your booking has been rejected. Reason: ${details.reason}`
    });

    // In a real implementation, you might:
    // 1. Send email via Supabase Edge Functions
    // 2. Send SMS via third-party service
    // 3. Store notification in database
    // 4. Send push notification if app supports it
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading service requests...</p>
      </div>
    );
  }

  return (
    <div style={styles.requestsContainer}>
      <h2 style={styles.sectionTitle}>Service Requests</h2>
      <p style={styles.sectionSubtitle}>Pending booking requests awaiting admin approval</p>

      {pendingBookings.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--sky-blue)', padding: '50px' }}>No pending requests.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Service</th>
              <th>Location</th>
              <th>Date</th>
              {currentUser?.is_admin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pendingBookings.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.service}</td>
                <td>{b.location}</td>
                <td>{b.date}</td>
                {currentUser?.is_admin && (
                  <td>
                    <button onClick={() => handleAssignBooking(b)} style={styles.assignBtn}>
                      <FaCalendarCheck style={{ marginRight: 4 }} />
                      Assign
                    </button>
                    <button onClick={() => handleRejectBooking(b)} style={styles.rejectBtn}>
                      <FaTimes style={{ marginRight: 4 }} />
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedBooking && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign Service Booking</h3>
              <button style={styles.closeButton} onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.bookingInfo}>
                <p><strong>Customer:</strong> {selectedBooking.name}</p>
                <p><strong>Service:</strong> {selectedBooking.service}</p>
                <p><strong>Requested Date:</strong> {selectedBooking.date}</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Service Date *</label>
                <input
                  type="date"
                  value={assignData.date}
                  onChange={(e) => setAssignData({...assignData, date: e.target.value})}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Service Time *</label>
                <input
                  type="time"
                  value={assignData.time}
                  onChange={(e) => setAssignData({...assignData, time: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Staff/Technician *</label>
                <select
                  value={assignData.staff}
                  onChange={(e) => setAssignData({...assignData, staff: e.target.value})}
                  style={styles.input}
                >
                  <option value="">Select Staff</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Mike Johnson">Mike Johnson</option>
                  <option value="Sarah Wilson">Sarah Wilson</option>
                </select>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button style={styles.confirmButton} onClick={confirmAssignBooking}>
                <FaCalendarCheck style={{ marginRight: 8 }} />
                Approve & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedBooking && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Reject Service Booking</h3>
              <button style={styles.closeButton} onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.bookingInfo}>
                <p><strong>Customer:</strong> {selectedBooking.name}</p>
                <p><strong>Service:</strong> {selectedBooking.service}</p>
                <p><strong>Requested Date:</strong> {selectedBooking.date}</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Reason for Rejection *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={styles.textarea}
                  placeholder="Please provide a reason for rejecting this booking..."
                  rows={4}
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button style={styles.rejectConfirmButton} onClick={confirmRejectBooking}>
                <FaTimes style={{ marginRight: 8 }} />
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ServiceScheduling = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;
      if (!user) {
        setCurrentUser(null);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      setCurrentUser({ ...user, is_admin: userData?.is_admin });
    } catch (err) {
      console.error('Error fetching current user:', err.message);
    }
  };

  const tabs = [
    { key: 'calendar', icon: <FaCalendarAlt />, label: 'Calendar' },
    { key: 'bookings', icon: <FaClock />, label: 'All Bookings' },
    { key: 'appointments', icon: <FaClock />, label: 'Appointments' },
    { key: 'requests', icon: <FaUser />, label: 'Service Requests' },
    { key: 'staff', icon: <FaUser />, label: 'Staff' },
    { key: 'history', icon: <FaHistory />, label: 'Service History' },
    { key: 'settings', icon: <FaCog />, label: 'Schedule Settings' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Service Scheduling</h1>
            <p style={styles.subtitle}>Manage appointments and schedules</p>
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
        {activeTab === 'calendar' && <CalendarScreen currentUser={currentUser} />}
        {activeTab === 'bookings' && <AllBookings currentUser={currentUser} />}
        {activeTab === 'appointments' && <div style={styles.placeholder}>Appointments Screen - Coming Soon</div>}
        {activeTab === 'requests' && <ServiceRequests currentUser={currentUser} />}
        {activeTab === 'staff' && <div style={styles.placeholder}>Staff Screen - Coming Soon</div>}
        {activeTab === 'history' && <div style={styles.placeholder}>Service History Screen - Coming Soon</div>}
        {activeTab === 'settings' && <div style={styles.placeholder}>Schedule Settings Screen - Coming Soon</div>}
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
  placeholder: {
    textAlign: 'center',
    padding: '50px',
    color: 'var(--sky-blue)',
    fontSize: '18px',
  },
  calendarContainer: {
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: '24px',
    color: 'var(--dark-blue)',
    marginBottom: '8px',
  },
  sectionSubtitle: {
    color: 'var(--sky-blue)',
    marginBottom: '30px',
  },
  calendarWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--dark-blue)',
  },
  legendColor: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
  },
  dotContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3px',
    marginTop: 4,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
  dotOrange: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  listWrapper: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginTop: 20,
  },
  dateHeader: {
    fontSize: 20,
    marginBottom: 15,
    color: 'var(--dark-blue)',
  },
  noData: {
    color: '#888',
    fontStyle: 'italic',
  },
  list: {
    listStyle: 'none',
    paddingLeft: 0,
  },
  listItem: {
    padding: '8px 0',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
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
  requestsContainer: {
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: '20px',
  },
  'th, td': {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
  },
  th: {
    backgroundColor: 'var(--dark-blue)',
    color: 'white',
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    marginRight: 6,
    cursor: 'pointer',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  pendingBtn: {
    backgroundColor: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  assignBtn: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    marginRight: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    margin: 0,
    color: 'var(--dark-blue)',
    fontSize: '20px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--sky-blue)',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  bookingInfo: {
    background: '#f8fafc',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontWeight: '600',
    color: 'var(--dark-blue)',
    fontSize: '14px',
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelButton: {
    background: 'var(--sky-blue)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  confirmButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
  },
  rejectConfirmButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
  },
};

export default ServiceScheduling;