import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function GrievanceResolution() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({}); // Stores local text for mediation

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("grievances")
      .select("*, employees(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setGrievances([]);
    } else {
      setGrievances(data || []);
    }
    setLoading(false);
  };

  // Investigate, Mediate, and Close Logic
  const handleMediateAndClose = async (id) => {
    const mediationText = remarks[id];
    if (!mediationText) {
      alert("Please enter mediation remarks to resolve and close the case.");
      return;
    }

    const { error } = await supabase
      .from("grievances")
      .update({ 
        status: "Resolved", 
        admin_remarks: mediationText,
        updated_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      alert("Unable to update grievance: " + error.message);
      return;
    }
    
    // Clear local remark for this ID and refresh
    setRemarks(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    fetchGrievances();
  };

  const handleReject = async (id) => {
    const { error } = await supabase.from("grievances").update({ status: "Rejected" }).eq("id", id);
    if (error) alert(error.message);
    else fetchGrievances();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8", fontWeight: "800" }}>Grievance Resolution</h2>
      <p style={{ color: "#94a3b8" }}>Investigate concerns, provide mediation, and finalize cases.</p>

      <div style={{ display: "grid", gap: "18px", marginTop: "20px" }}>
        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading secure records...</p>
        ) : grievances.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No active grievance cases.</p>
        ) : (
          grievances.map((grievance) => (
            <div key={grievance.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{grievance.subject}</h3>
                  <div style={{ color: "#38bdf8", fontSize: "13px", marginTop: "4px" }}>
                    From: {grievance.employees?.first_name} {grievance.employees?.last_name}
                  </div>
                </div>
                <span style={statusBadge(grievance.status)}>{grievance.status}</span>
              </div>

              {/* Investigation Section */}
              <div style={investigationBox}>
                <div style={labelStyle}>Employee Statement:</div>
                <p style={{ margin: "8px 0 0", color: "#cbd5e1" }}>{grievance.description}</p>
              </div>

              {/* Mediation & Action Section */}
              {grievance.status !== "Resolved" && grievance.status !== "Rejected" ? (
                <div style={{ marginTop: "20px" }}>
                  <div style={labelStyle}>Mediation Remarks:</div>
                  <textarea 
                    placeholder="Document the investigation findings and mediation steps..."
                    style={textAreaStyle}
                    value={remarks[grievance.id] || ""}
                    onChange={(e) => setRemarks({...remarks, [grievance.id]: e.target.value})}
                  />
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    <button style={buttonStyle} onClick={() => handleMediateAndClose(grievance.id)}>
                      Resolve & Close Case
                    </button>
                    <button style={{ ...buttonStyle, background: "#f87171" }} onClick={() => handleReject(grievance.id)}>
                      Reject Case
                    </button>
                  </div>
                </div>
              ) : (
                <div style={resolvedBox}>
                  <div style={labelStyle}>Final Resolution:</div>
                  <p style={{ margin: "8px 0 0", fontStyle: "italic" }}>
                    {grievance.admin_remarks || "Case closed without additional remarks."}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Enhanced Styles ---

const cardStyle = {
  background: "#111827",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #283046",
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
};

const investigationBox = {
  background: "#0f172a",
  padding: "15px",
  borderRadius: "10px",
  marginTop: "15px",
  borderLeft: "4px solid #38bdf8"
};

const resolvedBox = {
  background: "rgba(16, 185, 129, 0.1)",
  padding: "15px",
  borderRadius: "10px",
  marginTop: "15px",
  border: "1px solid #10b981",
  color: "#10b981"
};

const labelStyle = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontWeight: "700",
  color: "#64748b"
};

const textAreaStyle = {
  width: "100%",
  background: "#1e293b",
  border: "1px solid #334155",
  color: "white",
  padding: "12px",
  borderRadius: "10px",
  marginTop: "8px",
  minHeight: "80px",
  outline: "none"
};

const buttonStyle = {
  background: "#38bdf8",
  border: "none",
  borderRadius: "8px",
  color: "#000",
  padding: "12px 20px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "opacity 0.2s"
};

const statusBadge = (status) => ({
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 12px",
  borderRadius: "20px",
  background: status === "Resolved" ? "#10b981" : status === "Rejected" ? "#ef4444" : "#facc15",
  color: "#000"
});