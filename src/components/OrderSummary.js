// OrderSummary.js - Order summary component
import React from 'react';
import { IoInformationCircleOutline } from 'react-icons/io5';

const OrderSummary = ({ cartItems, calculateSubtotal, calculateTotal }) => {
  return (
    <div style={styles.summarySection}>
      <span style={styles.sectionTitle}>Order Summary</span>

      <div style={styles.summaryRow}>
        <span style={styles.summaryLabel}>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
        <span style={styles.summaryValue}>₱{Number(calculateSubtotal()).toLocaleString()}</span>
      </div>

      <div style={styles.summaryRow}>
        <span style={styles.summaryLabel}>Shipping</span>
        <span style={styles.summaryValue}>₱0.00</span>
      </div>

      <div style={styles.summaryRow}>
        <span style={styles.summaryLabel}>Tax</span>
        <span style={styles.summaryValue}>₱0.00</span>
      </div>

      <div style={{...styles.summaryRow, ...styles.totalRow}}>
        <span style={styles.totalLabel}>Total</span>
        <span style={styles.totalValue}>₱{Number(calculateTotal()).toLocaleString()}</span>
      </div>

      {/* Pickup Info */}
      <div style={styles.pickupInfo}>
        <IoInformationCircleOutline size={20} color="#0077b6" />
        <div style={styles.pickupTextContainer}>
          <span style={styles.pickupTitle}>Store Pickup Only</span>
          <span style={styles.pickupDescription}>
            All items are available for store pickup only. Please visit our store to collect your order.
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  summarySection: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00BFFF',
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  pickupTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  pickupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077b6',
    marginBottom: 2,
  },
  pickupDescription: {
    fontSize: 12,
    color: '#0077b6',
    lineHeight: 16,
  },
};

export default OrderSummary;