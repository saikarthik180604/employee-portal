import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function ExitProcessing() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExitRequests();
  }, []);

  const fetchExitRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exit_requests")
      .select("*, employees(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setRequests([]);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const processExit = async (id, status) => {
    const { error } = await supabase.from("exit_requests").update({ status }).eq("id", id);
    if (error) {
      alert("Unable to update exit request: " + error.message);
      return;
    }
    fetchExitRequests();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8" }}>Exit & FnF Settlement</h2>
      <p style={{ color: "#94a3b8" }}>Approve resignations and complete final settlement processing.</p>

      <div style={{ display: "grid", gap: "18px", marginTop: "20px" }}>
        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading exit requests...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No exit requests pending.</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{request.employees?.first_name} {request.employees?.last_name}</h3>
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>Last Working Date: {request.last_working_date}</div>
                </div>
                <span style={{ color: request.status === "Completed" ? "#10b981" : request.status === "Rejected" ? "#ef4444" : "#facc15" }}>
                  {request.status}
                </span>
              </div>
              <p style={{ color: "#cbd5e1", margin: "12px 0 0" }}>{request.notice_reason}</p>
              <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button style={buttonStyle} onClick={() => processExit(request.id, "Completed")}>
                  Complete Settlement
                </button>
                <button style={{ ...buttonStyle, background: "#f87171" }} onClick={() => processExit(request.id, "Rejected")}>Reject</button>
              </div>
            </div>
          ))
        )}
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

const buttonStyle = {
  background: "#38bdf8",
  border: "none",
  borderRadius: "10px",
  color: "#000",
  padding: "10px 16px",
  cursor: "pointer"
};
