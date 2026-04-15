import React, { useState } from "react";

export default function Topbar({ user, onLogout, setActive, unreadCount }) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Get the first letter of the name for the profile symbol
  const userInitial = user?.first_name ? user.first_name[0].toUpperCase() : 
                      user?.email ? user.email[0].toUpperCase() : "U";

  return (
    <div className="topbar" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '10px 20px', 
      background: '#0b0c10', 
      borderBottom: '1px solid #1f2833',
      position: 'relative'
    }}>
      <div className="topbar-welcome">
        <h3 style={{ color: 'white', margin: 0 }}>
          Welcome, <span style={{ color: '#00d2ff' }}>{user?.first_name || user?.email?.split('@')[0]}</span>
        </h3>
      </div>

      {/* --- RIGHT SECTION: NOTIFICATIONS & PROFILE --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        
        {/* --- NOTIFICATION BELL --- */}
        <div 
          className="notification-icon-wrapper" 
          onClick={() => setActive("notifications")}
          style={{ 
            position: 'relative', 
            cursor: 'pointer', 
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#121821',
            transition: 'all 0.3s ease'
          }}
        >
          Notifications
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-8px',
              background: '#ff4d4d',
              color: 'white',
              fontSize: '10px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: '2px solid #0b0c10',
              boxShadow: '0 0 5px rgba(255, 77, 77, 0.5)'
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* --- PROFILE SYMBOL ON THE RIGHT --- */}
        <div className="profile-section" style={{ position: 'relative' }}>
          <div 
            className="profile-circle" 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#00d2ff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1.1rem',
              boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {userInitial}
          </div>

          {/* --- DROPDOWN MENU --- */}
          {showDropdown && (
            <div className="profile-dropdown" style={{
              position: 'absolute',
              top: '55px',
              right: '0',
              backgroundColor: '#1f2833',
              border: '1px solid #45a29e',
              borderRadius: '8px',
              width: '200px',
              zIndex: 1000,
              padding: '10px 0',
              boxShadow: '0px 8px 16px rgba(0,0,0,0.6)'
            }}>
              <button 
                onClick={() => { setActive("profile"); setShowDropdown(false); }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.95rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#45a29e'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                My Profile
              </button>

              <div style={{ height: '1px', background: '#333', margin: '5px 0' }}></div>
              
              <button 
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  color: '#ff4d4d',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.95rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 77, 77, 0.1)'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}