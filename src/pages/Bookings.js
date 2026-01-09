import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ Fetch current logged-in user and check if admin
  const fetchCurrentUser = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;
      if (!user) {
        console.log('No logged-in user');
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
      console.log('Current User:', { ...user, is_admin: userData?.is_admin });
    } catch (err) {
      console.error('Error fetching current user:', err.message);
    }
  };

  // ✅ Fetch all bookings
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

  // ✅ Listen for real-time updates
  useEffect(() => {
    fetchCurrentUser();
    fetchBookings();

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchBookings()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ✅ Update booking status (only admin can do this)
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

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 All Customer Bookings</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
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
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '30px 40px',
    fontFamily: 'Poppins, sans-serif',
    background: 'linear-gradient(to bottom right, #e0f7fa, #ffffff)',
    minHeight: '100vh',
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    color: '#0077b6',
    marginBottom: 20,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
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
