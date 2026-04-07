import React, { useState } from "react";
import { supabase } from "../supabase";

export default function Register({ onBack }) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("users").insert([
      { ...formData, role: "employee" }
    ]);
    if (error) alert(error.message);
    else {
      alert("Registration Successful! Use your email to log in.");
      onBack(); // Go back to login page
    }
  };

  return (
    <div className="glass-card">
      <h2>Employee Registration</h2>
      <form onSubmit={handleRegister} className="form">
        <input placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
        <input placeholder="Email" type="email" onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input placeholder="Create Password" type="password" onChange={e => setFormData({...formData, password: e.target.value})} required />
        <button className="login-btn">Register</button>
        <button type="button" onClick={onBack} className="back-btn">Back to Login</button>
      </form>
    </div>
  );
}