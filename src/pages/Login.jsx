import React, { useState } from "react";
import { supabase } from "../supabase";
import "./login.css";

const Login = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleAuth = async (e) => {
    e.preventDefault();

    // Fetch user from Supabase
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", credentials.email)
      .eq("password", credentials.password)
      .single();

    if (error || !data) {
      alert("Invalid email or password");
      return;
    }

    // Check role matches selected role
    if (data.role !== selectedRole) {
      alert("Wrong portal access");
      return;
    }

    onLogin(data);
  };

  return (
    <div className="login-page">
      <div className="glow glow1"></div>
      <div className="glow glow2"></div>

      <div className="glass-card">
        <h1 className="main-title">Cerevyn Portal</h1>
        <p className="subtitle">Select Your Role</p>

        {!selectedRole ? (
          <div className="role-container">
            <div
              className="role-card"
              onClick={() => setSelectedRole("admin")}
            >
              <h3>Admin</h3>
              <p>Manage employees & assign work</p>
            </div>

            <div
              className="role-card"
              onClick={() => setSelectedRole("employee")}
            >
              <h3>Employee</h3>
              <p>View tasks & submit updates</p>
            </div>
          </div>
        ) : (
          <div className="login-section">
            <button
              className="back-btn"
              onClick={() => setSelectedRole(null)}
            >
              ← Change Role
            </button>

            <h2 className="login-title">
              {selectedRole === "admin"
                ? "Admin Login"
                : "Employee Login"}
            </h2>

            <form onSubmit={handleAuth} className="form">
              <input
                type="email"
                placeholder="Email"
                required
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    email: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    password: e.target.value,
                  })
                }
              />

              <button className="login-btn">Login</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;