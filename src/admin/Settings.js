import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    defaultServiceDuration: 60,
    allowOnlineBookings: true,
    requireApproval: true,
    notificationEmail: '',
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch settings from a settings table
      // For now, we'll use default values
      const defaultSettings = {
        businessName: 'Pool & Landscape Pro',
        businessEmail: 'admin@poollandscapepro.com',
        businessPhone: '+1 (555) 123-4567',
        businessAddress: '123 Service Street, City, State 12345',
        defaultServiceDuration: 60,
        allowOnlineBookings: true,
        requireApproval: true,
        notificationEmail: 'admin@poollandscapepro.com',
        maintenanceMode: false
      };
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // In a real app, you'd save to a settings table
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>System Settings</h1>
        <p style={styles.subtitle}>Configure your business settings and preferences</p>
      </div>

      <div style={styles.settingsGrid}>
        {/* Business Information */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Business Information</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Business Name</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Business Email</label>
              <input
                type="email"
                value={settings.businessEmail}
                onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Business Phone</label>
              <input
                type="tel"
                value={settings.businessPhone}
                onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Business Address</label>
              <textarea
                value={settings.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                style={styles.textarea}
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Booking Settings</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Default Service Duration (minutes)</label>
              <input
                type="number"
                value={settings.defaultServiceDuration}
                onChange={(e) => handleInputChange('defaultServiceDuration', parseInt(e.target.value))}
                style={styles.input}
                min="15"
                max="480"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notification Email</label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.allowOnlineBookings}
                onChange={(e) => handleInputChange('allowOnlineBookings', e.target.checked)}
              />
              Allow Online Bookings
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
              />
              Require Admin Approval for Bookings
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
              />
              Maintenance Mode (Disable Public Access)
            </label>
          </div>
        </div>

        {/* System Settings */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>System Settings</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <h3 style={styles.infoTitle}>Database Status</h3>
              <p style={styles.infoValue}>✅ Connected</p>
            </div>
            <div style={styles.infoItem}>
              <h3 style={styles.infoTitle}>API Status</h3>
              <p style={styles.infoValue}>✅ Operational</p>
            </div>
            <div style={styles.infoItem}>
              <h3 style={styles.infoTitle}>Last Backup</h3>
              <p style={styles.infoValue}>2 hours ago</p>
            </div>
            <div style={styles.infoItem}>
              <h3 style={styles.infoTitle}>System Version</h3>
              <p style={styles.infoValue}>v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          style={styles.saveButton}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button style={styles.resetButton} onClick={fetchSettings}>
          Reset to Defaults
        </button>
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
  settingsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  section: {
    background: '#f8fafc',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    resize: 'vertical',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoItem: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    margin: '0 0 8px 0',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  saveButton: {
    background: '#0077b6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  resetButton: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default Settings;