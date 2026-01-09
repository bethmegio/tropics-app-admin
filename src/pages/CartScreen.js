// CartScreen.js - Customer shopping cart component
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCart,
  IoCartOutline,
  IoRemove,
  IoAdd,
  IoTrashOutline,
  IoLogInOutline,
  IoLeafOutline,
  IoArrowBackOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoCallOutline,
  IoInformationCircleOutline,
  IoInformationCircle,
  IoWalletOutline,
  IoCashOutline,
  IoCheckmarkCircle,
  IoEllipseOutline
} from 'react-icons/io5';
import { supabase } from '../supabase';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';
import PaymentSection from '../components/PaymentSection';
import StoreInfo from '../components/StoreInfo';
import CustomerInfo from '../components/CustomerInfo';

// ====================
// MAIN COMPONENT
// ====================
export default function CartScreen() {
  // ====================
  // STATE MANAGEMENT
  // ====================
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gcash');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [review, setReview] = useState('');
  const navigate = useNavigate();

  // ====================
  // EFFECTS
  // ====================
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user) {
          window.alert('Login Required: Please login to view your cart');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };

    checkUser();
    loadCartItems();
  }, [navigate]);

  // ====================
  // API FUNCTIONS
  // ====================
  const loadCartItems = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url,
            category_id,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      const transformedCartItems = data.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products?.name || 'Unknown Product',
        price: item.products?.price || 0,
        quantity: item.quantity,
        image_url: item.products?.image_url || 'https://images.unsplash.com/photo-1566014633661-349c6fae61e9?w=400',
        category: item.products?.category_id || 'General',
        description: item.products?.description || '',
        added_at: item.added_at
      }));

      setCartItems(transformedCartItems || []);

    } catch (error) {
      console.error('Error loading cart:', error);
      window.alert('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      window.alert('Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId) => {
    const confirmed = window.confirm('Are you sure you want to remove this item from your cart?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      window.alert('Error: Failed to remove item from cart');
    }
  };

  // ====================
  // UTILITY FUNCTIONS
  // ====================
  const continueShopping = () => {
    navigate('/dashboard');
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  // ====================
  // RENDER FUNCTIONS
  // ====================

  // ====================
  // RENDER
  // ====================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading...</div>
        <span style={styles.loadingText}>Loading Your Cart...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>Shopping Cart</span>
          <span style={styles.headerSubtitle}>Please login to view your cart</span>
        </div>
        <div style={styles.emptyCart}>
          <IoLogInOutline size={100} color="#ccc" />
          <span style={styles.emptyCartTitle}>Login Required</span>
          <span style={styles.emptyCartText}>
            Please login to view and manage your shopping cart
          </span>
          <button
            style={styles.shopButton}
            onClick={() => navigate('/')}
          >
            <IoLogInOutline size={20} color="#fff" />
            <span style={styles.shopButtonText}>Login Now</span>
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <span style={styles.headerTitle}>Shopping Cart</span>
            <span style={styles.headerSubtitle}>Your cart is empty</span>
          </div>
        </div>

        <div style={styles.emptyCart}>
          <IoCartOutline size={100} color="#ccc" />
          <span style={styles.emptyCartTitle}>Your Cart is Empty</span>
          <span style={styles.emptyCartText}>
            Add some amazing plants and accessories to your cart!
          </span>
          <button
            style={styles.shopButton}
            onClick={continueShopping}
          >
            <IoLeafOutline size={20} color="#fff" />
            <span style={styles.shopButtonText}>Continue Shopping</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerTitle}>Shopping Cart</span>
          <span style={styles.headerSubtitle}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</span>
        </div>
        {cartItems.length > 0 && (
          <button
            style={styles.clearButton}
            onClick={async () => {
              if (window.confirm('Are you sure you want to remove all items from your cart?')) {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const { error } = await supabase
                      .from('cart_items')
                      .delete()
                      .eq('user_id', user.id);

                    if (error) throw error;
                    setCartItems([]);
                  }
                } catch (error) {
                  console.error('Error clearing cart:', error);
                  window.alert('Failed to clear cart');
                }
              }
            }}
          >
            <IoTrashOutline size={16} color="#fff" />
            <span style={styles.clearButtonText}>Clear All</span>
          </button>
        )}
      </div>

      <div
        style={{...styles.scrollView, overflowY: 'auto'}}
      >
        {/* Cart Items List */}
        <div style={styles.cartList}>
          {cartItems.map(item => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </div>

        {/* Order Summary */}
        <OrderSummary
          cartItems={cartItems}
          calculateSubtotal={calculateSubtotal}
          calculateTotal={calculateTotal}
        />

        {/* Store Info */}
        <StoreInfo />

        {/* Customer Info */}
        <CustomerInfo
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerAddress={customerAddress}
          setCustomerAddress={setCustomerAddress}
          review={review}
          setReview={setReview}
        />

        {/* Payment Method Section */}
        <PaymentSection
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          calculateTotal={calculateTotal}
        />

        {/* Checkout Button */}
        <button
          style={styles.checkoutButton}
          onClick={async () => {
            // Validate customer info
            if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
              window.alert('Please fill in all customer information fields.');
              return;
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerEmail)) {
              window.alert('Please enter a valid email address.');
              return;
            }

            const total = calculateTotal();
            const items = cartItems.map(item => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image_url: item.image_url,
              description: item.description,
            }));

            try {
              const { data, error } = await supabase
                .from('orders')
                .insert({
                  customer_name: customerName,
                  customer_email: customerEmail,
                  customer_phone: customerPhone,
                  customer_address: customerAddress,
                  total: total,
                  status: 'pending',
                  items: items,
                  payment_method: selectedPaymentMethod,
                  review: review || null,
                })
                .select()
                .single();

              if (error) throw error;

              // Clear cart
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase
                  .from('cart_items')
                  .delete()
                  .eq('user_id', user.id);
              }

              setCartItems([]);
              setCustomerName('');
              setCustomerEmail('');
              setCustomerPhone('');
              setCustomerAddress('');
              setReview('');

              if (selectedPaymentMethod === 'gcash') {
                window.alert(`Order #${data.id} placed successfully!\n\nPlease send ₱${Number(total).toLocaleString()} to our GCash: 0915 736 2648\n\nAfter payment, show your GCash receipt at pickup.`);
              } else {
                window.alert(`Order #${data.id} placed successfully!\n\nYour total is ₱${Number(total).toLocaleString()}. Pay at pickup.`);
              }
            } catch (error) {
              console.error('Error placing order:', error);
              window.alert('Failed to place order. Please try again.');
            }
          }}
        >
          <div style={[styles.checkoutGradient, { backgroundColor: '#00BFFF' }]}>
            <IoCart size={24} color="#fff" />
            <span style={styles.checkoutButtonText}>Proceed to Checkout</span>
            <span style={styles.checkoutPrice}>₱{Number(calculateTotal()).toLocaleString()}</span>
          </div>
        </button>

        {/* Continue Shopping Button */}
        <button
          style={styles.continueButton}
          onClick={continueShopping}
        >
          <IoArrowBackOutline size={20} color="#00BFFF" />
          <span style={styles.continueButtonText}>Continue Shopping</span>
        </button>
      </div>
    </div>
  );
}

// ====================
// STYLES
// ====================
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F8FBFF',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#00BFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '8px 12px',
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyCartText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cartList: {
    padding: 20,
  },
  checkoutButton: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  checkoutPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  continueButtonText: {
    color: '#00BFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
};

;