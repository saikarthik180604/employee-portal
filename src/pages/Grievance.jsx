import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";

export default function Grievance({ user }) {
  const [grievance, setGrievance] = useState({ subject: "", description: "" });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGrievances = useCallback(async () => {
    if (!user?.id) return setLoading(false);
    setLoading(true);
    const { data, error } = await supabase
      .from("grievances")
      .select("*")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setEntries([]);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const submitGrievance = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("grievances").insert([{
      employee_id: user.id,
      subject: grievance.subject,
      description: grievance.description,
      status: "Pending",
      created_at: new Date().toISOString()
    }]);

    if (error) {
      alert("Unable to submit grievance: " + error.message);
      return;
    }

    setGrievance({ subject: "", description: "" });
    alert("Grievance recorded. HR will review shortly.");
    fetchGrievances();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8" }}>Raise a Grievance</h2>
      <p style={{ color: "#94a3b8" }}>Submit workplace issues for HR resolution.</p>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        <form onSubmit={submitGrievance} style={cardStyle}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Subject</label>
              <input
                value={grievance.subject}
                onChange={(e) => setGrievance({ ...grievance, subject: e.target.value })}
                placeholder="Brief title of the issue"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={grievance.description}
                onChange={(e) => setGrievance({ ...grievance, description: e.target.value })}
                placeholder="Describe the concern clearly."
                rows={6}
                style={{ ...inputStyle, minHeight: "130px" }}
                required
              />
            </div>
            <button type="submit" style={submitStyle}>Submit Grievance</button>
          </div>
        </form>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: "14px" }}>My Grievances</h3>
          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading your submissions...</p>
          ) : entries.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No grievances submitted yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} style={{ marginBottom: "16px", padding: "14px", background: "#0f172a", borderRadius: "12px", border: "1px solid #374151" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <strong>{entry.subject}</strong>
                  <span style={{ color: entry.status === "Resolved" ? "#10b981" : entry.status === "Rejected" ? "#f87171" : "#facc15" }}>{entry.status}</span>
                </div>
                <p style={{ color: "#cbd5e1", margin: "10px 0 0" }}>{entry.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#111827",
  padding: "22px",
  borderRadius: "14px",
  border: "1px solid #283046"
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #374151",
  background: "#0f172a",
  color: "white",
  outline: "none"
};

const labelStyle = { color: "#94a3b8", display: "block", marginBottom: "8px" };

const submitStyle = {
  background: "#38bdf8",
  border: "none",
  borderRadius: "10px",
  padding: "12px 18px",
  color: "#000",
  fontWeight: "700",
  cursor: "pointer"
};
