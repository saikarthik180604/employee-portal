import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

/**
 * Succession Planning Module
 * Manages the talent pipeline for future leadership roles.
 */
export default function SuccessionPlanning() {
  const [employees, setEmployees] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(true);

  // --- Initial Data Load ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, planRes] = await Promise.all([
        supabase.from("employees").select("id, first_name, last_name, designation, department"),
        supabase.from("succession_plans").select("*, employees(first_name, last_name)")
      ]);

      if (empRes.error) throw empRes.error;
      if (planRes.error) throw planRes.error;

      setEmployees(empRes.data || []);
      setPlans(planRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Add New Candidate to Pipeline ---
  const addSuccession = async () => {
    if (!selectedEmployee || !targetRole) {
      alert("Please select an employee and define their target role.");
      return;
    }

    try {
      // Find selected employee details to satisfy 'successor_name' NOT NULL constraint
      const selectedEmpObj = employees.find(e => e.id === selectedEmployee);
      const fullName = selectedEmpObj 
        ? `${selectedEmpObj.first_name} ${selectedEmpObj.last_name}` 
        : "Unknown";

      const { error } = await supabase.from("succession_plans").insert([{
        employee_id: selectedEmployee,
        successor_name: fullName, 
        target_role: targetRole,
        readiness_level: "Ready Now", // Default value to satisfy DB constraint
        status: "Pipeline",
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      // Reset form and refresh list
      setSelectedEmployee("");
      setTargetRole("");
      fetchData();
    } catch (err) {
      alert("Unable to add succession candidate: " + err.message);
    }
  };

  // --- Remove Candidate ---
  const removePlan = async (id) => {
    if (!window.confirm("Remove this candidate from the strategic pipeline?")) return;
    
    try {
      const { error } = await supabase.from("succession_plans").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Unable to remove plan: " + err.message);
    }
  };

  // --- Render UI ---
  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8", fontWeight: "800" }}>Succession Planning</h2>
      <p style={{ color: "#94a3b8", marginBottom: "25px" }}>Identify and prepare high-potential talent for future critical roles.</p>

      <div style={{ display: "grid", gap: "25px" }}>
        
        {/* Step 1: Input Form */}
        <div style={cardStyle}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Identify Potential Successor</label>
              <select 
                value={selectedEmployee} 
                onChange={(e) => setSelectedEmployee(e.target.value)} 
                style={inputStyle}
              >
                <option value="">Choose employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Growth/Leadership Role</label>
              <input 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)} 
                placeholder="e.g. Future CTO, Project Lead, etc." 
                style={inputStyle} 
              />
            </div>
            <button onClick={addSuccession} style={submitStyle}>
              Register in Pipeline
            </button>
          </div>
        </div>

        {/* Step 2: Pipeline List */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", color: "#e2e8f0", borderBottom: "1px solid #283046", paddingBottom: "10px" }}>
            Active Succession Pipeline
          </h3>
          
          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading secure data...</p>
          ) : plans.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No succession candidates identified yet.</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} style={itemStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ fontSize: "16px", color: "#fff" }}>
                      {plan.employees?.first_name} {plan.employees?.last_name}
                    </strong>
                    <div style={{ color: "#38bdf8", fontSize: "14px", marginTop: "4px" }}>
                      Target Role: {plan.target_role}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <span style={badgeStyle}>{plan.status}</span>
                    <button 
                      onClick={() => removePlan(plan.id)} 
                      style={deleteButtonStyle}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ color: "#64748b", fontSize: "12px", marginTop: "12px" }}>
                  Candidate added: {new Date(plan.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- Component Styles ---

const cardStyle = {
  background: "#111827",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #283046",
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
};

const itemStyle = {
  marginBottom: "16px",
  padding: "20px",
  background: "#0f172a",
  borderRadius: "12px",
  border: "1px solid #374151"
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #374151",
  background: "#0f172a",
  color: "white",
  outline: "none",
  fontSize: "14px"
};

const labelStyle = { 
  color: "#94a3b8", 
  display: "block", 
  marginBottom: "8px", 
  fontSize: "13px", 
  fontWeight: "500" 
};

const submitStyle = {
  background: "#38bdf8",
  border: "none",
  borderRadius: "10px",
  padding: "14px 20px",
  color: "#000",
  fontWeight: "800",
  cursor: "pointer",
  marginTop: "10px",
  textTransform: "uppercase",
  fontSize: "12px"
};

const deleteButtonStyle = {
  background: "transparent",
  border: "1px solid #ef4444",
  borderRadius: "8px",
  padding: "6px 14px",
  color: "#ef4444",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer"
};

const badgeStyle = {
  background: "rgba(56, 189, 248, 0.1)",
  color: "#38bdf8",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "700"
};