import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";

export default function ExitRequest({ user }) {
  const [exitForm, setExitForm] = useState({ last_working_date: "", notice_reason: "" });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExitRequests = useCallback(async () => {
    if (!user?.id) return setLoading(false);
    setLoading(true);

    const { data, error } = await supabase
      .from("exit_requests")
      .select("*")
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
    fetchExitRequests();
  }, [fetchExitRequests]);

  const submitExit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("exit_requests").insert([{
      employee_id: user.id,
      last_working_date: exitForm.last_working_date,
      notice_reason: exitForm.notice_reason,
      status: "Pending",
      created_at: new Date().toISOString()
    }]);

    if (error) {
      alert("Unable to submit resignation: " + error.message);
      return;
    }

    setExitForm({ last_working_date: "", notice_reason: "" });
    alert("Resignation submitted. HR will process your exit." );
    fetchExitRequests();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8" }}>Resignation & Exit</h2>
      <p style={{ color: "#94a3b8" }}>Submit your resignation and track exit clearance.</p>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        <form onSubmit={submitExit} style={cardStyle}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Last Working Date</label>
              <input
                type="date"
                value={exitForm.last_working_date}
                onChange={(e) => setExitForm({ ...exitForm, last_working_date: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Reason for Exit</label>
              <textarea
                rows={5}
                value={exitForm.notice_reason}
                onChange={(e) => setExitForm({ ...exitForm, notice_reason: e.target.value })}
                placeholder="Share a brief reason or feedback for your resignation."
                style={{ ...inputStyle, minHeight: "120px" }}
                required
              />
            </div>
            <button type="submit" style={submitStyle}>Submit Resignation</button>
          </div>
        </form>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: "14px", color: "#e2e8f0" }}>My Exit Requests</h3>
          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading exit submissions...</p>
          ) : requests.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No exit requests submitted yet.</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} style={{ marginBottom: "16px", padding: "16px", background: "#0f172a", borderRadius: "12px", border: "1px solid #374151" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <strong>Last Date: {request.last_working_date}</strong>
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>{new Date(request.created_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{ color: request.status === "Approved" ? "#10b981" : request.status === "Rejected" ? "#f87171" : "#facc15" }}>
                    {request.status}
                  </span>
                </div>
                <p style={{ color: "#cbd5e1", margin: "10px 0 0" }}>{request.notice_reason}</p>
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
