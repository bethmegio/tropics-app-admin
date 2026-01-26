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
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaFilter,
  FaPrint,
  FaDownload,
  FaEye,
  FaTrash,
  FaEdit,
  FaPlus,
  FaChartLine,
  FaStore,
  FaMobileAlt,
  FaTools,
  FaCar,
  FaCarAlt,
  FaOilCan,
  FaShieldAlt,
  FaUserCircle,
  FaTag,
  FaSync,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaBox
} from 'react-icons/fa';

// ====================
// REUSABLE COMPONENTS
// ====================

// Status badge component
const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  return (
    <span style={{
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'capitalize',
      backgroundColor: color.background,
      color: color.color,
      border: `1px solid ${color.border}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      {status === 'in_progress' && <FaClock size={10} />}
      {status === 'completed' && <FaCheckCircle size={10} />}
      {status === 'cancelled' && <FaTimesCircle size={10} />}
      {status.replace('_', ' ')}
    </span>
  );
};

// Customer source badge component
const CustomerSourceBadge = ({ order }) => {
  if (!order.user_id) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#fff7ed',
        color: '#ea580c',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        marginLeft: '8px'
      }}>
        <FaStore size={10} />
        Walk-in
      </span>
    );
  }
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#e0f2fe',
      color: '#0369a1',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      marginLeft: '8px'
    }}>
      <FaMobileAlt size={10} />
      {order.profile_full_name ? 'Registered' : 'App User'}
    </span>
  );
};

// Stat card component
const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  }}>
    <div style={{
      backgroundColor: bgColor,
      padding: '12px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '4px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827'
      }}>
        {value}
      </div>
    </div>
  </div>
);

// OrderRow with product details component
const OrderRowWithProducts = ({ order, onView, onUpdateStatus, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDate(order.created_at);

  // Function to render product details
  const renderProducts = () => {
    if (!order.products || order.products.length === 0) {
      return <div style={{ fontSize: '12px', color: '#6b7280' }}>No products</div>;
    }

    return (
      <div style={{ marginTop: '4px' }}>
        {order.products.slice(0, 2).map((product, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            padding: '2px 0'
          }}>
            <span style={{ 
              fontWeight: '500', 
              color: '#374151',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {product.name || `Product #${product.product_id}`}
            </span>
            <span style={{ 
              fontWeight: '600', 
              color: '#059669',
              marginLeft: '8px'
            }}>
              ×{product.quantity || 1}
            </span>
          </div>
        ))}
        {order.products.length > 2 && (
          <div style={{
            fontSize: '10px',
            color: '#6b7280',
            fontStyle: 'italic',
            marginTop: '2px'
          }}>
            +{order.products.length - 2} more items
          </div>
        )}
      </div>
    );
  };

  return (
    <tr style={{
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s ease'
    }}>
      <td style={{ padding: '16px', fontSize: '14px' }}>
        <div style={{ fontWeight: '600', color: '#111827' }}>#{order.id}</div>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px'
        }}>
          {order.channel === 'mobile' ? (
            <>
              <FaMobileAlt size={10} /> Mobile
            </>
          ) : (
            <>
              <FaStore size={10} /> Walk-in
            </>
          )}
        </div>
      </td>
      
      <td style={{ padding: '16px' }}>
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px' 
          }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaUser size={12} color="#6b7280" />
              {order.customer_name}
              <CustomerSourceBadge order={order} />
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '2px'
          }}>
            <FaEnvelope size={12} />
            {order.customer_email}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaPhone size={12} />
            {order.customer_phone}
          </div>
        </div>
      </td>
      
      <td style={{ padding: '16px' }}>
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '4px'
          }}>
            <FaBox size={12} color="#6b7280" />
            <span style={{ fontWeight: '500', fontSize: '13px' }}>
              {order.total_items || 0} items
            </span>
          </div>
          {renderProducts()}
        </div>
      </td>
      
      <td style={{ padding: '16px' }}>
        <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>
          ₱{order.total.toLocaleString()}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          textTransform: 'capitalize',
          marginTop: '4px'
        }}>
          {order.payment_method}
        </div>
      </td>
      
      <td style={{ padding: '16px' }}>
        <div style={{ fontWeight: '500', color: '#111827' }}>{date}</div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>{time}</div>
      </td>
      
      <td style={{ padding: '16px' }}>
        <StatusBadge status={order.status} />
      </td>
      
      <td style={{ padding: '16px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          justifyContent: 'flex-end' 
        }}>
          <button
            onClick={() => onView(order)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="View Details"
          >
            <FaEye size={14} />
          </button>
          
          {order.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'confirmed')}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1fae5',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Confirm Order"
            >
              <FaCheckCircle size={14} />
            </button>
          )}
          
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #fee2e2',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Cancel Order"
            >
              <FaTimesCircle size={14} />
            </button>
          )}
          
          <button
            onClick={() => onDelete(order.id)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #fee2e2',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Delete Order"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Order #{order.id}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: '#6b7280',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
        
        {/* Modal Content */}
        <div style={{ padding: '24px' }}>
          {/* Customer Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Customer Information
            </h3>
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaUser size={16} color="#6b7280" />
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Name
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {order.customer_name}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaEnvelope size={16} color="#6b7280" />
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Email
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#111827'
                  }}>
                    {order.customer_email}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaPhone size={16} color="#6b7280" />
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Phone
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#111827'
                  }}>
                    {order.customer_phone}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Order Details
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Status
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Channel
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#111827'
                }}>
                  {order.channel === 'mobile' ? 'Mobile App' : 'Walk-in'}
                </div>
              </div>
              
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Payment Method
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#111827',
                  textTransform: 'capitalize'
                }}>
                  {order.payment_method}
                </div>
              </div>
              
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Order Date
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#111827'
                }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Products Section */}
          {order.products && order.products.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Products ({order.total_items || 0} items)
              </h3>
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {order.products.map((product, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < order.products.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        ₱{product.price?.toLocaleString() || '0'} × {product.quantity || 1}
                      </div>
                    </div>
                    <div style={{ fontWeight: '600', color: '#059669' }}>
                      ₱{((product.price || 0) * (product.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Total Amount */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Amount Summary
            </h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#6b7280' }}>Subtotal:</span>
                <span>₱{order.subtotal?.toLocaleString() || '0'}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#6b7280' }}>Tax:</span>
                <span>₱{order.tax?.toLocaleString() || '0'}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#6b7280' }}>Discount:</span>
                <span style={{ color: '#ef4444' }}>
                  -₱{order.discount?.toLocaleString() || '0'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
                marginTop: '8px'
              }}>
                <span style={{
                  fontWeight: '600',
                  fontSize: '18px',
                  color: '#111827'
                }}>
                  Total:
                </span>
                <span style={{
                  fontWeight: '700',
                  fontSize: '20px',
                  color: '#3b82f6'
                }}>
                  ₱{order.total?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {order.notes && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                Notes
              </h3>
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                color: '#4b5563'
              }}>
                {order.notes}
              </div>
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================
// HELPER FUNCTIONS
// ====================
const getStatusColor = (status) => {
  const colors = {
    pending: { background: '#fffbeb', color: '#f59e0b', border: '#fcd34d' },
    confirmed: { background: '#e0f2fe', color: '#0284c7', border: '#7dd3fc' },
    in_progress: { background: '#f0f9ff', color: '#0ea5e9', border: '#bae6fd' },
    completed: { background: '#f0fdf4', color: '#16a34a', border: '#86efac' },
    cancelled: { background: '#fef2f2', color: '#dc2626', border: '#fca5a5' }
  };
  return colors[status] || { background: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
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
// ORDERS SCREEN COMPONENT
// ====================
const OrdersScreen = ({ orders, fetchOrders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getFilteredOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.customer_name?.toLowerCase().includes(term) ||
        order.customer_email?.toLowerCase().includes(term) ||
        order.customer_phone?.includes(searchTerm) ||
        order.id?.toString().includes(searchTerm) ||
        order.products?.some(product => 
          product.name?.toLowerCase().includes(term)
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    return filtered;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh orders after update
      if (fetchOrders) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status: ' + error.message);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh orders after delete
      if (fetchOrders) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order: ' + error.message);
    }
  };

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    walkIn: orders.filter(o => !o.user_id).length,
    mobile: orders.filter(o => o.user_id).length,
    totalItems: orders.reduce((sum, order) => sum + (order.total_items || 0), 0)
  };

  const filteredOrders = getFilteredOrders();

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
            margin: '0 0 4px 0'
          }}>
            Order Management
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Manage and track customer orders
          </p>
        </div>
        
        <button
          onClick={fetchOrders}
          disabled={refreshing}
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
            opacity: refreshing ? 0.7 : 1
          }}
        >
          <FaSync style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          icon={FaShoppingBag}
          title="Total Orders"
          value={stats.total}
          color="#3b82f6"
          bgColor="#eff6ff"
        />
        <StatCard
          icon={FaShoppingCart}
          title="Total Items"
          value={stats.totalItems}
          color="#10b981"
          bgColor="#f0fdf4"
        />
        <StatCard
          icon={FaClock}
          title="Pending"
          value={stats.pending}
          color="#f59e0b"
          bgColor="#fffbeb"
        />
        <StatCard
          icon={FaCheckCircle}
          title="Completed"
          value={stats.completed}
          color="#059669"
          bgColor="#d1fae5"
        />
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Search Orders
            </label>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search by customer, product, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
              />
            </div>
          </div>
          
          <div style={{ minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
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
            <FaFilter />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Recent Orders
          </h2>
          <div style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '1200px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Order ID
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Customer
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Products
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Amount
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Date & Time
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ 
                    padding: '48px 16px', 
                    textAlign: 'center' 
                  }}>
                    <FaShoppingBag size={48} color="#d1d5db" />
                    <h3 style={{ 
                      margin: '16px 0 8px 0', 
                      color: '#111827', 
                      fontSize: '18px' 
                    }}>
                      No Orders Found
                    </h3>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '14px',
                      margin: 0 
                    }}>
                      No orders match your search criteria
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <OrderRowWithProducts
                    key={order.id}
                    order={order}
                    onView={(order) => {
                      setSelectedOrder(order);
                      setShowDetails(true);
                    }}
                    onUpdateStatus={updateOrderStatus}
                    onDelete={deleteOrder}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

// ====================
// DASHBOARD SCREEN COMPONENT
// ====================
const DashboardScreen = ({ orders = [] }) => {
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
    todayRevenue: 0,
    totalWalkInCustomers: 0,
    totalMobileCustomers: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);

  // Calculate monthly revenue without circular dependency
  const calculateMonthlyRevenue = (ordersData) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Initialize monthly data
    const monthlyData = months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      revenue: 0,
      growth: 0
    }));
    
    // Calculate revenue for each month
    ordersData.forEach(order => {
      if (!order.created_at) return;
      
      const orderDate = new Date(order.created_at);
      const monthIndex = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      const currentYear = new Date().getFullYear();
      
      // Only count orders from current year
      if (orderYear === currentYear && monthIndex <= currentMonth) {
        monthlyData[monthIndex].revenue += (order.total_amount || order.total || 0);
      }
    });
    
    // Calculate growth rates
    monthlyData.forEach((monthData, index) => {
      if (index > 0) {
        const prevMonthRevenue = monthlyData[index - 1].revenue;
        if (prevMonthRevenue > 0) {
          monthData.growth = ((monthData.revenue / prevMonthRevenue) - 1) * 100;
        }
      }
    });
    
    return monthlyData;
  };

  // Calculate growth percentage compared to previous period
  const calculateGrowth = (currentData, previousData) => {
    if (!previousData || previousData === 0) return 0;
    return ((currentData - previousData) / previousData) * 100;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let dateFilter = new Date();
      let previousDateFilter = new Date();
      
      switch(timeRange) {
        case 'today':
          dateFilter.setHours(0, 0, 0, 0);
          previousDateFilter.setDate(previousDateFilter.getDate() - 1);
          previousDateFilter.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          previousDateFilter.setDate(previousDateFilter.getDate() - 14);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          previousDateFilter.setMonth(previousDateFilter.getMonth() - 2);
          break;
        case 'quarter':
          dateFilter.setMonth(dateFilter.getMonth() - 3);
          previousDateFilter.setMonth(previousDateFilter.getMonth() - 6);
          break;
        case 'year':
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          previousDateFilter.setFullYear(previousDateFilter.getFullYear() - 2);
          break;
      }

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('users')
        .select('id, created_at, full_name, email')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      setCustomers(customersData || []);

      // Filter orders by time range
      const filteredOrders = orders.filter(order => 
        new Date(order.created_at) >= dateFilter
      );

      // Filter customers by time range
      const filteredCustomers = customersData?.filter(customer => 
        new Date(customer.created_at) >= dateFilter
      ) || [];

      // Filter orders for previous period for comparison
      const previousPeriodOrders = orders.filter(order => 
        new Date(order.created_at) >= previousDateFilter && 
        new Date(order.created_at) < dateFilter
      );

      // Filter customers for previous period
      const previousPeriodCustomers = customersData?.filter(customer => 
        new Date(customer.created_at) >= previousDateFilter && 
        new Date(customer.created_at) < dateFilter
      ) || [];

      // Calculate metrics for current period
      const totalRevenue = filteredOrders.reduce((sum, order) => 
        sum + (order.total || 0), 0);

      const totalOrders = filteredOrders.length;
      const totalCustomers = filteredCustomers.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
      const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
      const walkInCustomers = filteredOrders.filter(order => !order.user_id).length;
      const mobileCustomers = filteredOrders.filter(order => order.user_id).length;

      // Calculate metrics for previous period
      const previousTotalRevenue = previousPeriodOrders.reduce((sum, order) => 
        sum + (order.total || 0), 0);
      const previousTotalOrders = previousPeriodOrders.length;
      const previousTotalCustomers = previousPeriodCustomers.length;
      const previousAverageOrderValue = previousTotalOrders > 0 ? previousTotalRevenue / previousTotalOrders : 0;
      const previousPendingOrders = previousPeriodOrders.filter(order => order.status === 'pending').length;
      const previousCompletedOrders = previousPeriodOrders.filter(order => order.status === 'completed').length;

      // Calculate growth percentages
      const revenueGrowth = calculateGrowth(totalRevenue, previousTotalRevenue);
      const ordersGrowth = calculateGrowth(totalOrders, previousTotalOrders);
      const customersGrowth = calculateGrowth(totalCustomers, previousTotalCustomers);
      const avgOrderValueGrowth = calculateGrowth(averageOrderValue, previousAverageOrderValue);
      const pendingOrdersGrowth = calculateGrowth(pendingOrders, previousPendingOrders);
      const completedOrdersGrowth = calculateGrowth(completedOrders, previousCompletedOrders);

      // Calculate today's metrics
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayOrdersData = filteredOrders.filter(order => 
        new Date(order.created_at) >= todayStart
      );
      const todayOrders = todayOrdersData.length;
      const todayRevenue = todayOrdersData.reduce((sum, order) => sum + (order.total || 0), 0);

      // Calculate conversion rate
      const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

      // Calculate monthly revenue
      const monthlyRevenue = calculateMonthlyRevenue(orders);
      
      // Calculate top services from orders
      const serviceRevenue = {};
      filteredOrders.forEach(order => {
        // If order has service_id directly
        if (order.service_id) {
          const service = servicesData?.find(s => s.id === order.service_id);
          if (service) {
            const serviceName = service.name || `Service #${order.service_id}`;
            if (!serviceRevenue[serviceName]) {
              serviceRevenue[serviceName] = { revenue: 0, orders: 0 };
            }
            serviceRevenue[serviceName].revenue += (order.total || 0);
            serviceRevenue[serviceName].orders += 1;
          }
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

      // Get recent orders (5 most recent from all orders)
      const recentOrders = orders.slice(0, 5).map(order => ({
        ...order,
        customer_name: order.customer_name || 'Walk-in Customer',
        customer_phone: order.customer_phone || 'N/A',
        channel: order.channel || 'walk-in',
        total: order.total || 0
      }));

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
        todayRevenue,
        totalWalkInCustomers: walkInCustomers,
        totalMobileCustomers: mobileCustomers,
        growthPercentages: {
          revenue: revenueGrowth,
          orders: ordersGrowth,
          customers: customersGrowth,
          averageOrderValue: avgOrderValueGrowth,
          pendingOrders: pendingOrdersGrowth,
          completedOrders: completedOrdersGrowth
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, orders]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  // Format growth percentage for display
  const formatGrowth = (growth) => {
    if (growth === 0) return { value: '0%', isPositive: true, color: '#6b7280' };
    const isPositive = growth > 0;
    const value = `${isPositive ? '+' : ''}${growth.toFixed(1)}%`;
    const color = isPositive ? '#10b981' : '#ef4444';
    return { value, isPositive, color };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
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
        <div style={styles.todayStatCard}>
          <div style={styles.todayStatIcon}>
            <FaStore size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={styles.todayStatLabel}>Walk-in Customers</div>
            <div style={styles.todayStatValue}>{dashboardData.totalWalkInCustomers}</div>
          </div>
        </div>
        <div style={styles.todayStatCard}>
          <div style={styles.todayStatIcon}>
            <FaMobileAlt size={24} color="#8b5cf6" />
          </div>
          <div>
            <div style={styles.todayStatLabel}>Mobile Customers</div>
            <div style={styles.todayStatValue}>{dashboardData.totalMobileCustomers}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        {[
          {
            title: 'Total Revenue',
            value: `₱${dashboardData.totalRevenue.toLocaleString()}`,
            growth: dashboardData.growthPercentages?.revenue || 0,
            icon: <FaDollarSign />,
            color: '#065f46',
            bgColor: '#d1fae5'
          },
          {
            title: 'Total Orders',
            value: dashboardData.totalOrders,
            growth: dashboardData.growthPercentages?.orders || 0,
            icon: <FaShoppingCart />,
            color: '#1d4ed8',
            bgColor: '#dbeafe'
          },
          {
            title: 'Total Customers',
            value: dashboardData.totalCustomers,
            growth: dashboardData.growthPercentages?.customers || 0,
            icon: <FaUsers />,
            color: '#92400e',
            bgColor: '#fef3c7'
          },
          {
            title: 'Avg Order Value',
            value: `₱${dashboardData.averageOrderValue.toFixed(2)}`,
            growth: dashboardData.growthPercentages?.averageOrderValue || 0,
            icon: <FaChartLine />,
            color: '#be185d',
            bgColor: '#fce7f3'
          },
          {
            title: 'Pending Orders',
            value: dashboardData.pendingOrders,
            growth: dashboardData.growthPercentages?.pendingOrders || 0,
            icon: <FaClock />,
            color: '#991b1b',
            bgColor: '#fee2e2'
          },
          {
            title: 'Completed Orders',
            value: dashboardData.completedOrders,
            growth: dashboardData.growthPercentages?.completedOrders || 0,
            icon: <FaCheckCircle />,
            color: '#166534',
            bgColor: '#dcfce7'
          }
        ].map((kpi, index) => {
          const growth = formatGrowth(kpi.growth);
          return (
            <div key={index} style={styles.kpiCard}>
              <div style={{ ...styles.kpiIcon, background: kpi.bgColor }}>
                {React.cloneElement(kpi.icon, { size: 24, color: kpi.color })}
              </div>
              <div style={styles.kpiContent}>
                <div style={styles.kpiLabel}>{kpi.title}</div>
                <div style={styles.kpiValue}>{kpi.value}</div>
                <div style={styles.kpiChange}>
                  {growth.isPositive ? (
                    <FaArrowUp size={12} color="#10b981" />
                  ) : growth.value === '0%' ? (
                    <span style={{ width: '12px' }} />
                  ) : (
                    <FaArrowDown size={12} color="#ef4444" />
                  )}
                  <span style={{ 
                    color: growth.color,
                    marginLeft: '4px',
                    fontSize: '13px'
                  }}>
                    {growth.value} from last {timeRange}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
                        height: `${Math.min(100, (item.revenue / Math.max(...dashboardData.monthlyRevenue.map(m => m.revenue))) * 100)}%`,
                        background: item.growth > 0 
                          ? 'linear-gradient(to top, #0077b6, #00b4d8)'
                          : item.growth < 0
                          ? 'linear-gradient(to top, #ef4444, #f87171)'
                          : 'linear-gradient(to top, #6b7280, #9ca3af)'
                      }}
                    >
                      <div style={styles.revenueBarValue}>₱{item.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={styles.revenueGrowth}>
                    {item.growth > 0 ? (
                      <FaArrowUp size={10} color="#10b981" />
                    ) : item.growth < 0 ? (
                      <FaArrowDown size={10} color="#ef4444" />
                    ) : null}
                    <span style={{ 
                      color: item.growth > 0 ? '#10b981' : item.growth < 0 ? '#ef4444' : '#6b7280',
                      fontSize: '11px',
                      marginLeft: '2px'
                    }}>
                      {item.growth !== 0 ? `${Math.abs(item.growth).toFixed(1)}%` : '-'}
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
            <button 
              style={styles.viewAllButton}
              onClick={() => console.log('View all services')}
            >
              View Details
            </button>
          </div>
          <div style={styles.chartContent}>
            <div style={styles.topServicesList}>
              {dashboardData.topServices.length > 0 ? (
                dashboardData.topServices.map((service, index) => (
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
                        {dashboardData.totalRevenue > 0 
                          ? `${((service.revenue / dashboardData.totalRevenue) * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noDataMessage}>
                  No service data available for the selected period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div style={{ ...styles.chartCard, gridColumn: 'span 2' }}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Recent Orders</h3>
            <button 
              style={styles.viewAllButton}
              onClick={() => console.log('View all orders')}
            >
              View All
            </button>
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
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
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
                      {order.channel === 'mobile' ? <FaMobileAlt size={12} /> : <FaStore size={12} />}
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
// SERVICES SCREEN COMPONENT
// ====================


// ====================
// BOOKING MANAGEMENT COMPONENT
// ====================
const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Try different table names based on your Supabase setup
      let bookingsData;
      let bookingsError;
      
      // Try 'bookings' table first
      ({ data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false }));
      
      // If 'bookings' doesn't exist, try 'appointments'
      if (bookingsError && bookingsError.code === 'PGRST116') {
        console.log('Bookings table not found, trying appointments...');
        ({ data: bookingsData, error: bookingsError } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false }));
      }
      
      if (bookingsError) {
        console.error('Bookings fetch error:', bookingsError);
        // Set empty array if table doesn't exist
        setBookings([]);
        setLoading(false);
        return;
      }

      const formattedBookings = (bookingsData || []).map(booking => ({
        id: booking.id,
        customer_name: booking.name || booking.customer_name || 'Guest',
        customer_email: booking.email || booking.customer_email || 'No email',
        customer_phone: booking.contact || booking.customer_phone || 'No phone',
        service_name: booking.service || booking.service_name || 'General Service',
        scheduled_date: booking.date || booking.scheduled_date || new Date().toISOString().split('T')[0],
        scheduled_time: booking.time || booking.scheduled_time || '10:00',
        status: booking.status || 'pending',
        notes: booking.message || booking.notes || '',
        location: booking.location || 'N/A',
        created_at: booking.created_at || new Date().toISOString()
      }));

      setBookings(formattedBookings);
      
    } catch (error) {
      console.error('Error in fetchBookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
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
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

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
        <div className="spinner" />
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

      {/* Bookings Table */}
      <div style={styles.ordersTableContainer}>
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
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No bookings found. {bookings.length === 0 ? 'No bookings in the system.' : 'Try a different search.'}
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
// REPORTS/ANALYTICS SCREEN COMPONENT
// ====================

// ====================
// MAIN COMPONENT
// ====================
const SalesManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [realtimeOrders, setRealtimeOrders] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch orders
  const fetchOrdersData = useCallback(async () => {
    try {
      console.log('🔄 Starting fetchOrders...');
      setRefreshing(true);
      
      // Get all orders with order_items and products
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (
              id,
              name,
              price,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      console.log('📊 Orders data with items:', ordersData);
      
      if (error) throw error;
      
      // Get user IDs from orders
      const userIds = [...new Set(ordersData.map(order => order.user_id).filter(Boolean))];
      console.log('👤 User IDs found:', userIds);
      
      // Fetch user data from the PUBLIC users table
      let usersMap = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email, phone')
          .in('id', userIds);
        
        console.log('👥 Users data from public.users:', usersData);
        
        if (!usersError && usersData) {
          usersData.forEach(user => {
            usersMap[user.id] = {
              email: user.email,
              phone: user.phone,
              full_name: user.full_name
            };
          });
        }
        console.log('🗺️ Users map:', usersMap);
      }
      
      const formattedOrders = ordersData.map(order => {
        const user = usersMap[order.user_id];
        
        // Extract product details from order_items
        const products = order.order_items?.map(item => ({
          product_id: item.product_id,
          name: item.products?.name || `Product #${item.product_id}`,
          quantity: item.quantity || 1,
          price: item.price || 0,
          image_url: item.products?.image_url || null
        })) || [];
        
        // Calculate total items count
        const totalItems = products.reduce((sum, product) => sum + (product.quantity || 1), 0);
        
        return {
          id: order.id,
          // Customer data
          customer_name: order.customer_name || (user?.full_name || 'Customer'),
          customer_email: order.customer_email || (user?.email || ''),
          customer_phone: order.customer_phone || (user?.phone || ''),
          total: order.total || order.total_amount || 0,
          status: order.status || 'pending',
          payment_method: order.payment_method || 'cash',
          payment_status: order.payment_status || 'pending',
          channel: order.channel || 'walk-in',
          notes: order.notes || '',
          created_at: order.created_at,
          user_id: order.user_id,
          // Product data
          products: products,
          total_items: totalItems,
          // Additional fields for display
          product_count: products.length,
          has_products: products.length > 0,
          subtotal: order.subtotal || 0,
          tax: order.tax || 0,
          discount: order.discount || 0,
          profile_full_name: user?.full_name || null
        };
      });
      
      console.log('📝 Final formatted orders with products:', formattedOrders);
      setOrders(formattedOrders);
      
      // Update dashboard counter with count of recent orders (e.g., from last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const recentOrders = formattedOrders.filter(order => 
        new Date(order.created_at) >= twentyFourHoursAgo
      ) || [];
      
      setRealtimeOrders(recentOrders.length);
      
    } catch (error) {
      console.error('Error:', error);
      setOrders([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  // Real-time subscription
  useEffect(() => {
    const orderSubscription = supabase
      .channel('orders')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders' 
        },
        (payload) => {
          console.log('New order received:', payload.new);
          // Refresh orders when new order is added
          fetchOrdersData();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload.new);
          // Refresh orders when order is updated
          fetchOrdersData();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order deleted:', payload.old);
          // Refresh orders when order is deleted
          fetchOrdersData();
        }
      )
      .subscribe();

    return () => {
      orderSubscription.unsubscribe();
    };
  }, [fetchOrdersData]);

  // Function to mark notifications as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === notificationId ? { ...notification, read: true } : notification
    ));
  };

  // Function to clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  const tabs = [
    { key: 'dashboard', icon: <FaChartBar />, label: 'Dashboard', count: realtimeOrders },
    { key: 'orders', icon: <FaShoppingBag />, label: 'Orders' },
    { key: 'bookings', icon: <FaCalendarCheck />, label: 'Bookings' },
   
   
  ];

  return (
    <div style={styles.container}>
      <style>
        {`
         /* Add these to your global CSS file */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.notification-slide {
  animation: slideIn 0.3s ease-out;
}
        `}
      </style>
      
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>
              <FaShoppingBag style={{ marginRight: '12px' }} />
              Sales Management
              {realtimeOrders > 0 && (
                <span style={{
                  marginLeft: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: '#ef4444',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span className="pulse">●</span>
                  {realtimeOrders} new order{realtimeOrders !== 1 ? 's' : ''}
                </span>
              )}
            </h1>
            <p style={styles.subtitle}>Track sales, manage orders, and analyze performance</p>
          </div>
          <div style={styles.headerActions}>
            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchOrdersData();
              }}
              disabled={refreshing}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                opacity: refreshing ? 0.7 : 1
              }}
            >
              <FaSync style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
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
              position: 'relative'
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span style={styles.tabLabel}>{tab.label}</span>
            {tab.count > 0 && (
              <span style={{
                ...styles.tabBadge,
                animation: tab.key === 'dashboard' && tab.count > 0 ? 'pulse 2s infinite' : 'none'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'dashboard' && <DashboardScreen orders={orders} />}
        {activeTab === 'orders' && <OrdersScreen orders={orders} fetchOrders={fetchOrdersData} />}
      
        {activeTab === 'bookings' && <BookingManagement />}
        
      </div>
    </div>
  );
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
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '20px 0 0 0',
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
    gridTemplateColumns: 'repeat(6, 1fr)',
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
    gridTemplateColumns: 'repeat(6, 1fr)',
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'center',
    transition: 'background 0.2s',
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
  },
  ordersTableContainer: {
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
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#475569',
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
  amount: {
    fontWeight: '600',
    color: '#0077b6',
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
  },
  formTextarea: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '80px',
    transition: 'border 0.2s',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
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
  confirmButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  completeButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
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
  categoryInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  categoryName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
  },
  categoryRevenue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0077b6',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
};

export default SalesManagement;