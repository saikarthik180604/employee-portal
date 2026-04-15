import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase"; 
import "./Attendance.css";

export default function Attendance({ user }) {
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [status, setStatus] = useState("Signed Out");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  // --- STATE ---
  const [leaves, setLeaves] = useState([]);
  const [allEmployeeLeaves, setAllEmployeeLeaves] = useState([]); 
  
  // Toggle States for Forms
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showPermissionForm, setShowPermissionForm] = useState(false);

  // Form Data States
  const [leaveData, setLeaveData] = useState({ type: "Sick", start: "", end: "", reason: "" });
  const [permData, setPermData] = useState({ type: "Permission (1-2 Hours)", date: "", duration: "1 Hour", reason: "" });

  // --- GPS Coordinates Logic ---
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (err) => {
            reject(new Error("Please enable location access to Sign In."));
          }
        );
      }
    });
  };

  // --- COMBINED FETCH LOGIC ---
  const fetchAllData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Fetch Attendance
      const { data: attData, error: attError } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", user.id)
        .order("date", { ascending: false })
        .order("check_in", { ascending: false });

      // FIX: Removed 'error: lError' because it was never used
      const { data: lData } = await supabase
        .from("leaves")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });

      if (isAdmin) {
        const { data: adminLData } = await supabase
          .from("leaves")
          .select("*, employees(name)") 
          .order("created_at", { ascending: false });
        setAllEmployeeLeaves(adminLData || []);
      }

      if (attError) throw attError;
      setRecords(attData || []);
      setLeaves(lData || []);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Logic for status check
      const hasApprovedLeaveToday = lData?.some(l => 
        l.status === 'Approved' && today >= l.start_date && today <= l.end_date
      );
      
      if (hasApprovedLeaveToday) {
        setStatus("On Approved Leave");
      } else {
        const todaySession = attData?.find(rec => rec.date === today && !rec.check_out);
        if (todaySession) {
          setStatus("Signed In");
        } else {
          setStatus("Signed Out");
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- HANDLERS (Omitted for brevity, keep your existing handlers here) ---
  const handleAdminLeaveAction = async (leaveId, newStatus) => {
    setBtnLoading(true);
    try {
      const { error } = await supabase.from("leaves").update({ status: newStatus }).eq("id", leaveId);
      if (error) throw error;
      fetchAllData();
    } catch (err) { alert(err.message); } finally { setBtnLoading(false); }
  };

  const handleClockIn = async () => {
    setBtnLoading(true);
    try {
      const coords = await getLocation();
      const today = new Date().toISOString().split('T')[0]; 
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      const { error } = await supabase.from("attendance").insert([{
            employee_id: user.id, date: today, check_in: time, status: "Present",
            latitude: coords.lat, longitude: coords.lng
      }]);
      if (error) throw error;
      await fetchAllData(); 
    } catch (err) { alert(err.message); } finally { setBtnLoading(false); }
  };

  const handleClockOut = async () => {
    setBtnLoading(true);
    try {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      const { error } = await supabase.from("attendance")
        .update({ check_out: time })
        .eq("employee_id", user.id)
        .is("check_out", null); 
      
      if (error) throw error;
      await fetchAllData();
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setBtnLoading(false); 
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      const { error } = await supabase.from("leaves").insert([{
        employee_id: user.id, leave_type: leaveData.type, start_date: leaveData.start,
        end_date: leaveData.end, reason: leaveData.reason, status: "Pending"
      }]);
      if (error) throw error;
      setShowLeaveForm(false);
      fetchAllData();
    } catch (err) { alert(err.message); } finally { setBtnLoading(false); }
  };

  const handlePermissionSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      const { error } = await supabase.from("leaves").insert([{
        employee_id: user.id, 
        leave_type: `${permData.type} (${permData.duration})`, 
        start_date: permData.date, 
        end_date: permData.date, 
        reason: permData.reason, 
        status: "Pending"
      }]);
      if (error) throw error;
      setShowPermissionForm(false);
      fetchAllData();
    } catch (err) { alert(err.message); } finally { setBtnLoading(false); }
  };

  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return { backgroundColor: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', border: '1px solid #4ade80' };
      case 'rejected': return { backgroundColor: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid #f87171' };
      default: return { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid #fbbf24' };
    }
  };

  return (
    <div className="attendance-container" style={{ backgroundColor: 'transparent', color: 'white' }}>
      <h2 className="attendance-title">{isAdmin ? "Admin Console" : "Attendance & Leave Module"}</h2>

      <div className="summary-cards">
        <div className="card present">Present Days <h3>{records.length}</h3></div>
        <div className="card absent">On Leave <h3>{leaves.filter(l => l.status === 'Approved').length}</h3></div>
        <div className="card hours">Avg Hours <h3>7.5</h3></div>
        <div className="card late">Pending <h3>{leaves.filter(l => l.status === 'Pending').length}</h3></div>
      </div>

      <div className="status-box" style={{ background: '#1e293b', border: '1px solid #334155', padding: '20px', borderRadius: '12px' }}>
        <p style={{marginBottom: '10px'}}>Current Status: <strong>{status}</strong></p>
        
        {records.length > 0 && records[0].date === new Date().toISOString().split('T')[0] && (
           <p style={{fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px'}}>
             Today: Login at {records[0].check_in} {records[0].check_out ? `| Logout at ${records[0].check_out}` : ""}
           </p>
        )}

        <div className="status-actions">
          <button className="clock-in-btn" onClick={handleClockIn} disabled={status !== "Signed Out" || btnLoading}>Sign In</button>
          <button className="clock-out-btn" onClick={handleClockOut} disabled={status !== "Signed In" || btnLoading}>Sign Out</button>
          <button className="leave-btn" onClick={() => {setShowLeaveForm(!showLeaveForm); setShowPermissionForm(false);}} style={{backgroundColor: '#475569', marginLeft: '10px'}}>
            {showLeaveForm ? "Close Form" : "Request Leave"}
          </button>
          <button className="perm-btn" onClick={() => {setShowPermissionForm(!showPermissionForm); setShowLeaveForm(false);}} style={{backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginLeft: '10px'}}>
            {showPermissionForm ? "Close Form" : "Permission / Half-Day"}
          </button>
        </div>
      </div>

      {showLeaveForm && (
        <form className="leave-form" onSubmit={handleLeaveSubmit} style={{background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginTop: '15px'}}>
          <h4 style={{marginBottom: '15px'}}>New Full Leave Request</h4>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            <select style={{background: '#0f172a', color: 'white', padding: '10px'}} onChange={(e) => setLeaveData({...leaveData, type: e.target.value})}>
              <option>Sick</option><option>Casual</option><option>Vacation</option>
            </select>
            <input type="date" required style={{background: '#0f172a', color: 'white', padding: '10px'}} onChange={(e) => setLeaveData({...leaveData, start: e.target.value})} />
            <input type="date" required style={{background: '#0f172a', color: 'white', padding: '10px'}} onChange={(e) => setLeaveData({...leaveData, end: e.target.value})} />
          </div>
          <textarea placeholder="Reason for leave..." style={{background: '#0f172a', color: 'white', width: '100%', marginTop: '10px', padding: '10px'}} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} />
          <button type="submit" className="filter-btn" style={{marginTop: '10px', width: '100%'}}>Submit Full Leave</button>
        </form>
      )}

      {showPermissionForm && (
        <form className="leave-form" onSubmit={handlePermissionSubmit} style={{background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #0ea5e9', marginTop: '15px'}}>
          <h4 style={{marginBottom: '15px', color: '#0ea5e9'}}>Request Permission / Half-Day</h4>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            <select style={{background: '#0f172a', color: 'white', padding: '10px'}} onChange={(e) => setPermData({...permData, type: e.target.value})}>
              <option>Permission (1-2 Hours)</option><option>Half-Day (Morning)</option><option>Half-Day (Afternoon)</option>
            </select>
            <input type="date" required style={{background: '#0f172a', color: 'white', padding: '10px'}} onChange={(e) => setPermData({...permData, date: e.target.value})} />
            <select style={{background: '#0f172a', color: 'white', padding: '10px'}} onChange={(e) => setPermData({...permData, duration: e.target.value})}>
              <option>1 Hour</option><option>2 Hours</option><option>4 Hours</option>
            </select>
            <input type="text" placeholder="Reason..." style={{background: '#0f172a', color: 'white', padding: '10px'}} onChange={(e) => setPermData({...permData, reason: e.target.value})} />
          </div>
          <button type="submit" className="filter-btn" style={{marginTop: '10px', width: '100%', backgroundColor: '#0ea5e9'}}>Submit Permission</button>
        </form>
      )}

      {isAdmin && (
        <div style={{marginTop: '30px'}}>
          <h3>Manage Employee Requests</h3>
          <table className="attendance-table" style={{ background: '#1e293b', width: '100%' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{padding: '10px'}}>Employee</th><th>Period</th><th>Type</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allEmployeeLeaves.filter(l => l.status === 'Pending').map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{padding: '10px'}}>{l.employees?.name || l.employee_id}</td>
                  <td>{l.start_date} {l.start_date !== l.end_date ? `to ${l.end_date}` : ""}</td>
                  <td>{l.leave_type}</td>
                  <td>
                    <button onClick={() => handleAdminLeaveAction(l.id, 'Approved')} style={{color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}>✔</button>
                    <button onClick={() => handleAdminLeaveAction(l.id, 'Rejected')} style={{color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '10px'}}>✖</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ marginTop: '30px' }}>History Logs (Attendance & Leaves)</h3>
      <table className="attendance-table" style={{ width: '100%', background: 'rgba(30, 41, 59, 0.7)', borderCollapse: 'collapse', overflow: 'hidden', borderRadius: '12px' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
            <th style={{ padding: '15px', textAlign: 'left' }}>DATE / PERIOD</th>
            <th style={{textAlign: 'left'}}>TYPE</th>
            <th style={{textAlign: 'left'}}>SIGN IN / OUT</th>
            <th style={{textAlign: 'left'}}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Loading records...</td></tr>
          ) : (
            <>
              {leaves.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #334155', color: '#e2e8f0' }}>
                  <td style={{ padding: '15px' }}>{l.start_date} {l.start_date !== l.end_date ? `to ${l.end_date}` : ""}</td>
                  <td>{l.leave_type}</td>
                  <td style={{ fontStyle: 'italic', color: '#94a3b8' }}>{l.reason}</td>
                  <td>
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', ...getStatusStyle(l.status) }}>
                      {l.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {records.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '15px' }}>{rec.date}</td>
                  <td>Attendance</td>
                  <td>
                    In: {rec.check_in} | Out: {rec.check_out || "Ongoing"}
                  </td>
                  <td>
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6' }}>
                      PRESENT
                    </span>
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}