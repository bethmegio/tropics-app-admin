// InventoryManagement.js - Component for inventory management module
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { FaBoxOpen, FaChartBar, FaTags, FaTruck, FaExclamationTriangle, FaSync } from 'react-icons/fa';

// ====================
// MAIN COMPONENT
// ====================
const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { key: 'products', icon: <FaBoxOpen />, label: 'Products' },
    { key: 'stock', icon: <FaChartBar />, label: 'Stock Levels' },
    { key: 'categories', icon: <FaTags />, label: 'Categories' },
    { key: 'suppliers', icon: <FaTruck />, label: 'Suppliers' },
    { key: 'lowstock', icon: <FaExclamationTriangle />, label: 'Low Stock' },
    { key: 'reports', icon: <FaChartBar />, label: 'Reports' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Inventory Management</h1>
            <p style={styles.subtitle}>Track and manage your inventory</p>
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
        {activeTab === 'products' && <ProductsScreen />}
        {activeTab === 'stock' && <StockLevelsScreen />}
        {activeTab === 'categories' && <div style={styles.placeholder}>Categories Screen - Coming Soon</div>}
        {activeTab === 'suppliers' && <div style={styles.placeholder}>Suppliers Screen - Coming Soon</div>}
        {activeTab === 'lowstock' && <LowStockScreen />}
        {activeTab === 'reports' && <div style={styles.placeholder}>Inventory Reports - Coming Soon</div>}
      </div>
    </div>
  );
};

