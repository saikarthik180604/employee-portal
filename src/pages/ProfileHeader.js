import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
// We reuse the logout button from the sidebar
import "./sidebar.css"; 

export default function ProfileHeader({ onLogout, session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [empDetails, setEmpDetails] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      // 1. Get the current user session
      const user = session?.user;
      
      if (!user) return;

      // 2. Fetch detailed information from the 'employees' table
      const { data, error } = await supabase
        .from('employees')
        .select('first_name, last_name, email, department, designation')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error("Profile Fetch Error:", error.message);
      } else {
        setEmpDetails(data);
      }
    };

    fetchProfileData();
  }, [session]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  if (!empDetails) return <div style={{ color: "white" }}>Loading...</div>;

  const firstInitial = empDetails.first_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="profile-wrapper" style={{ position: 'relative' }}>
      {/* 1. THE CLICKABLE AVATAR/SYMBOL */}
      <div 
        className="profile-avatar" 
        onClick={toggleDropdown}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#00d2ff', // Matching your theme
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          float: 'right', // Put it on the right side of the main container
          marginRight: '20px'
        }}
      >
        {firstInitial}
      </div>

      {/* 2. THE DROPDOWN MENU (Visually similar to image_3.png) */}
      {isOpen && (
        <div className="profile-dropdown" style={{
          position: 'absolute',
          top: '50px',
          right: '20px',
          backgroundColor: '#111', // Reusing your dark theme
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '20px',
          width: '300px',
          zIndex: '1000',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          fontFamily: 'sans-serif'
        }}>
          {/* Header Section (like in image_3.png) */}
          <div style={{ textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: '#333',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px auto',
              fontSize: '2rem'
            }}>
              {firstInitial}
            </div>
            <h3 style={{ margin: 0, color: 'white' }}>{empDetails.first_name} {empDetails.last_name}</h3>
            <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>{empDetails.designation || 'Employee'}</p>
          </div>

          {/* Account Details Section (like image_3.png) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 15px', color: '#ccc', fontSize: '0.9rem' }}>
            <strong style={{ color: '#00d2ff' }}>👤 Full Name:</strong> 
            <span style={{ color: 'white' }}>{empDetails.first_name} {empDetails.last_name}</span>
            
            <strong style={{ color: '#00d2ff' }}>✉️ Email:</strong> 
            <span style={{ color: 'white' }}>{empDetails.email}</span>
            
            <strong style={{ color: '#00d2ff' }}>🏢 Department:</strong> 
            <span style={{ color: 'white' }}>{empDetails.department || 'Not Set'}</span>
          </div>

          {/* Action Buttons */}
          <button 
            onClick={onLogout} 
            className="logout-btn" 
            style={{ 
              width: '100%', 
              marginTop: '20px', 
              padding: '10px', 
              borderRadius: '5px', 
              backgroundColor: '#e74c3c' // Matching your red logout button
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}