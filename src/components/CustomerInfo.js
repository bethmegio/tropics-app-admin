// CustomerInfo.js - Customer information form component
import React from 'react';

const CustomerInfo = ({ customerName, setCustomerName, customerEmail, setCustomerEmail, customerPhone, setCustomerPhone, customerAddress, setCustomerAddress, review, setReview }) => {
  return (
    <div style={styles.customerSection}>
      <span style={styles.sectionTitle}>Customer Information</span>

      <div style={styles.inputGroup}>
        <label style={styles.inputLabel}>Full Name</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={styles.input}
          placeholder="Enter your full name"
          required
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.inputLabel}>Email</label>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          style={styles.input}
          placeholder="Enter your email"
          required
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.inputLabel}>Phone Number</label>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          style={styles.input}
          placeholder="Enter your phone number"
          required
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.inputLabel}>Address</label>
        <textarea
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          style={styles.textarea}
          placeholder="Enter your delivery address"
          rows={3}
          required
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.inputLabel}>Review (Optional)</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          style={styles.textarea}
          placeholder="Leave a review for your order..."
          rows={3}
        />
      </div>
    </div>
  );
};

const styles = {
  customerSection: {
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
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    resize: 'vertical',
    minHeight: 80,
    boxSizing: 'border-box',
  },
};

export default CustomerInfo;