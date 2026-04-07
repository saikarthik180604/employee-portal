import React, { useState } from "react";
import { supabase } from "../supabase";

export default function LeaveRequest({ employeeId }) {
  const [leaveData, setLeaveData] = useState({
    type: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("leaves").insert([{
        employee_id: employeeId,
        leave_type: leaveData.type,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        reason: leaveData.reason,
        status: "Pending"
      }]);

      if (error) throw error;
      alert("Leave request submitted to Admin!");
      setLeaveData({ type: "Casual Leave", startDate: "", endDate: "", reason: "" });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="leave-form-card">
      <h3>Apply for Leave</h3>
      <form onSubmit={handleSubmit}>
        <select value={leaveData.type} onChange={(e) => setLeaveData({...leaveData, type: e.target.value})}>
          <option>Casual Leave</option>
          <option>Sick Leave</option>
          <option>Emergency Leave</option>
        </select>
        <div className="grid-2">
          <input type="date" required value={leaveData.startDate} onChange={(e) => setLeaveData({...leaveData, startDate: e.target.value})} />
          <input type="date" required value={leaveData.endDate} onChange={(e) => setLeaveData({...leaveData, endDate: e.target.value})} />
        </div>
        <textarea placeholder="Reason for leave..." value={leaveData.reason} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} />
        <button type="submit" className="primary-btn">Submit Request</button>
      </form>
    </div>
  );
}