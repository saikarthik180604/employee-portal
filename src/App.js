import React, { useState } from "react";
import "./App.css";

import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  // If not logged in → show Login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // If Admin → show Admin Dashboard
  if (user.role === "admin") {
    return (
      <AdminDashboard
        user={user}
        onLogout={() => setUser(null)}
        tasks={tasks}
        setTasks={setTasks}
      />
    );
  }

  // If Employee → show Employee Dashboard
  return (
    <EmployeeDashboard
      user={user}
      onLogout={() => setUser(null)}
      tasks={tasks}
      setTasks={setTasks}
    />
  );
}