import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()

  const navItems = [
        { 
        name: '🏠 Home', 
        path: '/dashboard',
        icon: <FaHome size={20} />  // Add FaHome import at top
    },
    { 
        name: '📦 Manage Products', 
        path: '/dashboard/products',
        icon: <FaBox size={20} />  // Add FaBox import
    },
    { 
        name: '👥 Users', 
        path: '/dashboard/users',
        icon: <FaUsers size={20} />  // Add FaUsers import
    },
    { 
        name: '📊 Reports',
        path: '/dashboard/reports',
        icon: <FaChartLine size={20} />,
        notification: 0
    },
   
    
  ]

  return (
    <div className="sidebar" style={styles.sidebar}>
      <h2 style={styles.logo}>Admin Panel</h2>
      <nav>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              backgroundColor: location.pathname === item.path ? '#007bff' : 'transparent',
              color: location.pathname === item.path ? '#fff' : '#333'
            }}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}

const styles = {
  sidebar: {
    width: '220px',
    background: '#f8f9fa',
    height: '100vh',
    padding: '20px',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#007bff'
  },
  link: {
    display: 'block',
    padding: '10px 15px',
    textDecoration: 'none',
    borderRadius: '8px',
    marginBottom: '10px',
    transition: '0.3s'
  }
}
