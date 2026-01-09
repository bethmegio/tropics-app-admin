// PaymentSection.js - Payment method selection component
import React from 'react';
import { IoWalletOutline, IoCashOutline, IoCheckmarkCircle, IoEllipseOutline, IoInformationCircle } from 'react-icons/io5';

const PaymentSection = ({ selectedPaymentMethod, setSelectedPaymentMethod, calculateTotal }) => {
  return (
    <div style={styles.paymentSection}>
      <span style={styles.sectionTitle}>Payment Method</span>

      {/* GCash Option */}
      <button
        style={selectedPaymentMethod === 'gcash' ? {...styles.paymentOption, ...styles.paymentOptionSelected} : styles.paymentOption}
        onClick={() => setSelectedPaymentMethod('gcash')}
      >
        <div style={styles.paymentOptionLeft}>
          <div style={{...styles.paymentIconContainer, backgroundColor: '#0078b5'}}>
            <IoWalletOutline size={24} color="#fff" />
          </div>
          <div>
            <span style={styles.paymentOptionTitle}>GCash</span>
            <span style={styles.paymentOptionSubtitle}>Pay via GCash mobile wallet</span>
          </div>
        </div>
        <div style={styles.paymentOptionRight}>
          {selectedPaymentMethod === 'gcash' ? (
            <IoCheckmarkCircle size={24} color="#00BFFF" />
          ) : (
            <IoEllipseOutline size={24} color="#ccc" />
          )}
        </div>
      </button>

      {/* Cash on Pickup Option */}
      <button
        style={selectedPaymentMethod === 'cash' ? {...styles.paymentOption, ...styles.paymentOptionSelected} : styles.paymentOption}
        onClick={() => setSelectedPaymentMethod('cash')}
      >
        <div style={styles.paymentOptionLeft}>
          <div style={{...styles.paymentIconContainer, backgroundColor: '#28a745'}}>
            <IoCashOutline size={24} color="#fff" />
          </div>
          <div>
            <span style={styles.paymentOptionTitle}>Cash on Pickup</span>
            <span style={styles.paymentOptionSubtitle}>Pay at our store when you collect</span>
          </div>
        </div>
        <div style={styles.paymentOptionRight}>
          {selectedPaymentMethod === 'cash' ? (
            <IoCheckmarkCircle size={24} color="#00BFFF" />
          ) : (
            <IoEllipseOutline size={24} color="#ccc" />
          )}
        </div>
      </button>

      {/* GCash Instructions */}
      {selectedPaymentMethod === 'gcash' && (
        <div style={styles.gcashInstructions}>
          <div style={styles.gcashHeader}>
            <IoInformationCircle size={18} color="#0078b5" />
            <span style={styles.gcashHeaderText}>GCash Payment Instructions</span>
          </div>
          <span style={styles.gcashText}>1. Open GCash app and tap "Send Money"</span>
          <span style={styles.gcashText}>2. Enter our GCash number: <span style={styles.gcashNumber}>0915 736 2648</span></span>
          <span style={styles.gcashText}>3. Enter amount: ₱{Number(calculateTotal()).toLocaleString()}</span>
          <span style={styles.gcashText}>4. Send payment and save your reference number</span>
          <span style={styles.gcashText}>5. Show your GCash receipt when picking up your order</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  paymentSection: {
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
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: '#00BFFF',
    backgroundColor: '#f0f8ff',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentOptionRight: {
    marginLeft: 10,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  gcashInstructions: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  gcashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gcashHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0078b5',
    marginLeft: 8,
  },
  gcashText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  gcashNumber: {
    fontWeight: '700',
    color: '#0078b5',
  },
};

export default PaymentSection;