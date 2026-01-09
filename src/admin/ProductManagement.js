import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: ''
  });
  const lowStockThreshold = 10;
  const [editingStock, setEditingStock] = useState(null);
  const [stockInput, setStockInput] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error loading products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        image_url: formData.image_url,
        stock: parseInt(formData.stock) || 0
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
      }

      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image_url: product.image_url || '',
      stock: product.stock || ''
    });
    setShowForm(true);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;
      fetchProducts();
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product: ' + error.message);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      stock: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0 || quantity === null || quantity === undefined) return { status: 'Out of Stock', color: '#ef4444' };
    if (quantity <= lowStockThreshold) return { status: 'Low Stock', color: '#f59e0b' };
    return { status: 'In Stock', color: '#10b981' };
  };

  const adjustStock = async (productId, adjustment) => {
    try {
      if (adjustment > 0) {
        const { error } = await supabase.rpc('add_stock', { product_id_param: productId, quantity_param: adjustment });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('reduce_stock', { product_id_param: productId, quantity_param: Math.abs(adjustment) });
        if (error) throw error;
      }
      fetchProducts();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock: ' + error.message);
    }
  };

  const startEditingStock = (product) => {
    setEditingStock(product.id);
    setStockInput(product.stock || 0);
  };

  const saveStockEdit = async (productId) => {
    try {
      const newStock = parseInt(stockInput) || 0;
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;
      setEditingStock(null);
      setStockInput('');
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock: ' + error.message);
    }
  };

  const cancelStockEdit = () => {
    setEditingStock(null);
    setStockInput('');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Product Management</h1>
            <p style={styles.subtitle}>Manage your product catalog</p>
          </div>
          <button
            style={styles.addButton}
            onClick={() => setShowForm(true)}
          >
            + Add Product
          </button>
        </div>
      </div>

      {showForm && (
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button style={styles.closeButton} onClick={resetForm}>×</button>
          </div>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                style={styles.textarea}
                rows="3"
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price (₱)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  style={styles.input}
                  step="0.01"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  style={styles.input}
                  min="0"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formActions}>
              <button type="button" style={styles.cancelButton} onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteConfirm && productToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.modalTitle}>Delete Product</h3>
            <p style={styles.confirmMessage}>
              Are you sure you want to delete "{productToDelete.name}"? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={cancelDelete}>
                Cancel
              </button>
              <button style={styles.deleteConfirmButton} onClick={confirmDelete}>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.productsList}>
        {products.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No products found. Add your first product to get started.</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} style={styles.productCard}>
              <div style={styles.productInfo}>
                <div style={styles.productHeader}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <div style={styles.productBadges}>
                    {product.featured && <span style={styles.badge}>Featured</span>}
                    {(() => {
                      const stockInfo = getStockStatus(product.stock);
                      return <span style={{...styles.badge, background: stockInfo.color}}>{stockInfo.status}</span>;
                    })()}
                  </div>
                </div>
                <p style={styles.productDescription}>{product.description}</p>
                <div style={styles.productDetails}>
                  {product.price && <span style={styles.detail}>₱{product.price}</span>}
                  {product.stock !== undefined && (
                    <span style={styles.detail}>
                      Stock: {editingStock === product.id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            value={stockInput}
                            onChange={(e) => setStockInput(e.target.value)}
                            style={{ width: '60px', padding: '2px 4px', fontSize: '14px' }}
                            min="0"
                          />
                          <button onClick={() => saveStockEdit(product.id)} style={{ padding: '2px 6px', fontSize: '12px' }}>Save</button>
                          <button onClick={cancelStockEdit} style={{ padding: '2px 6px', fontSize: '12px' }}>Cancel</button>
                        </div>
                      ) : (
                        <span onClick={() => startEditingStock(product)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                          {product.stock}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div style={styles.productActions}>
                <button
                  style={styles.editButton}
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  style={{...styles.editButton, background: '#10b981'}}
                  onClick={() => adjustStock(product.id, 1)}
                >
                  +1 Stock
                </button>
                <button
                  style={{...styles.editButton, background: '#f59e0b'}}
                  onClick={() => adjustStock(product.id, -1)}
                >
                  -1 Stock
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(product)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
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
    color: '#023e8a',
    margin: '0 0 8px 0',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  addButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
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
  formContainer: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    border: '1px solid #e5e7eb',
  },
  formHeader: {
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
    color: '#6b7280',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
  },
  formGroup: {
    flex: 1,
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
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
  confirmModal: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
  },
  confirmMessage: {
    margin: '0 0 24px 0',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  deleteConfirmButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  productsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  productCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    background: '#fff',
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  productName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
  },
  productBadges: {
    display: 'flex',
    gap: '8px',
  },
  badge: {
    background: '#10b981',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeUnavailable: {
    background: '#ef4444',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  productDescription: {
    color: '#6b7280',
    margin: '8px 0',
    fontSize: '14px',
  },
  productDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#374151',
  },
  detail: {
    fontWeight: '500',
  },
  productActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  deleteButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    color: '#6b7280',
  },
};

export default ProductManagement;