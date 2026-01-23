 // InventoryManagement.js - Professional Action Buttons Version
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  FaWarehouse, 
  FaExclamationTriangle, 
  FaFilter, 
  FaDownload, 
  FaSearch, 
  FaPlus, 
  FaEdit,
  FaBox,
  FaTrash,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimes,
  FaSave,
  FaImage,
  FaTag,
  FaShoppingCart,
  FaPlusCircle,
  FaMinusCircle,
  FaEllipsisV,
  FaCheck,
  FaUndo,
  FaClipboardList
} from 'react-icons/fa';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [editingStock, setEditingStock] = useState(null);
  const [stockInput, setStockInput] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  // Add Product Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    category_id: '',
    price: 0,
    stock: 0
  });

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortInventory();
  }, [inventory, searchTerm, stockFilter, selectedCategoryId, sortConfig]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
      
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('Error loading inventory: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterAndSortInventory = () => {
    let filtered = [...inventory];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(item => (item.stock || 0) <= 10);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => (item.stock || 0) === 0);
    } else if (stockFilter === 'in') {
      filtered = filtered.filter(item => (item.stock || 0) > 10);
    }

    if (selectedCategoryId !== 'all') {
      filtered = filtered.filter(item => item.category_id === parseInt(selectedCategoryId));
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'stock':
          aVal = a.stock || 0;
          bVal = b.stock || 0;
          break;
        case 'price':
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case 'category':
          aVal = a.categories?.name || '';
          bVal = b.categories?.name || '';
          break;
        case 'created_at':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredInventory(filtered);
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0 || quantity === null || quantity === undefined) {
      return { 
        status: 'Out of Stock', 
        color: '#ef4444', 
        bgColor: '#fee2e2',
        icon: <FaExclamationTriangle />,
        badgeColor: '#dc2626'
      };
    }
    if (quantity <= 10) {
      return { 
        status: 'Low Stock', 
        color: '#f59e0b', 
        bgColor: '#fffbeb',
        icon: <FaExclamationTriangle />,
        badgeColor: '#d97706'
      };
    }
    return { 
      status: 'In Stock', 
      color: '#10b981', 
      bgColor: '#d1fae5',
      icon: <FaBox />,
      badgeColor: '#059669'
    };
  };

  const updateStock = async (productId, newStock) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;
      
      setInventory(prev => prev.map(item => 
        item.id === productId ? { ...item, stock: newStock } : item
      ));
      
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock: ' + error.message);
      fetchInventory();
    }
  };

  const adjustStock = async (productId, adjustment) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, (product.stock || 0) + adjustment);
    await updateStock(productId, newStock);
  };

  const handleStockEdit = (productId, currentStock) => {
    setEditingStock(productId);
    setStockInput(currentStock.toString());
  };

  const saveStockEdit = async (productId) => {
    const newStock = parseInt(stockInput) || 0;
    if (newStock < 0) {
      alert('Stock cannot be negative');
      return;
    }
    await updateStock(productId, newStock);
    setEditingStock(null);
    setStockInput('');
  };

  const cancelStockEdit = () => {
    setEditingStock(null);
    setStockInput('');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0
      };

      if (!productData.name) {
        alert('Product name is required');
        return;
      }

      if (productData.price <= 0) {
        alert('Price must be greater than 0');
        return;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        alert('Product updated successfully!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        alert('Product added successfully!');
      }

      fetchInventory();
      resetForm();
      
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      image_url: product.image_url || '',
      category_id: product.category_id?.toString() || '',
      price: product.price || 0,
      stock: product.stock || 0
    });
    setShowAddForm(true);
  };

  const handleDeleteClick = (product) => {
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
      
      setInventory(prev => prev.filter(item => item.id !== productToDelete.id));
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      category_id: '',
      price: 0,
      stock: 0
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const exportInventory = () => {
    if (filteredInventory.length === 0) {
      alert('No inventory items to export');
      return;
    }

    const headers = ['ID', 'Name', 'Description', 'Category', 'Price', 'Stock', 'Status', 'Created Date'];
    const csvData = filteredInventory.map(item => [
      item.id,
      `"${item.name}"`,
      `"${item.description || 'N/A'}"`,
      item.categories?.name || 'Uncategorized',
      `₱${item.price || 0}`,
      item.stock || 0,
      getStockStatus(item.stock).status,
      new Date(item.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />;
  };

  const lowStockCount = inventory.filter(item => 
    (item.stock || 0) <= 10 && (item.stock || 0) > 0
  ).length;
  
  const outOfStockCount = inventory.filter(item => (item.stock || 0) === 0).length;
  const totalValue = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.stock || 0)), 0);
  const totalItems = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>
              <FaWarehouse style={{ marginRight: '10px' }} />
              Inventory Management
            </h1>
            <p style={styles.subtitle}>Track and manage your product inventory</p>
          </div>
          <div style={styles.headerActions}>
            <button
              style={styles.exportButton}
              onClick={exportInventory}
            >
              <FaDownload /> Export CSV
            </button>
            <button
              style={styles.addButton}
              onClick={() => setShowAddForm(true)}
            >
              <FaPlus /> Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px', borderRadius: '10px' }}>
            <FaBox size={24} color="white" />
          </div>
          <div>
            <div style={styles.statLabel}>Total Products</div>
            <div style={styles.statNumber}>{inventory.length}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', padding: '16px', borderRadius: '10px' }}>
            <FaExclamationTriangle size={24} color="white" />
          </div>
          <div>
            <div style={styles.statLabel}>Low Stock</div>
            <div style={styles.statNumber}>{lowStockCount}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '16px', borderRadius: '10px' }}>
            <FaExclamationTriangle size={24} color="white" />
          </div>
          <div>
            <div style={styles.statLabel}>Out of Stock</div>
            <div style={styles.statNumber}>{outOfStockCount}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '16px', borderRadius: '10px' }}>
            <FaWarehouse size={24} color="white" />
          </div>
          <div>
            <div style={styles.statLabel}>Total Value</div>
            <div style={styles.statNumber}>₱{totalValue.toLocaleString()}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', padding: '16px', borderRadius: '10px' }}>
            <FaShoppingCart size={24} color="white" />
          </div>
          <div>
            <div style={styles.statLabel}>Total Items</div>
            <div style={styles.statNumber}>{totalItems.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Form */}
      {showAddForm && (
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={{ color: '#2d3748', margin: 0 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button style={styles.closeButton} onClick={resetForm}>
              <FaTimes />
            </button>
          </div>
          <form onSubmit={handleAddProduct} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  style={styles.input}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Price (₱) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  style={styles.input}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Initial Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  style={styles.input}
                  min="0"
                />
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                  placeholder="Product description..."
                />
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.label}>Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  style={styles.input}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image_url && (
                  <div style={styles.imagePreview}>
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      style={styles.previewImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div style={styles.imagePlaceholder}>
                      <FaImage size={24} color="#6b7280" />
                      <span>Image preview not available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="button" style={styles.cancelButton} onClick={resetForm}>
                <FaUndo /> Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                <FaSave /> {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <div style={styles.modalHeader}>
              <FaExclamationTriangle size={24} color="#ef4444" />
              <h3 style={styles.modalTitle}>Delete Product</h3>
            </div>
            <p style={styles.confirmMessage}>
              Are you sure you want to delete "<strong>{productToDelete.name}</strong>"? This action cannot be undone.
            </p>
            <div style={styles.productInfo}>
              <div style={styles.productInfoRow}>
                <span style={styles.productInfoLabel}>Price:</span>
                <span style={styles.productInfoValue}>₱{productToDelete.price || 0}</span>
              </div>
              <div style={styles.productInfoRow}>
                <span style={styles.productInfoLabel}>Stock:</span>
                <span style={styles.productInfoValue}>{productToDelete.stock || 0} units</span>
              </div>
              <div style={styles.productInfoRow}>
                <span style={styles.productInfoLabel}>Category:</span>
                <span style={styles.productInfoValue}>{productToDelete.categories?.name || 'Uncategorized'}</span>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.modalCancelButton} onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes /> Cancel
              </button>
              <button style={styles.modalDeleteButton} onClick={confirmDelete}>
                <FaTrash /> Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterControls}>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Stock Levels</option>
            <option value="in">In Stock (10+)</option>
            <option value="low">Low Stock (1-10)</option>
            <option value="out">Out of Stock</option>
          </select>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortConfig.key}
            onChange={(e) => handleSort(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
            <option value="category">Sort by Category</option>
            <option value="created_at">Sort by Date Added</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStockFilter('all');
              setSelectedCategoryId('all');
              setSortConfig({ key: 'name', direction: 'asc' });
            }}
            style={styles.clearButton}
          >
            <FaFilter /> Clear Filters
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort('name')}>
                Product {getSortIcon('name')}
              </th>
              <th style={styles.th} onClick={() => handleSort('category')}>
                Category {getSortIcon('category')}
              </th>
              <th style={styles.th} onClick={() => handleSort('stock')}>
                Stock {getSortIcon('stock')}
              </th>
              <th style={styles.th} onClick={() => handleSort('price')}>
                Price {getSortIcon('price')}
              </th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyCell}>
                  {inventory.length === 0 ? (
                    <div>
                      <p>No products in inventory yet</p>
                      <button 
                        style={styles.addButton}
                        onClick={() => setShowAddForm(true)}
                      >
                        <FaPlus /> Add Your First Product
                      </button>
                    </div>
                  ) : (
                    <p>No products match your filters</p>
                  )}
                </td>
              </tr>
            ) : (
              filteredInventory.map(item => {
                const stockInfo = getStockStatus(item.stock);
                return (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            style={styles.productImage} 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={!item.image_url || item.image_url === '' ? styles.productImagePlaceholder : { display: 'none' }}>
                          <FaBox size={20} color="#6b7280" />
                        </div>
                        <div>
                          <div style={styles.productName}>{item.name}</div>
                          {item.description && (
                            <div style={styles.productDescription}>{item.description}</div>
                          )}
                          <div style={styles.productId}>ID: {item.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.categoryBadge,
                        background: `linear-gradient(135deg, ${getCategoryColor(item.categories?.name || '')})`
                      }}>
                        <FaTag size={10} style={{ marginRight: '6px' }} />
                        {item.categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {editingStock === item.id ? (
                        <div style={styles.stockEditContainer}>
                          <div style={styles.stockEditHeader}>
                            <span style={styles.stockEditLabel}>Update Stock</span>
                            <button
                              style={styles.closeEditButton}
                              onClick={cancelStockEdit}
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                          <div style={styles.stockEditControls}>
                            <input
                              type="number"
                              value={stockInput}
                              onChange={(e) => setStockInput(e.target.value)}
                              style={styles.stockInput}
                              min="0"
                              autoFocus
                            />
                            <div style={styles.stockEditButtons}>
                              <button
                                style={styles.quickAddButton}
                                onClick={() => setStockInput((parseInt(stockInput) || 0 + 10).toString())}
                              >
                                +10
                              </button>
                              <button
                                style={styles.saveEditButton}
                                onClick={() => saveStockEdit(item.id)}
                              >
                                <FaCheck /> Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.stockDisplay}>
                          <div style={styles.stockValueContainer}>
                            <div style={{
                              ...styles.stockIndicator,
                              background: stockInfo.badgeColor
                            }}></div>
                            <span style={styles.stockValue}>
                              {item.stock || 0}
                            </span>
                          </div>
                          <div style={styles.stockActions}>
                            <button
                              style={styles.quickActionButton}
                              onClick={() => adjustStock(item.id, 1)}
                              title="Add 1 unit"
                            >
                              <FaPlusCircle />
                            </button>
                            <button
                              style={styles.editStockTrigger}
                              onClick={() => handleStockEdit(item.id, item.stock || 0)}
                              title="Edit stock quantity"
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.priceContainer}>
                        <div style={styles.priceValue}>₱{item.price?.toLocaleString() || 0}</div>
                        <div style={styles.pricePerUnit}>
                          per unit
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        color: stockInfo.color,
                        background: stockInfo.bgColor,
                        borderLeft: `3px solid ${stockInfo.badgeColor}`
                      }}>
                        <div style={styles.statusIcon}>{stockInfo.icon}</div>
                        <div style={styles.statusText}>{stockInfo.status}</div>
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionMenu}>
                        <button
                          style={styles.actionMenuButton}
                          onClick={() => setActionMenuOpen(actionMenuOpen === item.id ? null : item.id)}
                        >
                          <FaEllipsisV />
                        </button>
                        
                        {actionMenuOpen === item.id && (
                          <div style={styles.actionDropdown}>
                            <div style={styles.actionDropdownHeader}>
                              <span style={styles.actionDropdownTitle}>Actions</span>
                              <button
                                style={styles.closeDropdownButton}
                                onClick={() => setActionMenuOpen(null)}
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                            <button
                              style={styles.actionDropdownItem}
                              onClick={() => {
                                handleEditProduct(item);
                                setActionMenuOpen(null);
                              }}
                            >
                              <FaEdit style={{ marginRight: '8px' }} /> Edit Product
                            </button>
                            <button
                              style={styles.actionDropdownItem}
                              onClick={() => {
                                handleDeleteClick(item);
                                setActionMenuOpen(null);
                              }}
                            >
                              <FaTrash style={{ marginRight: '8px' }} /> Delete Product
                            </button>
                            <button
                              style={styles.actionDropdownItem}
                              onClick={() => {
                                adjustStock(item.id, 5);
                                setActionMenuOpen(null);
                              }}
                            >
                              <FaPlusCircle style={{ marginRight: '8px' }} /> Add 5 Units
                            </button>
                            <button
                              style={styles.actionDropdownItem}
                              onClick={() => {
                                handleStockEdit(item.id, item.stock || 0);
                                setActionMenuOpen(null);
                              }}
                            >
                              <FaClipboardList style={{ marginRight: '8px' }} /> Update Stock
                            </button>
                          </div>
                        )}
                        
                        <div style={styles.quickActions}>
                          <button
                            style={styles.primaryActionButton}
                            onClick={() => handleEditProduct(item)}
                            title="Edit product"
                          >
                            <FaEdit />
                          </button>
                          <button
                            style={styles.secondaryActionButton}
                            onClick={() => adjustStock(item.id, 1)}
                            title="Add stock"
                          >
                            <FaPlusCircle />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Helper function for category colors
const getCategoryColor = (categoryName) => {
  const colors = {
    'Pool Equipment': '#667eea, #764ba2',
    'Cleaning Supplies': '#f093fb, #f5576c',
    'Tools': '#f6d365, #fda085',
    'Accessories': '#4facfe, #00f2fe',
    'Parts': '#43e97b, #38f9d7',
    'Default': '#a78bfa, #7c3aed'
  };
  
  return colors[categoryName] || colors['Default'];
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
    flexWrap: 'wrap',
    gap: '20px',
  },
  title: {
    fontSize: '32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  addButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 6px rgba(102, 126, 234, 0.2)',
  },
  exportButton: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 6px rgba(79, 172, 254, 0.2)',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #f3f4f6',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  Label: {
fontSize: '14px',
color: '#6b7280',
marginBottom: '4px',
},
statNumber: {
fontSize: '24px',
fontWeight: '700',
color: '#1f2937',
},
filters: {
background: 'white',
padding: '20px',
borderRadius: '12px',
marginBottom: '24px',
border: '1px solid #e5e7eb',
boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
},
searchBox: {
position: 'relative',
marginBottom: '16px',
},
searchInput: {
width: '100%',
padding: '12px 12px 12px 40px',
border: '1px solid #d1d5db',
borderRadius: '8px',
fontSize: '14px',
transition: 'border-color 0.2s',
},
filterControls: {
display: 'flex',
gap: '12px',
flexWrap: 'wrap',
},
filterSelect: {
padding: '10px 36px 10px 12px',
border: '1px solid #d1d5db',
borderRadius: '8px',
fontSize: '14px',
background: 'white',
cursor: 'pointer',
appearance: 'none',
backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg\" viewBox="0 0 24 24" fill="%236b7280"%3E%3Cpath d="M7 10l5 5 5-5z"/%3E%3C/svg%3E")',
backgroundRepeat: 'no-repeat',
backgroundPosition: 'right 12px center',
backgroundSize: '16px',
},
clearButton: {
padding: '10px 16px',
background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
border: 'none',
borderRadius: '8px',
fontSize: '14px',
fontWeight: '500',
color: '#374151',
cursor: 'pointer',
display: 'flex',
alignItems: 'center',
gap: '6px',
transition: 'all 0.2s',
},
formContainer: {
background: 'white',
border: '1px solid #e5e7eb',
borderRadius: '12px',
padding: '24px',
marginBottom: '30px',
boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
animation: 'fadeIn 0.3s ease-out',
},
formHeader: {
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: '24px',
paddingBottom: '16px',
borderBottom: '1px solid #e5e7eb',
},
closeButton: {
background: 'none',
border: 'none',
color: '#6b7280',
cursor: 'pointer',
fontSize: '18px',
padding: '8px',
borderRadius: '50%',
transition: 'background-color 0.2s',
},
form: {
display: 'flex',
flexDirection: 'column',
gap: '20px',
},
formGrid: {
display: 'grid',
gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
gap: '20px',
marginBottom: '20px',
},
formGroup: {
display: 'flex',
flexDirection: 'column',
gap: '8px',
},
formGroupFull: {
gridColumn: '1 / -1',
display: 'flex',
flexDirection: 'column',
gap: '8px',
},
label: {
fontSize: '14px',
fontWeight: '500',
color: '#374151',
},
input: {
padding: '10px 12px',
border: '1px solid #d1d5db',
borderRadius: '8px',
fontSize: '14px',
transition: 'border-color 0.2s',
},
textarea: {
padding: '12px',
border: '1px solid #d1d5db',
borderRadius: '8px',
fontSize: '14px',
resize: 'vertical',
minHeight: '80px',
transition: 'border-color 0.2s',
},
imagePreview: {
marginTop: '12px',
border: '1px solid #e5e7eb',
borderRadius: '8px',
overflow: 'hidden',
position: 'relative',
minHeight: '120px',
},
previewImage: {
width: '100%',
height: '120px',
objectFit: 'cover',
},
imagePlaceholder: {
position: 'absolute',
top: 0,
left: 0,
right: 0,
bottom: 0,
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
justifyContent: 'center',
background: '#f9fafb',
color: '#6b7280',
gap: '8px',
},
formActions: {
display: 'flex',
justifyContent: 'flex-end',
gap: '12px',
paddingTop: '20px',
borderTop: '1px solid #e5e7eb',
},
cancelButton: {
padding: '10px 20px',
background: '#f3f4f6',
border: '1px solid #d1d5db',
borderRadius: '8px',
fontSize: '14px',
fontWeight: '500',
color: '#374151',
cursor: 'pointer',
display: 'flex',
alignItems: 'center',
gap: '6px',
transition: 'all 0.2s',
},
submitButton: {
padding: '10px 24px',
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
color: 'white',
border: 'none',
borderRadius: '8px',
fontSize: '14px',
fontWeight: '600',
cursor: 'pointer',
display: 'flex',
alignItems: 'center',
gap: '6px',
transition: 'transform 0.2s, box-shadow 0.2s',
boxShadow: '0 4px 6px rgba(102, 126, 234, 0.2)',
},
modalOverlay: {
position: 'fixed',
top: 0,
left: 0,
right: 0,
bottom: 0,
background: 'rgba(0, 0, 0, 0.5)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
zIndex: 1000,
animation: 'fadeIn 0.2s ease-out',
},
confirmModal: {
background: 'white',
borderRadius: '12px',
padding: '24px',
maxWidth: '500px',
width: '90%',
boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
animation: 'slideIn 0.3s ease-out',
},
modalHeader: {
display: 'flex',
alignItems: 'center',
gap: '12px',
marginBottom: '16px',
},
modalTitle: {
fontSize: '20px',
fontWeight: '600',
color: '#1f2937',
margin: 0,
},
confirmMessage: {
color: '#6b7280',
marginBottom: '20px',
lineHeight: '1.5',
},
productInfo: {
background: '#f9fafb',
padding: '16px',
borderRadius: '8px',
marginBottom: '24px',
},
productInfoRow: {
display: 'flex',
justifyContent: 'space-between',
padding: '6px 0',
fontSize: '14px',
},
productInfoLabel: {
color: '#6b7280',
},
productInfoValue: {
color: '#1f2937',
fontWeight: '500',
},
modalActions: {
display: 'flex',
justifyContent: 'flex-end',
gap: '12px',
},
modalCancelButton: {
padding: '10px 20px',
background: '#f3f4f6',
border: '1px solid #d1d5db',
borderRadius: '8px',
fontSize: '14px',
fontWeight: '500',
color: '#374151',
cursor: 'pointer',
display: 'flex',
alignItems: 'center',
gap: '6px',
transition: 'all 0.2s',
},
modalDeleteButton: {
padding: '10px 20px',
background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
color: 'white',
border: 'none',
borderRadius: '8px',
fontSize: '14px',
fontWeight: '600',
cursor: 'pointer',
display: 'flex',
alignItems: 'center',
gap: '6px',
transition: 'transform 0.2s, box-shadow 0.2s',
boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
},
tableContainer: {
overflowX: 'auto',
background: 'white',
borderRadius: '12px',
border: '1px solid #e5e7eb',
boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
},
table: {
width: '100%',
borderCollapse: 'collapse',
},
th: {
padding: '16px 20px',
textAlign: 'left',
background: '#f9fafb',
color: '#374151',
fontWeight: '600',
fontSize: '14px',
borderBottom: '1px solid #e5e7eb',
cursor: 'pointer',
userSelect: 'none',
transition: 'background-color 0.2s',
},
tr: {
borderBottom: '1px solid #f3f4f6',
transition: 'background-color 0.2s',
},
td: {
padding: '16px 20px',
verticalAlign: 'middle',
},
emptyCell: {
textAlign: 'center',
padding: '60px 20px',
color: '#6b7280',
},
productCell: {
display: 'flex',
alignItems: 'center',
gap: '12px',
},
productImage: {
width: '48px',
height: '48px',
borderRadius: '8px',
objectFit: 'cover',
border: '1px solid #e5e7eb',
},
productImagePlaceholder: {
width: '48px',
height: '48px',
borderRadius: '8px',
background: '#f3f4f6',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
border: '1px solid #e5e7eb',
},
productName: {
fontSize: '14px',
fontWeight: '600',
color: '#1f2937',
marginBottom: '4px',
},
productDescription: {
fontSize: '12px',
color: '#6b7280',
lineHeight: '1.4',
maxWidth: '300px',
overflow: 'hidden',
textOverflow: 'ellipsis',
display: '-webkit-box',
WebkitLineClamp: 2,
WebkitBoxOrient: 'vertical',
},
productId: {
fontSize: '11px',
color: '#9ca3af',
marginTop: '2px',
},
categoryBadge: {
display: 'inline-flex',
alignItems: 'center',
padding: '6px 12px',
borderRadius: '20px',
fontSize: '12px',
fontWeight: '500',
color: 'white',
textShadow: '0 1px 1px rgba(0,0,0,0.1)',
boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
},
stockDisplay: {
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
},
stockValueContainer: {
display: 'flex',
alignItems: 'center',
gap: '8px',
},
stockIndicator: {
width: '8px',
height: '8px',
borderRadius: '50%',
},
stockValue: {
fontSize: '16px',
fontWeight: '600',
color: '#1f2937',
},
stockActions: {
display: 'flex',
gap: '4px',
},
quickActionButton: {
background: 'transparent',
border: 'none',
color: '#10b981',
cursor: 'pointer',
fontSize: '16px',
padding: '4px',
borderRadius: '4px',
transition: 'background-color 0.2s',
},
editStockTrigger: {
background: 'transparent',
border: 'none',
color: '#6b7280',
cursor: 'pointer',
fontSize: '14px',
padding: '4px',
borderRadius: '4px',
transition: 'background-color 0.2s',
},
stockEditContainer: {
background: '#f9fafb',
border: '1px solid #e5e7eb',
borderRadius: '8px',
padding: '12px',
animation: 'slideIn 0.2s ease-out',
},
stockEditHeader: {
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: '8px',
},
stockEditLabel: {
fontSize: '12px',
fontWeight: '500',
color: '#6b7280',
},
closeEditButton: {
background: 'none',
border: 'none',
color: '#9ca3af',
cursor: 'pointer',
padding: '2px',
borderRadius: '50%',
},
stockEditControls: {
display: 'flex',
flexDirection: 'column',
gap: '8px',
},
stockInput: {
padding: '8px 12px',
border: '1px solid #d1d5db',
borderRadius: '6px',
fontSize: '14px',
width: '100%',
},
stockEditButtons: {
display: 'flex',
gap: '8px',
},
quickAddButton: {
flex: 1,
padding: '6px 12px',
background: '#f3f4f6',
border: '1px solid #d1d5db',
borderRadius: '6px',
fontSize: '12px',
fontWeight: '500',
color: '#374151',
cursor: 'pointer',
transition: 'all 0.2s',
},
saveEditButton: {
flex: 1,
padding: '6px 12px',
background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
color: 'white',
border: 'none',
borderRadius: '6px',
fontSize: '12px',
fontWeight: '500',
cursor: 'pointer',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
gap: '4px',
transition: 'transform 0.2s, box-shadow 0.2s',
},
priceContainer: {
display: 'flex',
flexDirection: 'column',
gap: '4px',
},
priceValue: {
fontSize: '16px',
fontWeight: '600',
color: '#1f2937',
},
pricePerUnit: {
fontSize: '12px',
color: '#6b7280',
},
statusBadge: {
display: 'inline-flex',
alignItems: 'center',
padding: '8px 12px',
borderRadius: '8px',
fontSize: '12px',
fontWeight: '500',
gap: '6px',
boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
},
statusIcon: {
fontSize: '12px',
},
statusText: {
fontSize: '12px',
fontWeight: '600',
},
actionMenu: {
position: 'relative',
display: 'flex',
alignItems: 'center',
gap: '8px',
},
actionMenuButton: {
background: 'transparent',
border: 'none',
color: '#6b7280',
cursor: 'pointer',
fontSize: '16px',
padding: '8px',
borderRadius: '6px',
transition: 'background-color 0.2s',
},
actionDropdown: {
position: 'absolute',
top: '100%',
right: 0,
background: 'white',
border: '1px solid #e5e7eb',
borderRadius: '8px',
boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
minWidth: '200px',
zIndex: 10,
animation: 'fadeIn 0.2s ease-out',
},
actionDropdownHeader: {
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
padding: '12px 16px',
borderBottom: '1px solid #e5e7eb',
},
actionDropdownTitle: {
fontSize: '12px',
fontWeight: '600',
color: '#374151',
textTransform: 'uppercase',
letterSpacing: '0.5px',
},
closeDropdownButton: {
background: 'none',
border: 'none',
color: '#9ca3af',
cursor: 'pointer',
padding: '2px',
borderRadius: '50%',
},
actionDropdownItem: {
display: 'flex',
alignItems: 'center',
width: '100%',
padding: '12px 16px',
background: 'none',
border: 'none',
color: '#374151',
fontSize: '14px',
cursor: 'pointer',
transition: 'background-color 0.2s',
borderBottom: '1px solid #f3f4f6',
},
quickActions: {
display: 'flex',
gap: '4px',
},
primaryActionButton: {
background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
color: 'white',
border: 'none',
cursor: 'pointer',
fontSize: '14px',
padding: '8px',
borderRadius: '6px',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
transition: 'transform 0.2s, box-shadow 0.2s',
},
secondaryActionButton: {
background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
color: 'white',
border: 'none',
cursor: 'pointer',
fontSize: '14px',
padding: '8px',
borderRadius: '6px',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
transition: 'transform 0.2s, box-shadow 0.2s',
},
};

export default InventoryManagement;