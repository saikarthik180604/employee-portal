import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";

export default function CareerDevelopment({ user }) {
  const [request, setRequest] = useState({ desired_role: "", desired_department: "", reason: "" });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return setLoading(false);

    setLoading(true);
    const { data, error } = await supabase
      .from("career_requests")
      .select("*, employees(first_name, last_name)")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setRequests([]);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const submitRequest = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("career_requests").insert([{ 
      employee_id: user.id,
      desired_role: request.desired_role,
      desired_department: request.desired_department,
      reason: request.reason,
      status: "Pending",
      created_at: new Date().toISOString()
    }]);

    if (error) {
      alert("Unable to submit request: " + error.message);
      return;
    }

    setRequest({ desired_role: "", desired_department: "", reason: "" });
    alert("Career development request submitted.");
    fetchRequests();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8" }}>Career Development</h2>
      <p style={{ color: "#94a3b8" }}>Request promotion or internal transfer opportunities.</p>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        <form onSubmit={submitRequest} style={{ background: "#111827", padding: "22px", borderRadius: "14px", border: "1px solid #283046" }}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>Desired Role</label>
              <input
                value={request.desired_role}
                onChange={(e) => setRequest({ ...request, desired_role: e.target.value })}
                placeholder="e.g. Senior Product Manager"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>Desired Department</label>
              <input
                value={request.desired_department}
                onChange={(e) => setRequest({ ...request, desired_department: e.target.value })}
                placeholder="e.g. Product or Sales"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "6px" }}>Why are you interested?</label>
              <textarea
                value={request.reason}
                onChange={(e) => setRequest({ ...request, reason: e.target.value })}
                rows={5}
                placeholder="Explain a short development plan or transfer rationale."
                style={{ ...inputStyle, minHeight: "110px" }}
                required
              />
            </div>
            <button type="submit" style={submitStyle}>Submit Career Request</button>
          </div>
        </form>

        <div style={{ background: "#111827", padding: "22px", borderRadius: "14px", border: "1px solid #283046" }}>
          <h3 style={{ margin: 0, color: "#e2e8f0" }}>My Requests</h3>
          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No career requests submitted yet.</p>
          ) : (
            requests.map((item) => (
              <div key={item.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
                  <div>
                    <strong>{item.desired_role}</strong>
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>{item.desired_department}</div>
                  </div>
                  <span style={{ color: item.status === "Approved" ? "#10b981" : item.status === "Rejected" ? "#f87171" : "#facc15" }}>
                    {item.status}
                  </span>
                </div>
                <p style={{ color: "#cbd5e1", margin: "10px 0 0" }}>{item.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #374151",
  background: "#0f172a",
  color: "white",
  outline: "none"
};

const submitStyle = {
  background: "#38bdf8",
  border: "none",
  borderRadius: "10px",
  padding: "12px 18px",
  color: "#000",
  fontWeight: "700",
  cursor: "pointer"
};

const cardStyle = {
  marginTop: "18px",
  padding: "16px",
  background: "#0f172a",
  borderRadius: "12px",
  border: "1px solid #374151"
};
