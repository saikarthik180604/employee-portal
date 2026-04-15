import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

export default function LeaveRequest({ user }) {
  const [leaveData, setLeaveData] = useState({
    type: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: ""
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = useCallback(async () => {
    if (!user?.id) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Leave fetch error:", error.message);
      setRequests([]);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("leaves").insert([{
        employee_id: user?.id,
        leave_type: leaveData.type,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        reason: leaveData.reason,
        status: "Pending",
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      alert("Leave request submitted to Admin!");
      setLeaveData({ type: "Casual Leave", startDate: "", endDate: "", reason: "" });
      fetchLeaveRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <div className="leave-form-card" style={{ background: '#111827', padding: '24px', borderRadius: '16px', border: '1px solid #283046' }}>
        <h3 style={{ marginBottom: '18px' }}>Apply for Leave</h3>
        <form onSubmit={handleSubmit}>
          <select value={leaveData.type} onChange={(e) => setLeaveData({...leaveData, type: e.target.value})} style={selectStyle}>
            <option>Casual Leave</option>
            <option>Sick Leave</option>
            <option>Emergency Leave</option>
          </select>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <input type="date" required value={leaveData.startDate} onChange={(e) => setLeaveData({...leaveData, startDate: e.target.value})} style={inputStyle} />
            <input type="date" required value={leaveData.endDate} onChange={(e) => setLeaveData({...leaveData, endDate: e.target.value})} style={inputStyle} />
          </div>
          <textarea placeholder="Reason for leave..." value={leaveData.reason} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} style={{ ...inputStyle, minHeight: '120px', marginTop: '14px' }} />
          <button type="submit" className="primary-btn" style={buttonStyle}>Submit Request</button>
        </form>
      </div>

      <div style={{ marginTop: '24px', background: '#111827', padding: '24px', borderRadius: '16px', border: '1px solid #283046' }}>
        <h3 style={{ marginBottom: '18px', color: '#e2e8f0' }}>My Leave History</h3>
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading leave requests...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No leave requests found.</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', background: '#0f172a', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <strong>{request.leave_type}</strong>
                  <div style={{ color: '#94a3b8', fontSize: '13px' }}>{request.start_date} to {request.end_date}</div>
                </div>
                <span style={{ color: request.status === 'Approved' ? '#10b981' : request.status === 'Rejected' ? '#f87171' : '#facc15' }}>{request.status}</span>
              </div>
              {request.reason && <p style={{ color: '#cbd5e1', marginTop: '12px' }}>{request.reason}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: '#0f172a',
  border: '1px solid #374151',
  borderRadius: '10px',
  color: 'white',
  outline: 'none'
};

const selectStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #374151',
  background: '#0f172a',
  color: 'white'
};

const buttonStyle = {
  marginTop: '16px',
  width: '100%',
  padding: '14px',
  borderRadius: '12px',
  border: 'none',
  background: '#38bdf8',
  color: '#000',
  fontWeight: '700',
  cursor: 'pointer'
};