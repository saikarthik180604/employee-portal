import React from "react";

// The logo import line is removed to stop the 'Module not found' error.

export default function Sidebar({ active, setActive, onLogout, role = "Employee" }) {
  // Ensuring role check is case-insensitive to avoid bugs
  const isAdmin = role?.toLowerCase() === "admin";

  return (
    <div className="sidebar" style={styles.sidebar}>
      
      {/* HEADER SECTION (Text instead of Image) */}
      <div className="logo-container" style={styles.logoContainer}>
        <h1 style={styles.brandName}>CEREVYN</h1>
        <h2 className="logo" style={styles.logoText}>
          {isAdmin ? "Admin Panel" : "Employee Panel"}
        </h2>
      </div>

      {/* NAVIGATION MENU */}
      <div className="menu" style={styles.menu}>
        <button 
          className={active === "dashboard" ? "active" : ""} 
          onClick={() => setActive("dashboard")}
        >
          Dashboard
        </button>

        {/* PROBATION SECTION - Added for Employee Settling In phase */}
        {!isAdmin && (
          <button 
            className={active === "probation" ? "active" : ""} 
            onClick={() => setActive("probation")}
          >
            Probation
          </button>
        )}

        {!isAdmin && (
          <button 
            className={active === "jobsearch" ? "active" : ""} 
            onClick={() => setActive("jobsearch")}
          >
            Job Search
          </button>
        )}

        {!isAdmin && (
          <button 
            className={active === "offer" ? "active" : ""} 
            onClick={() => setActive("offer")}
          >
            Offer Acceptance
          </button>
        )}

        {!isAdmin && (
          <button 
            className={active === "leave" ? "active" : ""} 
            onClick={() => setActive("leave")}
          >
            Leave Request
          </button>
        )}

        {!isAdmin && (
          <button 
            className={active === "career" ? "active" : ""} 
            onClick={() => setActive("career")}
          >
            Career Growth
          </button>
        )}

        {!isAdmin && (
          <button 
            className={active === "grievance" ? "active" : ""} 
            onClick={() => setActive("grievance")}
          >
            Grievance
          </button>
        )}

        {!isAdmin && (
          <button 
            className={active === "exit" ? "active" : ""} 
            onClick={() => setActive("exit")}
          >
            Exit Request
          </button>
        )}

        {isAdmin && (
          <button 
            className={active === "employees" ? "active" : ""} 
            onClick={() => setActive("employees")}
          >
            Employees
          </button>
        )}

        <button 
          className={active === "tasks" ? "active" : ""} 
          onClick={() => setActive("tasks")}
        >
          {isAdmin ? "Tasks" : "My Tasks"}
        </button>

        <button 
          className={active === "attendance" ? "active" : ""} 
          onClick={() => setActive("attendance")}
        >
          Attendance
        </button>

        <button 
          className={active === "payroll" ? "active" : ""} 
          onClick={() => setActive("payroll")}
        >
          Payroll
        </button>

        {/* TRAINING & LEARNING SECTION - Connecting the L&D block from your flowchart */}
        <button 
          className={active === "training" ? "active" : ""} 
          onClick={() => setActive("training")}
        >
          {isAdmin ? "L&D Management" : "Training & Learning"}
        </button>

        {/* PERFORMANCE SECTION - Logic added based on workflow growth & development */}
        <button 
          className={active === "performance" ? "active" : ""} 
          onClick={() => setActive("performance")}
        >
          {isAdmin ? "Performance Appraisal" : "Performance Self-review"}
        </button>
      </div>

      {/* LOGOUT BUTTON */}
      <button className="logout-btn" onClick={onLogout} style={styles.logoutBtn}>
        Logout
      </button>
    </div>
  );
}

const styles = {
  sidebar: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100vh', 
    backgroundColor: '#0f172a', 
    color: 'white', 
    width: '260px', 
    position: 'fixed', 
    left: 0, 
    top: 0, 
    borderRight: '1px solid #1e293b',
    zIndex: 1000
  },
  logoContainer: { 
    padding: '30px 10px', 
    textAlign: 'center', 
    borderBottom: '1px solid #1e293b' 
  },
  brandName: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '2px'
  },
  logoText: { 
    fontSize: '0.8rem', 
    marginTop: '5px', 
    color: '#38bdf8', 
    letterSpacing: '1px', 
    textTransform: 'uppercase' 
  },
  menu: { 
    flexGrow: 1, 
    padding: '10px 0', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '5px',
    overflowY: 'auto'
  },
  logoutBtn: { 
    margin: '20px', 
    padding: '10px', 
    backgroundColor: '#ef4444', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: 'bold' 
  }
};