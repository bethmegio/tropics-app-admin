// SalesManagement.js - Component for sales management module
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { FaShoppingBag, FaFileInvoice, FaCreditCard, FaUsers, FaChartBar } from 'react-icons/fa';

// ====================
// MAIN COMPONENT
// ====================
const SalesManagement = () => {
  const [activeTab, setActiveTab] = useState('orders');

  const tabs = [
    { key: 'dashboard', icon: <FaChartBar />, label: 'Dashboard' },
    { key: 'orders', icon: <FaShoppingBag />, label: 'Orders' },
    { key: 'invoices', icon: <FaFileInvoice />, label: 'Invoices' },
    { key: 'payments', icon: <FaCreditCard />, label: 'Payments' },
    { key: 'customers', icon: <FaUsers />, label: 'Customers' },
    { key: 'reports', icon: <FaChartBar />, label: 'Reports' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Sales Management</h1>
            <p style={styles.subtitle}>Manage sales, orders, and customers</p>
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
        {activeTab === 'orders' && <OrdersScreen />}
        {activeTab === 'dashboard' && <div style={styles.placeholder}>Sales Dashboard - Coming Soon</div>}
        {activeTab === 'invoices' && <div style={styles.placeholder}>Invoices Screen - Coming Soon</div>}
        {activeTab === 'payments' && <div style={styles.placeholder}>Payments Screen - Coming Soon</div>}
        {activeTab === 'customers' && <div style={styles.placeholder}>Customers Screen - Coming Soon</div>}
        {activeTab === 'reports' && <div style={styles.placeholder}>Sales Reports - Coming Soon</div>}
      </div>
    </div>
  );
};

// ====================
// ORDERS SCREEN COMPONENT
// ====================
const OrdersScreen = () => {
  // ====================
  // STATE MANAGEMENT
  // ====================
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [paginatedOrders, setPaginatedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // ====================
  // EFFECTS
  // ====================
  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'created_at':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        case 'total':
          aVal = a.total;
          bVal = b.total;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [filteredOrders, currentPage, pageSize]);

  // ====================
  // API FUNCTIONS
  // ====================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Error loading orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      // First, fetch the order to get items
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Update status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // If accepted, reduce stock for each item
      if (status === 'accepted' && order.items) {
        for (const item of order.items) {
          const { error: stockError } = await supabase.rpc('reduce_stock', {
            product_id_param: item.id, // Assuming item.id is product_id
            quantity_param: item.quantity
          });

          if (stockError) {
            console.error('Error reducing stock for product', item.id, stockError);
            alert('Order accepted but failed to reduce stock for some items: ' + stockError.message);
            // Continue with other items
          }
        }
      }

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order: ' + error.message);
    }
  };

  // ====================
  // EVENT HANDLERS
  // ====================
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedOrder(null);
    setShowDetailsModal(false);
  };

  // ====================
  // UTILITY FUNCTIONS
  // ====================
  const getStatusColor = (status) => {
    return 'var(--sky-blue)';
  };

  // ====================
  // RENDER
  // ====================
  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSortBy(by);
            setSortOrder(order);
          }}
          style={styles.filterSelect}
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="total-desc">Highest Total</option>
          <option value="total-asc">Lowest Total</option>
          <option value="status-asc">Status A-Z</option>
          <option value="status-desc">Status Z-A</option>
        </select>
      </div>

      {showDetailsModal && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.detailsModal}>
            <div style={styles.modalHeader}>
              <h2>Order Details</h2>
              <button style={styles.closeButton} onClick={closeDetailsModal}>×</button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.orderInfo}>
                <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                <p><strong>Customer:</strong> {selectedOrder.customer_name || 'Unknown'}</p>
                <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                <p><strong>Address:</strong> {selectedOrder.customer_address}</p>
                <p><strong>Total:</strong> ₱{selectedOrder.total}</p>
                <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedOrder.status) }}>{selectedOrder.status}</span></p>
                <p><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <div style={styles.itemsList}>
                <h3>Items:</h3>
                {selectedOrder.items && selectedOrder.items.map((item, index) => (
                  <div key={index} style={styles.item}>
                    <div style={styles.itemDetails}>
                      {item.image_url && <img src={item.image_url} alt={item.name} style={styles.itemImage} />}
                      <div style={styles.itemInfo}>
                        <span style={styles.itemName}>{item.name}</span>
                        {item.description && <p style={styles.itemDescription}>{item.description}</p>}
                        <span style={styles.itemQuantity}>Quantity: {item.quantity}</span>
                      </div>
                    </div>
                    <div style={styles.itemPrice}>
                      <span>₱{item.price} each</span>
                      <span>₱{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
              {selectedOrder.review && (
                <div style={styles.reviewSection}>
                  <h3>Customer Review:</h3>
                  <p style={styles.reviewText}>{selectedOrder.review}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.ordersList}>
        {paginatedOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No orders found.</p>
          </div>
        ) : (
          paginatedOrders.map(order => (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderCardInfo}>
                <div style={styles.orderHeader}>
                  <h3 style={styles.orderId}>Order #{order.id}</h3>
                  <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(order.status) }}>
                    {order.status}
                  </span>
                </div>
                <p style={styles.customerName}>{order.customer_name}</p>
                <p style={styles.orderTotal}>Total: ₱{order.total}</p>
                <p style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div style={styles.orderActions}>
                <button
                  style={styles.viewButton}
                  onClick={() => viewOrderDetails(order)}
                >
                  View Details
                </button>
                {order.status === 'pending' && (
                  <>
                    <button
                      style={styles.acceptButton}
                      onClick={() => updateOrderStatus(order.id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      style={styles.declineButton}
                      onClick={() => updateOrderStatus(order.id, 'declined')}
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {filteredOrders.length > pageSize && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {Math.ceil(filteredOrders.length / pageSize)}
          </span>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredOrders.length / pageSize), currentPage + 1))}
            disabled={currentPage === Math.ceil(filteredOrders.length / pageSize)}
          >
            Next
          </button>
        </div>
      )}
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
  placeholder: {
    textAlign: 'center',
    padding: '50px',
    color: 'var(--sky-blue)',
    fontSize: '18px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '20px',
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
  detailsModal: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '600px',
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
  orderInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  itemsList: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  itemDetails: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: '8px',
    marginRight: '12px',
    objectFit: 'cover',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    color: 'var(--dark-blue)',
    display: 'block',
    marginBottom: '4px',
  },
  itemDescription: {
    fontSize: '12px',
    color: 'var(--sky-blue)',
    margin: '4px 0',
    lineHeight: '1.4',
  },
  itemQuantity: {
    fontSize: '12px',
    color: 'var(--sky-blue)',
  },
  itemPrice: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orderCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    background: '#fff',
  },
  orderCardInfo: {
    flex: 1,
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  orderId: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--dark-blue)',
  },
  statusBadge: {
    color: 'var(--white)',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  customerName: {
    color: 'var(--sky-blue)',
    margin: '4px 0',
    fontSize: '14px',
  },
  orderTotal: {
    fontWeight: '600',
    color: 'var(--dark-blue)',
    margin: '4px 0',
  },
  orderDate: {
    color: 'var(--sky-blue)',
    margin: '4px 0',
    fontSize: '12px',
  },
  orderActions: {
    display: 'flex',
    gap: '8px',
  },
  viewButton: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  acceptButton: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  declineButton: {
    background: 'var(--dark-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  reviewSection: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
    marginTop: '20px',
  },
  reviewText: {
    background: 'var(--white)',
    padding: '12px',
    borderRadius: '8px',
    fontStyle: 'italic',
    color: 'var(--dark-blue)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    color: 'var(--sky-blue)',
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

export default SalesManagement;