import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  FaBox, 
  FaTools, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave,
  FaTimes,
  FaShoppingCart,
  FaWrench,
  FaCar,
  FaOilCan,
  FaShieldAlt,
  FaTag,
  FaSync,
  FaImage,
  FaUpload,
  FaCamera,
  FaLink
} from 'react-icons/fa';

const ProductManagement = () => {
  // Products state
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  
  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: '',
    category: 'accessories'
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: 60,
    category: 'maintenance',
    image_url: '',
    active: true
  });

  // Add these to your state declarations
  const [uploadingService, setUploadingService] = useState(false);
  const [uploadProgressService, setUploadProgressService] = useState(0);
  const [imagePreviewService, setImagePreviewService] = useState(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'product' or 'service'
  
  // Stock editing
  const lowStockThreshold = 10;
  const [editingStock, setEditingStock] = useState(null);
  const [stockInput, setStockInput] = useState('');

  const productCategories = [
    'accessories',
    'parts',
    'lubricants',
    'tires',
    'tools',
    'electronics'
  ];

  const serviceCategories = [
    'maintenance',
    'repair',
    'car_wash',
    'tires',
    'inspection',
    'detailing',
    'other'
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);
      
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== IMAGE UPLOAD FUNCTIONS ==========
  const uploadImage = async (file, type = 'product') => {
    try {
      if (type === 'product') {
        setUploading(true);
        setUploadProgress(0);
      } else {
        setUploadingService(true);
        setUploadProgressService(0);
      }
      
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = type === 'product' ? `product-images/${fileName}` : `service-images/${fileName}`;
      const bucket = type === 'product' ? 'products' : 'services';
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      // Update form data with image URL
      if (type === 'product') {
        setProductFormData(prev => ({
          ...prev,
          image_url: publicUrl
        }));
        setUploadProgress(100);
      } else {
        setServiceFormData(prev => ({
          ...prev,
          image_url: publicUrl
        }));
        setUploadProgressService(100);
      }
      
      return publicUrl;
      
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      alert(`Error uploading image: ${error.message}`);
      return null;
    } finally {
      if (type === 'product') {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        setUploadingService(false);
        setTimeout(() => setUploadProgressService(0), 1000);
      }
    }
  };

  const handleImageUpload = async (e, type = 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'product') {
        setImagePreview(e.target.result);
      } else {
        setImagePreviewService(e.target.result);
      }
    };
    reader.readAsDataURL(file);
    
    // Upload to storage
    const imageUrl = await uploadImage(file, type);
    if (imageUrl) {
      if (type === 'product') {
        setImagePreview(imageUrl);
      } else {
        setImagePreviewService(imageUrl);
      }
    }
  };

  const handleImageUrlChange = (url, type = 'product') => {
    if (type === 'product') {
      setProductFormData(prev => ({ ...prev, image_url: url }));
      setImagePreview(url);
    } else {
      setServiceFormData(prev => ({ ...prev, image_url: url }));
      setImagePreviewService(url);
    }
  };

  const removeImage = (type = 'product') => {
    if (type === 'product') {
      setProductFormData(prev => ({ ...prev, image_url: '' }));
      setImagePreview(null);
    } else {
      setServiceFormData(prev => ({ ...prev, image_url: '' }));
      setImagePreviewService(null);
    }
  };

  // ========== PRODUCT FUNCTIONS ==========
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: productFormData.name,
        description: productFormData.description,
        price: parseFloat(productFormData.price) || 0,
        image_url: productFormData.image_url || '',
        stock: parseInt(productFormData.stock) || 0,
        category: productFormData.category || 'accessories'
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

      fetchAllData();
      resetProductForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
    }
  };

  const handleProductEdit = (product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image_url: product.image_url || '',
      stock: product.stock || '',
      category: product.category || 'accessories'
    });
    setImagePreview(product.image_url || null);
    setShowProductForm(true);
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      stock: '',
      category: 'accessories'
    });
    setEditingProduct(null);
    setShowProductForm(false);
    setImagePreview(null);
    setUploading(false);
    setUploadProgress(0);
  };

  // ========== SERVICE FUNCTIONS ==========
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        name: serviceFormData.name,
        description: serviceFormData.description,
        price: parseFloat(serviceFormData.price) || 0,
        duration: parseInt(serviceFormData.duration) || 60,
        category: serviceFormData.category || 'maintenance',
        image_url: serviceFormData.image_url || '',
        active: serviceFormData.active
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
      }

      fetchAllData();
      resetServiceForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service: ' + error.message);
    }
  };

  const handleServiceEdit = (service) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || 60,
      category: service.category || 'maintenance',
      image_url: service.image_url || '',
      active: service.active !== undefined ? service.active : true
    });
    setImagePreviewService(service.image_url || null);
    setShowServiceForm(true);
  };

  const resetServiceForm = () => {
    setServiceFormData({
      name: '',
      description: '',
      price: '',
      duration: 60,
      category: 'maintenance',
      image_url: '',
      active: true
    });
    setEditingService(null);
    setShowServiceForm(false);
    setImagePreviewService(null);
    setUploadingService(false);
    setUploadProgressService(0);
  };

  // ========== DELETE FUNCTIONS ==========
  const handleDelete = (item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    try {
      if (deleteType === 'product') {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', itemToDelete.id);
        if (error) throw error;
      } else if (deleteType === 'service') {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', itemToDelete.id);
        if (error) throw error;
      }

      fetchAllData();
      cancelDelete();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setDeleteType('');
  };

  // ========== STOCK FUNCTIONS ==========
  const getStockStatus = (quantity) => {
    if (quantity === 0 || quantity === null || quantity === undefined) return { status: 'Out of Stock', color: '#ef4444' };
    if (quantity <= lowStockThreshold) return { status: 'Low Stock', color: '#f59e0b' };
    return { status: 'In Stock', color: '#10b981' };
  };

  const adjustStock = async (productId, adjustment) => {
    try {
      if (adjustment > 0) {
        const { error } = await supabase.rpc('add_stock', { 
          product_id_param: productId, 
          quantity_param: adjustment 
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('reduce_stock', { 
          product_id_param: productId, 
          quantity_param: Math.abs(adjustment) 
        });
        if (error) throw error;
      }
      fetchAllData();
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
      fetchAllData();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock: ' + error.message);
    }
  };

  const cancelStockEdit = () => {
    setEditingStock(null);
    setStockInput('');
  };

  const toggleServiceStatus = async (service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ active: !service.active })
        .eq('id', service.id);

      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error('Error toggling service status:', error);
      alert('Error updating service: ' + error.message);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getCategoryIcon = (category) => {
    const cat = category || 'other';
    
    switch (cat) {
      case 'maintenance':
      case 'lubricants':
        return <FaOilCan />;
      case 'repair':
      case 'tools':
        return <FaTools />;
      case 'car_wash':
      case 'detailing':
        return <FaCar />;
      case 'tires':
        return <FaWrench />;
      case 'inspection':
        return <FaShieldAlt />;
      case 'parts':
      case 'accessories':
        return <FaShoppingCart />;
      default:
        return <FaTag />;
    }
  };

  const getCategoryColor = (category) => {
    const cat = category || 'other';
    
    const colors = {
      maintenance: '#3b82f6',
      repair: '#ef4444',
      car_wash: '#8b5cf6',
      tires: '#10b981',
      inspection: '#f59e0b',
      detailing: '#ec4899',
      other: '#6b7280',
      accessories: '#8b5cf6',
      parts: '#ef4444',
      lubricants: '#3b82f6',
      tools: '#f59e0b',
      electronics: '#ec4899'
    };
    return colors[cat] || '#6b7280';
  };

  const getCategoryName = (category) => {
    if (!category) return 'Uncategorized';
    
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDefaultServiceImage = () => {
    return 'https://placehold.co/600x400/10b981/ffffff?text=Service';
  };

  const getDefaultImage = () => {
    return 'https://placehold.co/600x400/3b82f6/ffffff?text=No+Image';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading products & services...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Products & Services</h1>
            <p style={styles.subtitle}>Manage your products catalog and services</p>
          </div>
          <div style={styles.headerActions}>
            <button
              style={styles.refreshButton}
              onClick={fetchAllData}
            >
              <FaSync /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tabButton,
            background: activeTab === 'products' ? '#0077b6' : 'transparent',
            color: activeTab === 'products' ? 'white' : '#0077b6'
          }}
          onClick={() => setActiveTab('products')}
        >
          <FaBox style={styles.tabIcon} />
          Products ({products.length})
        </button>
        <button
          style={{
            ...styles.tabButton,
            background: activeTab === 'services' ? '#0077b6' : 'transparent',
            color: activeTab === 'services' ? 'white' : '#0077b6'
          }}
          onClick={() => setActiveTab('services')}
        >
          <FaTools style={styles.tabIcon} />
          Services ({services.length})
        </button>
      </div>

      {/* Add Button */}
      <div style={styles.addSection}>
        <button
          style={styles.addButton}
          onClick={() => activeTab === 'products' ? setShowProductForm(true) : setShowServiceForm(true)}
        >
          <FaPlus /> Add {activeTab === 'products' ? 'Product' : 'Service'}
        </button>
      </div>

      {/* Product Form Modal with Image Upload */}
      {showProductForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.formModal}>
            <div style={styles.formHeader}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button style={styles.closeButton} onClick={resetProductForm}>×</button>
            </div>
            <form onSubmit={handleProductSubmit} style={styles.form}>
              
              {/* Image Upload Section */}
              <div style={styles.imageSection}>
                <h3 style={styles.sectionTitle}>Product Image</h3>
                
                {/* Image Preview */}
                <div style={styles.imagePreviewContainer}>
                  <img
                    src={imagePreview || getDefaultImage()}
                    alt="Product preview"
                    style={styles.imagePreview}
                    onError={(e) => {
                      e.target.src = getDefaultImage();
                    }}
                  />
                  
                  {imagePreview && (
                    <button
                      type="button"
                      style={styles.removeImageButton}
                      onClick={() => removeImage('product')}
                      title="Remove image"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                
                {/* Upload Progress */}
                {uploading && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div 
                        style={{
                          ...styles.progressFill,
                          width: `${uploadProgress}%`
                        }}
                      />
                    </div>
                    <span style={styles.progressText}>{uploadProgress}% Uploading...</span>
                  </div>
                )}
                
                {/* Upload Options */}
                <div style={styles.uploadOptions}>
                  {/* File Upload */}
                  <div style={styles.uploadOption}>
                    <label style={styles.uploadLabel} htmlFor="productImageUpload">
                      <FaUpload style={styles.uploadIcon} />
                      Upload Image
                    </label>
                    <input
                      id="productImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'product')}
                      style={styles.fileInput}
                    />
                    <p style={styles.uploadHint}>JPG, PNG, GIF, WebP (Max 5MB)</p>
                  </div>
                  
                  <span style={styles.orText}>OR</span>
                  
                  {/* URL Input */}
                  <div style={styles.uploadOption}>
                    <label style={styles.uploadLabel}>
                      <FaLink style={styles.uploadIcon} />
                      Enter Image URL
                    </label>
                    <input
                      type="url"
                      value={productFormData.image_url}
                      onChange={(e) => handleImageUrlChange(e.target.value, 'product')}
                      placeholder="https://example.com/image.jpg"
                      style={styles.urlInput}
                    />
                  </div>
                </div>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Name *</label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                    style={styles.input}
                  >
                    {productCategories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryName(category)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (₱)</label>
                  <input
                    type="number"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                    style={styles.input}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock</label>
                  <input
                    type="number"
                    value={productFormData.stock}
                    onChange={(e) => setProductFormData({...productFormData, stock: e.target.value})}
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelButton} onClick={resetProductForm}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.formModal}>
            <div style={styles.formHeader}>
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button style={styles.closeButton} onClick={resetServiceForm}>×</button>
            </div>
            <form onSubmit={handleServiceSubmit} style={styles.form}>
              
              {/* Image Upload Section */}
              <div style={styles.imageSection}>
                <h3 style={styles.sectionTitle}>Service Image</h3>
                
                {/* Image Preview */}
                <div style={styles.imagePreviewContainer}>
                  <img
                    src={imagePreviewService || getDefaultServiceImage()}
                    alt="Service preview"
                    style={styles.imagePreview}
                    onError={(e) => {
                      e.target.src = getDefaultServiceImage();
                    }}
                  />
                  
                  {imagePreviewService && (
                    <button
                      type="button"
                      style={styles.removeImageButton}
                      onClick={() => removeImage('service')}
                      title="Remove image"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                
                {/* Upload Progress */}
                {uploadingService && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div 
                        style={{
                          ...styles.progressFill,
                          width: `${uploadProgressService}%`
                        }}
                      />
                    </div>
                    <span style={styles.progressText}>{uploadProgressService}% Uploading...</span>
                  </div>
                )}
                
                {/* Upload Options */}
                <div style={styles.uploadOptions}>
                  {/* File Upload */}
                  <div style={styles.uploadOption}>
                    <label style={styles.uploadLabel} htmlFor="serviceImageUpload">
                      <FaUpload style={styles.uploadIcon} />
                      Upload Image
                    </label>
                    <input
                      id="serviceImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'service')}
                      style={styles.fileInput}
                    />
                    <p style={styles.uploadHint}>JPG, PNG, GIF, WebP (Max 5MB)</p>
                  </div>
                  
                  <span style={styles.orText}>OR</span>
                  
                  {/* URL Input */}
                  <div style={styles.uploadOption}>
                    <label style={styles.uploadLabel}>
                      <FaLink style={styles.uploadIcon} />
                      Enter Image URL
                    </label>
                    <input
                      type="url"
                      value={serviceFormData.image_url}
                      onChange={(e) => handleImageUrlChange(e.target.value, 'service')}
                      placeholder="https://example.com/service-image.jpg"
                      style={styles.urlInput}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Service Name *</label>
                  <input
                    type="text"
                    value={serviceFormData.name}
                    onChange={(e) => setServiceFormData({...serviceFormData, name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={serviceFormData.category}
                    onChange={(e) => setServiceFormData({...serviceFormData, category: e.target.value})}
                    style={styles.input}
                  >
                    {serviceCategories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryName(category)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (₱)</label>
                  <input
                    type="number"
                    value={serviceFormData.price}
                    onChange={(e) => setServiceFormData({...serviceFormData, price: e.target.value})}
                    style={styles.input}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration (minutes)</label>
                  <input
                    type="number"
                    value={serviceFormData.duration}
                    onChange={(e) => setServiceFormData({...serviceFormData, duration: e.target.value})}
                    style={styles.input}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={serviceFormData.active}
                    onChange={(e) => setServiceFormData({...serviceFormData, active: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  Active (Available for booking)
                </label>
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelButton} onClick={resetServiceForm}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.modalTitle}>Delete {deleteType === 'product' ? 'Product' : 'Service'}</h3>
            <p style={styles.confirmMessage}>
              Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={cancelDelete}>
                Cancel
              </button>
              <button style={styles.deleteConfirmButton} onClick={confirmDelete}>
                Delete {deleteType === 'product' ? 'Product' : 'Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products List with Images */}
      {activeTab === 'products' && (
        <div style={styles.itemsList}>
          {products.length === 0 ? (
            <div style={styles.emptyState}>
              <FaBox size={48} color="#d1d5db" />
              <p>No products found. Add your first product to get started.</p>
            </div>
          ) : (
            <div style={styles.gridContainer}>
              {products.map(product => (
                <div key={product.id} style={styles.productCard}>
                  {/* Product Image */}
                  <div style={styles.productImageContainer}>
                    <img
                      src={product.image_url || getDefaultImage()}
                      alt={product.name}
                      style={styles.productImage}
                      onError={(e) => {
                        e.target.src = getDefaultImage();
                      }}
                    />
                    <div style={styles.imageOverlay}>
                      <button
                        style={styles.imageOverlayButton}
                        onClick={() => handleProductEdit(product)}
                        title="Edit product"
                      >
                        <FaEdit size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={styles.productContent}>
                    <div style={styles.productHeader}>
                      <div style={styles.productCategory}>
                        <div style={{
                          ...styles.categoryIcon,
                          background: getCategoryColor(product.category || 'other')
                        }}>
                          {getCategoryIcon(product.category || 'other')}
                        </div>
                        <span style={styles.categoryText}>
                          {getCategoryName(product.category || 'other')}
                        </span>
                      </div>
                      <div style={styles.productBadges}>
                        {(() => {
                          const stockInfo = getStockStatus(product.stock);
                          return (
                            <span style={{
                              ...styles.badge,
                              background: stockInfo.color
                            }}>
                              {stockInfo.status}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <h3 style={styles.productName}>{product.name}</h3>
                    <p style={styles.productDescription}>
                      {product.description || 'No description provided.'}
                    </p>
                    
                    <div style={styles.productDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Price:</span>
                        <span style={styles.priceValue}>₱{product.price || 0}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Stock:</span>
                        <span style={styles.detailValue}>
                          {editingStock === product.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                value={stockInput}
                                onChange={(e) => setStockInput(e.target.value)}
                                style={styles.stockInput}
                                min="0"
                              />
                              <button 
                                onClick={() => saveStockEdit(product.id)} 
                                style={styles.smallButton}
                              >
                                <FaSave size={12} />
                              </button>
                              <button 
                                onClick={cancelStockEdit} 
                                style={{...styles.smallButton, background: '#6b7280'}}
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          ) : (
                            <span 
                              onClick={() => startEditingStock(product)} 
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {product.stock || 0}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div style={styles.productActions}>
                      <div style={styles.quickStockActions}>
                        <button
                          style={{...styles.actionButton, background: '#10b981', padding: '6px 12px'}}
                          onClick={() => adjustStock(product.id, 1)}
                          title="Add 1 stock"
                        >
                          +1 Stock
                        </button>
                        <button
                          style={{...styles.actionButton, background: '#f59e0b', padding: '6px 12px'}}
                          onClick={() => adjustStock(product.id, -1)}
                          title="Remove 1 stock"
                        >
                          -1 Stock
                        </button>
                      </div>
                      <div style={styles.mainActions}>
                        <button
                          style={{...styles.actionButton, background: '#3b82f6', padding: '8px'}}
                          onClick={() => handleProductEdit(product)}
                          title="Edit product"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          style={{...styles.actionButton, background: '#ef4444', padding: '8px'}}
                          onClick={() => handleDelete(product, 'product')}
                          title="Delete product"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Services List */}
      {activeTab === 'services' && (
        <div style={styles.itemsList}>
          {services.length === 0 ? (
            <div style={styles.emptyState}>
              <FaTools size={48} color="#d1d5db" />
              <p>No services found. Add your first service to get started.</p>
            </div>
          ) : (
            <div style={styles.gridContainer}>
              {services.map(service => (
                <div key={service.id} style={styles.itemCard}>
                  {/* Service Image */}
                  <div style={styles.productImageContainer}>
                    <img
                      src={service.image_url || getDefaultServiceImage()}
                      alt={service.name}
                      style={styles.productImage}
                      onError={(e) => {
                        e.target.src = getDefaultServiceImage();
                      }}
                    />
                  </div>
                  
                  <div style={styles.itemBody}>
                    <div style={styles.itemHeader}>
                      <div style={styles.itemCategory}>
                        <div style={{
                          ...styles.categoryIcon,
                          background: getCategoryColor(service.category || 'other')
                        }}>
                          {getCategoryIcon(service.category || 'other')}
                        </div>
                        <span style={styles.categoryText}>
                          {getCategoryName(service.category || 'other')}
                        </span>
                      </div>
                      <div style={styles.itemBadges}>
                        <span style={{
                          ...styles.badge,
                          background: service.active ? '#10b981' : '#6b7280'
                        }}>
                          {service.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <h3 style={styles.itemName}>{service.name}</h3>
                    <p style={styles.itemDescription}>
                      {service.description || 'No description provided.'}
                    </p>
                    
                    <div style={styles.itemDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Price:</span>
                        <span style={styles.priceValue}>₱{service.price || 0}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Duration:</span>
                        <span style={styles.detailValue}>{service.duration || 60} min</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.itemActions}>
                    <button
                      style={{
                        ...styles.actionButton,
                        background: service.active ? '#ef4444' : '#10b981',
                        flex: 1
                      }}
                      onClick={() => toggleServiceStatus(service)}
                    >
                      {service.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      style={{...styles.actionButton, background: '#3b82f6'}}
                      onClick={() => handleServiceEdit(service)}
                      title="Edit service"
                    >
                      <FaEdit />
                    </button>
                    <button
                      style={{...styles.actionButton, background: '#ef4444'}}
                      onClick={() => handleDelete(service, 'service')}
                      title="Delete service"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  refreshButton: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#e5e7eb'
    }
  },
  tabContainer: {
    display: 'flex',
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '8px',
    marginBottom: '24px',
  },
  tabButton: {
    flex: 1,
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  tabIcon: {
    fontSize: '16px',
  },
  addSection: {
    marginBottom: '24px',
  },
  addButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#005b8a'
    }
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
  // Image Upload Styles
  imageSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '200px',
    height: '150px',
    margin: '0 auto 16px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px dashed #d1d5db',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#dc2626'
    }
  },
  progressContainer: {
    margin: '12px 0',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    background: '#0077b6',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    display: 'block',
  },
  uploadOptions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  uploadOption: {
    flex: 1,
    minWidth: '200px',
  },
  uploadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  uploadIcon: {
    fontSize: '16px',
    color: '#0077b6',
  },
  fileInput: {
    display: 'none',
  },
  uploadHint: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  orText: {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
  },
  urlInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
    }
  },
  // Modal Styles
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
    backdropFilter: 'blur(4px)',
  },
  formModal: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  formHeader: {
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
    ':hover': {
      color: '#374151'
    }
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
  label: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500',
  },
  input: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
      boxShadow: '0 0 0 3px rgba(0, 119, 182, 0.1)'
    }
  },
  textarea: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '80px',
    transition: 'border 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#0077b6',
      boxShadow: '0 0 0 3px rgba(0, 119, 182, 0.1)'
    }
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#e5e7eb'
    }
  },
  submitButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#005b8a'
    }
  },
  confirmModal: {
    background: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#dc2626'
    }
  },
  itemsList: {
    minHeight: '400px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  // Product Card with Image
  productCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)'
    }
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: '180px',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'scale(1.05)'
    }
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.2)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      opacity: 1
    }
  },
  imageOverlayButton: {
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#374151',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    ':hover': {
      background: 'white',
      transform: 'scale(1.1)'
    }
  },
  productContent: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productCategory: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  categoryIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
  },
  categoryText: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  productBadges: {
    display: 'flex',
    gap: '6px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  productName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    lineHeight: '1.3',
  },
  productDescription: {
    margin: 0,
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
  },
  productDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  priceValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0077b6',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  stockInput: {
    width: '60px',
    padding: '4px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center',
  },
  smallButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  quickStockActions: {
    display: 'flex',
    gap: '4px',
    flex: 1,
  },
  mainActions: {
    display: 'flex',
    gap: '4px',
  },
  actionButton: {
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    ':hover': {
      opacity: 0.9
    }
  },
  // Service Card
  itemCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s',
    ':hover': {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)'
    }
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 16px 8px 16px',
  },
  itemBody: {
    flex: 1,
    padding: '0 16px',
  },
  itemName: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    lineHeight: '1.3',
  },
  itemDescription: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  itemActions: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  itemBadges: {
    display: 'flex',
    gap: '6px',
  },
  itemCategory: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

// Add CSS animation for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default ProductManagement;