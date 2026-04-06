import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import Sidebar from "./sidebar";
import Topbar from "./Topbar";
import Attendance from "./Attendance"; 
import Payroll from "./Payroll";      
import "./employee.css";

export default function EmployeeDashboard({ user, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [dbUser, setDbUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  // --- Notification States ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Profile States ---
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    aadhar: "",
    pan_number: "", 
    bank_name: "", // Added Bank Name
    bank_account_no: "",
    ifsc_code: "",
    mobile: "",
    department: "",
    designation: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    id_document_url: "", 
    newPassword: ""
  });

  // --- Task Update States ---
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false); 
  const [taskUpdateData, setTaskUpdateData] = useState({
    status: "",
    github_link: "",
    report_url: "", 
    employee_comments: ""
  });

  // --- Leave Stats ---
  const [daysUsed, setDaysUsed] = useState(0);
  const totalAllowedLeaves = 24;

  /* ================= INITIALIZATION ================= */
  const initializeDashboard = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("email", user.email)
        .single();

      if (empError || !empData) {
        console.error("Employee not found");
        return;
      }

      setDbUser(empData); 
      
      // Mapping DB columns to Form State
      setEditFormData({
        aadhar: empData.adhar_number || "", 
        pan_number: empData.pan_no || "", // Matches 'pan_no' in your DB
        bank_name: empData.bank_name || "", // Matches 'bank_name' in your DB
        bank_account_no: empData.bank_account || "", 
        ifsc_code: empData.ifsc_code || "",
        mobile: empData.phone || "", 
        department: empData.department || "",
        designation: empData.designation || "",
        emergency_contact_name: empData.relation || "", 
        emergency_contact_phone: empData.emergency_contact || "", 
        id_document_url: empData.doc_url || "", // Matches 'doc_url' in your DB
        newPassword: ""
      });

      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("employee_id", empData.id)
        .order("created_at", { ascending: false });

      setTasks(taskData || []);
      fetchNotifications(empData.id);
      fetchLeaveStats(empData.id);

    } catch (err) {
      console.error("Init Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user.email]);

  const fetchNotifications = async (empId) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("employee_id", empId)
      .order("created_at", { ascending: false });
      
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const fetchLeaveStats = async (empId) => {
    const { data } = await supabase
      .from("leaves")
      .select("start_date, end_date")
      .eq("employee_id", empId)
      .eq("status", "Approved");
      
    if (data) {
      const used = data.reduce((acc, l) => {
        const diff = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        return acc + (diff > 0 ? diff : 0);
      }, 0);
      setDaysUsed(used);
    }
  };

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications(dbUser.id);
  };

  useEffect(() => { initializeDashboard(); }, [initializeDashboard]);

  /* ================= FILE UPLOAD (ID DOCUMENTS) ================= */
  const handleIdDocumentUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `id_docs/${dbUser.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-docs') 
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-docs')
        .getPublicUrl(fileName);

      setEditFormData({ ...editFormData, id_document_url: publicUrl });
      alert("Document uploaded! Remember to click 'Save All Changes'.");

    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  /* ================= PROFILE UPDATE ================= */
  const handleProfileUpdate = async () => {
    try {
      setUploading(true);
      
      if (editFormData.newPassword) {
        if (editFormData.newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            setUploading(false);
            return;
        }
        await supabase.auth.updateUser({ password: editFormData.newPassword });
      }

      const { error } = await supabase
        .from("employees")
        .update({
          adhar_number: editFormData.aadhar,
          pan_no: editFormData.pan_number, // Corrected column name
          bank_name: editFormData.bank_name, // Added field
          bank_account: editFormData.bank_account_no,
          ifsc_code: editFormData.ifsc_code,
          phone: editFormData.mobile, 
          department: editFormData.department,
          designation: editFormData.designation,
          relation: editFormData.emergency_contact_name,
          emergency_contact: editFormData.emergency_contact_phone,
          doc_url: editFormData.id_document_url // Corrected column name
        })
        .eq("id", dbUser.id);

      if (error) throw error;
      alert("Profile updated successfully! ✅");
      setIsEditing(false);
      initializeDashboard();
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setUploading(false); 
    }
  };

  /* ================= TASK UPDATE LOGIC ================= */
  const startTaskUpdate = (task) => {
    setUpdatingTaskId(task.id);
    setTaskUpdateData({
      status: task.status,
      github_link: task.github_link || "",
      report_url: task.report_url || "",
      employee_comments: task.employee_comments || ""
    });
  };

  const handleFileUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${dbUser.id}_${Date.now()}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-reports')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task-reports')
        .getPublicUrl(filePath);

      setTaskUpdateData({ ...taskUpdateData, report_url: publicUrl });
      alert("Task report file uploaded!");

    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleTaskSubmit = async (taskId) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: taskUpdateData.status,
          github_link: taskUpdateData.github_link,
          report_url: taskUpdateData.report_url,
          employee_comments: taskUpdateData.employee_comments
        })
        .eq("id", taskId);

      if (error) throw error;
      alert("Task progress submitted! 🚀");
      setUpdatingTaskId(null);
      initializeDashboard(); 
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading" style={{color: 'white', padding: '20px', textAlign: 'center', marginTop: '100px'}}>Loading secure dashboard...</div>;

  return (
    <div className="emp-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000' }}>
      
      <Sidebar 
        active={active} 
        setActive={setActive} 
        onLogout={onLogout} 
        unreadCount={unreadCount} 
        role="Employee" 
      />

      <div className="main-area" style={{ 
        flex: 1, 
        marginLeft: '260px', 
        width: 'calc(100% - 260px)',
        minHeight: '100vh' 
      }}>
        <Topbar user={dbUser || user} onLogout={onLogout} setActive={setActive} unreadCount={unreadCount} />

        <div className="content" style={{ padding: '30px' }}>
          
          {/* DASHBOARD TAB */}
          {active === "dashboard" && (
            <div className="dashboard-wrapper animate-in">
              <h2 className="dashboard-title" style={{color: 'white', marginBottom: '25px'}}>Welcome Back, {dbUser?.first_name} 👋</h2>
              
              <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div className="stat-box blue"><span>Total Tasks</span><h3>{tasks.length}</h3></div>
                <div className="stat-box green"><span>Ongoing</span><h3>{tasks.filter(t => t.status === "ongoing").length}</h3></div>
                <div className="stat-box purple" onClick={() => setActive("notifications")} style={{cursor:'pointer'}}>
                    <span>Unread Alerts</span><h3>{unreadCount}</h3>
                </div>
              </div>

              <h3 style={{ color: 'white', marginBottom: '20px' }}>Leave Status (Annual)</h3>
              <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="stat-box" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{color: '#888'}}>Total Quota</span><h3>{totalAllowedLeaves}</h3>
                </div>
                <div className="stat-box" style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.2)' }}>
                  <span style={{ color: '#ff4d4d' }}>Days Taken</span><h3>{daysUsed}</h3>
                </div>
                <div className="stat-box" style={{ background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                  <span style={{ color: '#00d2ff' }}>Balance</span><h3>{totalAllowedLeaves - daysUsed}</h3>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {active === "notifications" && (
            <div className="notification-section animate-in">
              <h2 className="dashboard-title" style={{color: 'white', marginBottom: '20px'}}>Notifications</h2>
              <div className="notification-list">
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} className={`glass-card noti-card ${!n.is_read ? 'unread' : ''}`} onClick={() => markAsRead(n.id)} style={{ marginBottom: '15px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <strong style={{color: !n.is_read ? '#38bdf8' : 'white'}}>{n.title}</strong>
                      <span style={{fontSize:'12px', color:'#888'}}>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{marginTop:'10px', color:'#ccc', fontSize: '14px'}}>{n.message}</p>
                    {!n.is_read && <div style={{ width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', marginTop: '10px' }}></div>}
                  </div>
                )) : <div className="glass-card" style={{color: '#888', padding: '40px', textAlign: 'center'}}>No notifications found.</div>}
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {active === "tasks" && (
            <div className="task-section animate-in">
              <h2 className="dashboard-title" style={{color: 'white', marginBottom: '20px'}}>Assigned Deliverables</h2>
              <div className="task-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {tasks.length > 0 ? tasks.map(t => (
                  <div key={t.id} className="glass-card task-item" style={{ padding: '25px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', 
                        background: t.priority === 'High' ? '#ff4d4d' : t.priority === 'Medium' ? '#ffa500' : '#28a745', color: 'white', textTransform: 'uppercase'
                      }}>
                        {t.priority || "Medium"}
                      </span>
                      <span style={{color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'}}>{t.status}</span>
                    </div>
                    <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '18px' }}>{t.title}</h3>
                    <p style={{color: '#aaa', fontSize: '14px', marginBottom: '20px'}}>{t.description}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                      <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                        <span style={{ color: '#00d2ff' }}>Assigned:</span> {t.start_date || "N/A"}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                        <span style={{ color: '#ff4d4d' }}>Due Date:</span> {t.due_date || "Flexible"}
                      </p>
                    </div>

                    <div className="task-actions">
                      {updatingTaskId === t.id ? (
                        <div className="update-form animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <select 
                            className="input-field" 
                            value={taskUpdateData.status} 
                            onChange={e => setTaskUpdateData({...taskUpdateData, status: e.target.value})}
                            style={{ padding: '10px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                          </select>
                          <input 
                            placeholder="GitHub/Link URL" 
                            className="input-field" 
                            value={taskUpdateData.github_link} 
                            onChange={e => setTaskUpdateData({...taskUpdateData, github_link: e.target.value})}
                            style={{ padding: '10px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                          />
                          <div style={{background: '#111', padding: '10px', border: '1px dashed #444', borderRadius: '4px'}}>
                             <label style={{color: '#888', fontSize: '11px', display: 'block', marginBottom: '5px'}}>Upload Document/Report</label>
                             <input type="file" onChange={handleFileUpload} disabled={isUploadingFile} style={{color: 'white', fontSize: '12px'}} />
                          </div>
                          <textarea 
                            placeholder="Add your comments..." 
                            className="input-field" 
                            value={taskUpdateData.employee_comments} 
                            onChange={e => setTaskUpdateData({...taskUpdateData, employee_comments: e.target.value})} 
                            style={{ padding: '10px', background: '#111', color: 'white', border: '1px solid #333', minHeight: '80px', borderRadius: '4px' }}
                          />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="submit-btn" style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', flex: 1, fontWeight: 'bold' }} onClick={() => handleTaskSubmit(t.id)} disabled={isUploadingFile}>Submit</button>
                            <button className="submit-btn" style={{ background: '#444', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', flex: 1 }} onClick={() => setUpdatingTaskId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="submit-btn" style={{ width: '100%', padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '4px', fontWeight: 'bold', color: '#000' }} onClick={() => startTaskUpdate(t)}>Update Progress</button>
                      )}
                    </div>
                  </div>
                )) : <p className="glass-card" style={{color: '#888', padding: '40px', textAlign: 'center'}}>No tasks currently assigned.</p>}
              </div>
            </div>
          )}

          {/* ATTENDANCE & PAYROLL */}
          {active === "attendance" && <Attendance user={dbUser} />}
          {active === "payroll" && <Payroll user={dbUser} />}

          {/* PROFILE TAB */}
          {active === "profile" && (
            <div className="profile-container animate-in">
              <div className="glass-card profile-header" style={{display:'flex', alignItems:'center', gap:'25px', padding:'30px', marginBottom:'25px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)'}}>
                <div className="profile-avatar" style={{width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg, #38bdf8, #818cf8)', display:'flex', alignItems:'center', justifyContent:'center', color:'#000', fontWeight:'bold', fontSize: '32px'}}>
                  {dbUser?.first_name?.charAt(0)}
                </div>
                <div style={{flex:1}}>
                  <h2 style={{margin:0, color: 'white', fontSize: '28px'}}>{dbUser?.first_name} {dbUser?.middle_name || ""} {dbUser?.last_name}</h2>
                  <p style={{color:'#38bdf8', fontWeight:'bold', marginTop: '5px', letterSpacing: '1px'}}>EMPLOYEE ID: {dbUser?.employee_id || dbUser?.id}</p>
                </div>
                {!isEditing ? (
                  <button className="submit-btn" style={{width:'auto', padding: '12px 30px', background: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '6px', fontWeight: 'bold'}} onClick={() => setIsEditing(true)}>Edit Profile</button>
                ) : (
                  <button className="submit-btn" style={{width:'auto', background:'#28a745', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', fontWeight: 'bold'}} onClick={handleProfileUpdate} disabled={uploading}>
                    {uploading ? "Updating..." : "Save All Changes"}
                  </button>
                )}
              </div>
              
              <div className="profile-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px'}}>
                  <div className="glass-card" style={{padding:'25px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)'}}>
                    <h3 style={{color:'#38bdf8', borderBottom:'1px solid #333', marginBottom:'20px', paddingBottom: '12px', fontSize: '18px'}}>Employment Information</h3>
                    
                    <div style={{marginBottom: '20px'}}>
                        <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Designation</p>
                        <p style={{color: 'white', fontSize: '16px', fontWeight: '500'}}>{dbUser?.designation || "Executive"}</p>
                    </div>

                    <div style={{marginBottom: '20px'}}>
                        <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Department</p>
                        {isEditing ? (
                          <input className="input-field" value={editFormData.department} onChange={e => setEditFormData({...editFormData, department: e.target.value})} style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '10px', borderRadius: '4px'}} />
                        ) : (
                          <p style={{color: 'white', fontSize: '16px'}}>{dbUser?.department || "General Operations"}</p>
                        )}
                    </div>

                    <div style={{marginBottom: '20px'}}>
                        <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Date of Joining</p>
                        <p style={{color: 'white', fontSize: '16px'}}>{dbUser?.joining_date || "N/A"}</p>
                    </div>

                    <div>
                        <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Base Pay (Monthly)</p>
                        <p style={{color: '#28a745', fontSize: '20px', fontWeight: 'bold'}}>₹{dbUser?.base_salary?.toLocaleString() || "0"}</p>
                    </div>
                  </div>

                  <div className="glass-card" style={{padding:'25px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)'}}>
                    <h3 style={{color:'#38bdf8', borderBottom:'1px solid #333', marginBottom:'20px', paddingBottom: '12px', fontSize: '18px'}}>Identity & Verification</h3>
                    
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom: '20px'}}>
                        <div>
                            <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Aadhar Card</p>
                            {isEditing ? <input className="input-field" value={editFormData.aadhar} onChange={e => setEditFormData({...editFormData, aadhar: e.target.value})} style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '8px'}} /> : <p style={{color: 'white', letterSpacing: '1px'}}>{dbUser?.adhar_number || "xxxx-xxxx-xxxx"}</p>}
                        </div>
                        <div>
                            <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>PAN Card</p>
                            {isEditing ? <input className="input-field" value={editFormData.pan_number} onChange={e => setEditFormData({...editFormData, pan_number: e.target.value})} style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '8px'}} /> : <p style={{color: 'white', textTransform: 'uppercase'}}>{dbUser?.pan_no || "ABCDE1234F"}</p>}
                        </div>
                    </div>

                    <div style={{marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)'}}>
                        <p style={{color: '#888', fontSize: '12px', marginBottom: '10px'}}>Digital ID Document (PDF/Image)</p>
                        {isEditing ? (
                            <input type="file" accept="image/*,.pdf" onChange={handleIdDocumentUpload} style={{color:'white', fontSize:'12px'}} />
                        ) : (
                            dbUser?.doc_url ? (
                                <a href={dbUser.doc_url} target="_blank" rel="noreferrer" style={{color: '#38bdf8', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    📄 View Verification Document
                                </a>
                            ) : <p style={{color: '#ff4d4d', fontSize: '13px', margin: 0}}>⚠️ No document uploaded</p>
                        )}
                    </div>
                    
                    <div style={{marginBottom: '20px'}}>
                        <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Primary Mobile</p>
                        {isEditing ? <input className="input-field" value={editFormData.mobile} onChange={e => setEditFormData({...editFormData, mobile: e.target.value})} style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '10px'}} /> : <p style={{color: 'white'}}>{dbUser?.phone || "N/A"}</p>}
                    </div>

                    <div style={{marginBottom: '20px'}}>
                        <p style={{color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Settlement Bank Details</p>
                        {isEditing ? (
                            <div style={{display:'flex', flexDirection: 'column', gap: '10px'}}>
                                <input className="input-field" placeholder="Bank Name" value={editFormData.bank_name} onChange={e => setEditFormData({...editFormData, bank_name: e.target.value})} style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '10px'}} />
                                <div style={{display:'flex', gap:'10px'}}>
                                  <input className="input-field" placeholder="Account No" value={editFormData.bank_account_no} onChange={e => setEditFormData({...editFormData, bank_account_no: e.target.value})} style={{flex: 2, background: '#000', color: 'white', border: '1px solid #333', padding: '10px'}} />
                                  <input className="input-field" placeholder="IFSC Code" value={editFormData.ifsc_code} onChange={e => setEditFormData({...editFormData, ifsc_code: e.target.value})} style={{flex: 1, background: '#000', color: 'white', border: '1px solid #333', padding: '10px'}} />
                                </div>
                            </div>
                        ) : (
                          <div>
                            <p style={{color: '#38bdf8', fontSize: '15px', fontWeight:'bold', margin: '0 0 5px 0'}}>{dbUser?.bank_name || "Bank Name N/A"}</p>
                            <p style={{color: 'white', fontSize: '14px'}}>{dbUser?.bank_account ? `${dbUser.bank_account} (${dbUser.ifsc_code})` : "Bank data missing"}</p>
                          </div>
                        )}
                    </div>

                    <div style={{padding: '15px', background: 'rgba(255, 77, 77, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.1)'}}>
                        <h4 style={{color:'#ff4d4d', margin: '0 0 10px 0', fontSize: '13px', textTransform: 'uppercase'}}>Emergency SOS Contact</h4>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                            <div>
                                <p style={{color: '#888', fontSize: '10px'}}>Relation/Name</p>
                                {isEditing ? <input className="input-field" value={editFormData.emergency_contact_name} onChange={e => setEditFormData({...editFormData, emergency_contact_name: e.target.value})} style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '8px'}} /> : <p style={{color: 'white', fontSize: '14px'}}>{dbUser?.relation || "N/A"}</p>}
                            </div>
                            <div>
                                <p style={{color: '#888', fontSize: '10px'}}>Contact Number</p>
                                {isEditing ? <input className="input-field" value={editFormData.emergency_contact_phone} onChange={e => setEditFormData({...editFormData, emergency_contact_phone: e.target.value})} style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '8px'}} /> : <p style={{color: 'white', fontSize: '14px'}}>{dbUser?.emergency_contact || "N/A"}</p>}
                            </div>
                        </div>
                    </div>

                    <div style={{marginTop: '25px', padding: '20px', background: 'linear-gradient(to right, rgba(56, 189, 248, 0.05), transparent)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.1)'}}>
                        <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#38bdf8'}}>Security Settings</h4>
                        <input 
                            type="password" 
                            placeholder="Enter New Password" 
                            className="input-field" 
                            value={editFormData.newPassword}
                            onChange={e => setEditFormData({...editFormData, newPassword: e.target.value})}
                            style={{width: '100%', background: '#000', color: 'white', border: '1px solid #333', padding: '12px', borderRadius: '6px'}}
                        />
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}