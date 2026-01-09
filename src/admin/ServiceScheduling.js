// ServiceScheduling.js - Component for service scheduling module
import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaHistory, FaCog } from 'react-icons/fa';
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
      fetchPendingBookings(); // Refresh the list
    }
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
                    <button onClick={() => updateStatus(b.id, 'approved')} style={styles.approveBtn}>
                      Approve
                    </button>
                    <button onClick={() => updateStatus(b.id, 'rejected')} style={styles.rejectBtn}>
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
};

export default ServiceScheduling;