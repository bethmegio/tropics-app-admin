// CartItem.js - Individual cart item component
import React from 'react';
import { IoRemove, IoAdd, IoTrashOutline } from 'react-icons/io5';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div style={styles.cartItem}>
      <img
        src={item.image_url}
        style={styles.itemImage}
        alt={item.name}
      />

      <div style={styles.itemDetails}>
        <p style={styles.itemName}>{item.name}</p>
        <p style={styles.itemCategory}>{item.category || 'General'}</p>
        <p style={styles.itemPrice}>₱{Number(item.price).toLocaleString()}</p>

        <div style={styles.quantityContainer}>
          <button
            style={styles.quantityButton}
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            <IoRemove size={16} color="#333" />
          </button>

          <span style={styles.quantityText}>{item.quantity}</span>

          <button
            style={styles.quantityButton}
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <IoAdd size={16} color="#333" />
          </button>
        </div>
      </div>

      <div style={styles.itemActions}>
        <p style={styles.itemTotal}>
          ₱{Number(item.price * item.quantity).toLocaleString()}
        </p>
        <button
          style={styles.removeButton}
          onClick={() => onRemove(item.id)}
        >
          <IoTrashOutline size={20} color="#FF6B6B" />
        </button>
      </div>
    </div>
  );
};

const styles = {
  cartItem: {
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00BFFF',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
};

export default CartItem;