// ====================
// PRODUCTS SCREEN COMPONENT
// ====================
const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [productToAddStock, setProductToAddStock] = useState(null);
  const [addQuantity, setAddQuantity] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock_quantity: ''
  });

  useEffect(() => {
    fetchProducts();

    // Real-time subscription for product updates
    const productsChannel = supabase
      .channel('products-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts()
      )
      .subscribe();

    return () => supabase.removeChannel(productsChannel);
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
      const newStock = parseInt(formData.stock_quantity) || 0;
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        image_url: formData.image_url,
      };

      if (editingProduct) {
        const currentStock = editingProduct.stock_quantity || 0;
        if (newStock < currentStock) {
          // Reducing stock, use safe function
          const reduceAmount = currentStock - newStock;
          const { error: stockError } = await supabase.rpc('reduce_stock', {
            product_id_param: editingProduct.id,
            quantity_param: reduceAmount
          });
          if (stockError) throw stockError;
        } else if (newStock > currentStock) {
          // Increasing stock, update directly
          productData.stock_quantity = newStock;
          const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', editingProduct.id);
          if (error) throw error;
        }
        // If equal, no change needed
      } else {
        // New product
        productData.stock_quantity = newStock;
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
      stock_quantity: product.stock_quantity || ''
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
      stock_quantity: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStock = (product) => {
    setProductToAddStock(product);
    setAddQuantity('');
    setShowAddStockModal(true);
  };

  const confirmAddStock = async () => {
    const quantity = parseInt(addQuantity);
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    try {
      const { error } = await supabase.rpc('add_stock', {
        product_id_param: productToAddStock.id,
        quantity_param: quantity
      });
      if (error) throw error;
      fetchProducts();
      setShowAddStockModal(false);
      setProductToAddStock(null);
      setAddQuantity('');
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock: ' + error.message);
    }
  };

  const cancelAddStock = () => {
    setShowAddStockModal(false);
    setProductToAddStock(null);
    setAddQuantity('');
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.headerContent}>
        <div></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={styles.refreshButton}
            onClick={fetchProducts}
          >
            <FaSync /> Refresh
          </button>
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
                <label style={styles.label}>Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
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

      {showAddStockModal && productToAddStock && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.modalTitle}>Add Stock</h3>
            <p style={styles.confirmMessage}>
              Add stock to "{productToAddStock.name}" (Current: {productToAddStock.stock_quantity})
            </p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity to Add</label>
              <input
                type="number"
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                style={styles.input}
                min="1"
                placeholder="Enter quantity"
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={cancelAddStock}>
                Cancel
              </button>
              <button style={styles.submitButton} onClick={confirmAddStock}>
                Add Stock
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
            <div
              key={product.id}
              style={{
                ...styles.productCard,
                border: product.stock_quantity <= 5 ? '2px solid var(--sky-blue)' : '1px solid #e5e7eb',
                boxShadow: product.stock_quantity <= 5 ? '0 0 10px var(--sky-blue)' : '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div style={styles.productInfo}>
                <div style={styles.productHeader}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <div style={styles.productBadges}>
                    {product.stock_quantity <= 5 && <span style={styles.lowStockBadge}>Low Stock</span>}
                  </div>
                </div>
                <p style={styles.productDescription}>{product.description}</p>
                <div style={styles.productDetails}>
                  {product.price && <span style={styles.detail}>₱{product.price}</span>}
                  {product.stock_quantity !== undefined && <span style={styles.detail}>Stock: {product.stock_quantity}</span>}
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
                  style={styles.addStockButton}
                  onClick={() => handleAddStock(product)}
                >
                  Add Stock
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

// ====================
// STOCK LEVELS SCREEN COMPONENT
// ====================
const StockLevelsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [productToAddStock, setProductToAddStock] = useState(null);
  const [addQuantity, setAddQuantity] = useState('');

  useEffect(() => {
    fetchProducts();

    // Real-time subscription for product updates
    const productsChannel = supabase
      .channel('products-stock-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts()
      )
      .subscribe();

    return () => supabase.removeChannel(productsChannel);
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

  const handleAddStock = (product) => {
    setProductToAddStock(product);
    setAddQuantity('');
    setShowAddStockModal(true);
  };

  const confirmAddStock = async () => {
    const quantity = parseInt(addQuantity);
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    try {
      const { error } = await supabase.rpc('add_stock', {
        product_id_param: productToAddStock.id,
        quantity_param: quantity
      });
      if (error) throw error;
      fetchProducts();
      setShowAddStockModal(false);
      setProductToAddStock(null);
      setAddQuantity('');
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock: ' + error.message);
    }
  };

  const cancelAddStock = () => {
    setShowAddStockModal(false);
    setProductToAddStock(null);
    setAddQuantity('');
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading stock levels...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.headerContent}>
        <div></div>
        <button
          style={styles.refreshButton}
          onClick={fetchProducts}
        >
          <FaSync /> Refresh
        </button>
      </div>

      {showAddStockModal && productToAddStock && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.modalTitle}>Add Stock</h3>
            <p style={styles.confirmMessage}>
              Add stock to "{productToAddStock.name}" (Current: {productToAddStock.stock_quantity})
            </p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity to Add</label>
              <input
                type="number"
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                style={styles.input}
                min="1"
                placeholder="Enter quantity"
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={cancelAddStock}>
                Cancel
              </button>
              <button style={styles.submitButton} onClick={confirmAddStock}>
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.stockLevelsList}>
        {products.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No products found. Add products first to manage stock levels.</p>
          </div>
        ) : (
          products.map(product => (
            <div
              key={product.id}
              style={{
                ...styles.stockCard,
                border: product.stock_quantity <= 5 ? '2px solid var(--sky-blue)' : '1px solid #e5e7eb',
                boxShadow: product.stock_quantity <= 5 ? '0 0 10px var(--sky-blue)' : '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div style={styles.productInfo}>
                <div style={styles.productHeader}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <div style={styles.productBadges}>
                    {product.stock_quantity <= 5 && <span style={styles.lowStockBadge}>Low Stock</span>}
                  </div>
                </div>
                <p style={styles.productDescription}>{product.description}</p>
                <div style={styles.productDetails}>
                  {product.price && <span style={styles.detail}>₱{product.price}</span>}
                  <span style={styles.detail}>Current Stock: {product.stock_quantity}</span>
                </div>
              </div>
              <div style={styles.stockActions}>
                <button
                  style={styles.addStockButton}
                  onClick={() => handleAddStock(product)}
                >
                  <FaBoxOpen /> Add Stock
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ====================
// LOW STOCK SCREEN COMPONENT
// ====================
const LowStockScreen = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLowStockProducts();

    // Real-time subscription for product updates
    const productsChannel = supabase
      .channel('low-stock-products-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchLowStockProducts()
      )
      .subscribe();

    return () => supabase.removeChannel(productsChannel);
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, image_url, created_at')
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      setLowStockProducts(data || []);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      alert('Error loading low stock products: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLowStockProducts();
  };

  const handleProductClick = (product) => {
    // For now, alert; in full app, navigate to edit
    alert(`Edit product: ${product.name}`);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading low stock products...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.headerContent}>
        <div></div>
        <button
          style={styles.refreshButton}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSync style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={styles.lowStockList}>
        {lowStockProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No low stock products found. All items are well-stocked!</p>
          </div>
        ) : (
          lowStockProducts.map(product => (
            <div
              key={product.id}
              style={{
                ...styles.lowStockCard,
                opacity: product.stock_quantity === 0 ? 0.6 : 1,
                cursor: 'pointer',
              }}
              onClick={() => handleProductClick(product)}
            >
              {product.image_url && (
                <img src={product.image_url} alt={product.name} style={styles.productImage} />
              )}
              <div style={styles.productInfo}>
                <h3 style={styles.productName}>{product.name}</h3>
                <div style={styles.productDetails}>
                  <span style={styles.stockBadge}>
                    Stock: {product.stock_quantity}
                  </span>
                  {product.price && <span style={styles.price}>₱{product.price}</span>}
                </div>
              </div>
            </div>
          ))
        )}
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
  placeholder: {
    textAlign: 'center',
    padding: '50px',
    color: 'var(--sky-blue)',
    fontSize: '18px',
  },
  addButton: {
    background: 'var(--blue-gradient)',
    color: 'var(--white)',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  refreshButton: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  formContainer: {
    background: 'var(--white)',
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
    color: 'var(--sky-blue)',
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
    color: 'var(--dark-blue)',
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
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitButton: {
    background: 'var(--blue-gradient)',
    color: 'var(--white)',
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
    color: 'var(--dark-blue)',
  },
  confirmMessage: {
    margin: '0 0 24px 0',
    color: 'var(--sky-blue)',
    lineHeight: '1.5',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  deleteConfirmButton: {
    background: 'var(--dark-blue)',
    color: 'var(--white)',
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
    borderRadius: '12px',
    background: 'var(--white)',
    transition: 'all 0.3s ease',
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
    color: 'var(--dark-blue)',
  },
  productBadges: {
    display: 'flex',
    gap: '8px',
  },
  lowStockBadge: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  productDescription: {
    color: 'var(--sky-blue)',
    margin: '8px 0',
    fontSize: '14px',
  },
  productDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: 'var(--dark-blue)',
  },
  detail: {
    fontWeight: '500',
  },
  productActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  deleteButton: {
    background: 'var(--dark-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  addStockButton: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    color: 'var(--sky-blue)',
  },
  lowStockList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  lowStockCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    borderRadius: '12px',
    background: 'var(--white)',
    border: '2px solid var(--sky-blue)',
    boxShadow: '0 0 10px var(--sky-blue)',
    transition: 'all 0.3s ease',
  },
  productImage: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    marginRight: '16px',
  },
  stockBadge: {
    background: 'var(--sky-blue)',
    color: 'var(--white)',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  price: {
    fontWeight: '600',
    color: 'var(--dark-blue)',
  },
  stockLevelsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stockCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderRadius: '12px',
    background: 'var(--white)',
    transition: 'all 0.3s ease',
  },
  stockActions: {
    display: 'flex',
    gap: '8px',
  },
};

export default InventoryManagement;