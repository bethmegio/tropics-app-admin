// StoreInfo.js - Store pickup information component
import React from 'react';
import { IoLocationOutline, IoTimeOutline, IoCallOutline } from 'react-icons/io5';

const StoreInfo = () => {
  return (
    <div style={styles.storeSection}>
      <span style={styles.sectionTitle}>Store Pickup Location</span>
      <div style={styles.storeInfo}>
        <div style={styles.storeDetail}>
          <IoLocationOutline size={16} color="#0077b6" />
          <span style={styles.storeText}>
            Purok Bougainvillea, Dumaguete City, 6200 Negros Oriental
          </span>
        </div>
        <div style={styles.storeDetail}>
          <IoTimeOutline size={16} color="#0077b6" />
          <span style={styles.storeText}>Mon-Sun: 7:00 AM - 7:00 PM</span>
        </div>
        <div style={styles.storeDetail}>
          <IoCallOutline size={16} color="#0077b6" />
          <span style={styles.storeText}>0915 736 2648</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  storeSection: {
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
  storeInfo: {
    gap: 8,
  },
  storeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
};

export default StoreInfo;