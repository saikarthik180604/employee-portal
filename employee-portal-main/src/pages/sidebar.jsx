import React from "react";

export default function Sidebar({ active, setActive, onLogout }) {
  return (
    <div className="sidebar">
      <h2 className="logo">Employee Panel</h2>

      <div className="menu">
        <button
          className={active === "dashboard" ? "active" : ""}
          onClick={() => setActive("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={active === "tasks" ? "active" : ""}
          onClick={() => setActive("tasks")}
        >
          My Tasks
        </button>

        <button
          className={active === "profile" ? "active" : ""}
          onClick={() => setActive("profile")}
        >
          Profile
        </button>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}