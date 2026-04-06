import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase";
import "./admin.css";
import AdminAttendance from "./AdminAttendance";
import AdminPayroll from "./AdminPayroll";

/**
 * Admin Dashboard Component - CEREVYN
 */
export default function AdminDashboard({
  user,
  onLogout,
  employees: propEmployees,
  setEmployees: propSetEmployees,
  tasks: propTasks,
  setTasks: propSetTasks,
}) {
  // --- Core State Management ---
  const [localEmployees, setLocalEmployees] = useState([]);
  const [localTasks, setLocalTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [leaves, setLeaves] = useState([]);
  // Fixed: Removed 'leaveLoading' variable since it was unused and causing build errors
  const [, setLeaveLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);

  const [configDept, setConfigDept] = useState("");
  const [configSalary, setConfigSalary] = useState("");

  const employees = propEmployees ?? localEmployees;
  const setEmployees = propSetEmployees ?? setLocalEmployees;
  const tasks = propTasks ?? localTasks;
  const setTasks = propSetTasks ?? setLocalTasks;

  const initialFetchDone = useRef(false);

  // --- State for Form Data ---
  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", email: "",
    employeeId: "", department: "", designation: "",
    phone: "", joiningDate: "", status: "Active",
    base_salary: "", address: "",
    bankName: "", bankAccount: "", ifscCode: "", 
    panNo: "", adharNumber: "",
    emergencyContact: "", relation: "", docUrl: "" 
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");

  // --- DATABASE FUNCTIONS ---

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("employees").select("*").order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setEmployees(data.map((emp) => ({
          ...emp,
          id: emp.id,
          firstName: emp.first_name || '',
          middleName: emp.middle_name || '',
          lastName: emp.last_name || '',
          email: emp.email,
          employeeId: emp.employee_id,
          department: emp.department || 'Not assigned',
          designation: emp.designation || 'Not assigned',
          phone: emp.phone || 'Not provided',
          joiningDate: emp.joining_date || emp.join_date,
          status: emp.status || 'Active',
          base_salary: emp.base_salary || 0,
          bankName: emp.bank_name || '',
          bankAccount: emp.bank_account || '',
          ifscCode: emp.ifsc_code || '',
          panNo: emp.pan_no || '',
          adharNumber: emp.adhar_number || '',
          emergencyContact: emp.emergency_contact || '', 
          relation: emp.relation || '',                  
          docUrl: emp.doc_url || '',                     
          fullName: `${emp.first_name} ${emp.last_name}`.trim(),
        })));
      }
    } catch (err) { console.error(err.message); } finally { setLoading(false); }
  }, [setEmployees]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("tasks").select("*").order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setTasks(data.map(task => ({
          id: task.id, title: task.title, employeeId: task.employee_id,
          status: task.status || 'pending', priority: task.priority || 'Medium',
          feedback: task.employee_comments || "No feedback",
          report_url: task.report_url, github_link: task.github_link,
          startDate: task.start_date, dueDate: task.due_date, created_at: task.created_at,
        })));
      }
    } catch (err) { console.error(err.message); }
  }, [setTasks]);

  const fetchLeaves = useCallback(async () => {
    try {
      setLeaveLoading(true);
      const { data, error } = await supabase.from("leaves").select(`*, employees(first_name, last_name)`).order('created_at', { ascending: false });
      if (error) throw error;
      setLeaves(data || []);
    } catch (err) { console.error(err.message); } finally { setLeaveLoading(false); }
  }, []);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchEmployees(); fetchTasks(); fetchLeaves();
    }
  }, [fetchEmployees, fetchTasks, fetchLeaves]);

  // --- HANDLERS ---

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const uploadDocument = async () => {
    if (!selectedFile) return formData.docUrl || null; 
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${formData.employeeId || Date.now()}_doc.${fileExt}`;
      const filePath = `documents/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('employee-docs').upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('employee-docs').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload failed:", err.message);
      return formData.docUrl || null;
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "", middleName: "", lastName: "", email: "",
      employeeId: "", department: "", designation: "",
      phone: "", joiningDate: "", status: "Active", base_salary: "",
      bankName: "", bankAccount: "", ifscCode: "", panNo: "", adharNumber: "",
      emergencyContact: "", relation: "", docUrl: ""
    });
    setSelectedFile(null);
    setIsEditing(false); setCurrentEditId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!formData.firstName || !formData.email) return alert("Fill required fields!");
    setLoading(true);
    const finalDocUrl = await uploadDocument(); 
    isEditing ? await updateEmployee(finalDocUrl) : await addEmployee(finalDocUrl);
    setLoading(false);
  };

  const addEmployee = async (finalDocUrl) => {
    try {
      const { error: empError } = await supabase.from("employees").insert([{
        first_name: formData.firstName, 
        middle_name: formData.middleName, 
        last_name: formData.lastName,
        email: formData.email, 
        employee_id: formData.employeeId, 
        department: formData.department,
        designation: formData.designation, 
        phone: formData.phone, 
        joining_date: formData.joiningDate,
        status: formData.status, 
        base_salary: formData.base_salary,
        bank_name: formData.bankName,
        bank_account: formData.bankAccount, 
        ifsc_code: formData.ifscCode,
        pan_no: formData.panNo,
        adhar_number: formData.adharNumber,
        emergency_contact: formData.emergencyContact, 
        relation: formData.relation, 
        doc_url: finalDocUrl 
      }]);
      if (empError) throw empError;

      await supabase.from("users").insert([{
        name: `${formData.firstName} ${formData.lastName}`, 
        email: formData.email,
        password: "emp@123", 
        role: "employee"
      }]);

      alert("Employee added successfully!");
      fetchEmployees(); resetForm(); setActiveTab("employeeList");
    } catch (err) { alert(err.message); }
  };

  const updateEmployee = async (finalDocUrl) => {
    try {
      const { error } = await supabase.from("employees").update({
        first_name: formData.firstName, 
        middle_name: formData.middleName, 
        last_name: formData.lastName,
        email: formData.email, 
        employee_id: formData.employeeId, 
        department: formData.department,
        designation: formData.designation, 
        phone: formData.phone, 
        status: formData.status,
        base_salary: formData.base_salary, 
        bank_name: formData.bankName,
        bank_account: formData.bankAccount, 
        ifsc_code: formData.ifscCode,
        pan_no: formData.panNo,
        adhar_number: formData.adharNumber,
        emergency_contact: formData.emergencyContact, 
        relation: formData.relation, 
        doc_url: finalDocUrl 
      }).eq("id", currentEditId);

      if (error) throw error;
      alert("Employee updated!");
      fetchEmployees(); resetForm(); setActiveTab("employeeList");
    } catch (err) { alert(err.message); }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm("Permanently remove employee?")) {
      await supabase.from("employees").delete().eq("id", id);
      fetchEmployees();
    }
  };

  const handleLeaveAction = async (id, newStatus) => {
    try {
      const { error } = await supabase.from("leaves").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      alert(`Leave ${newStatus}!`);
      fetchLeaves();
    } catch (err) { alert(err.message); }
  };

  const handleEmployeeToggle = (id) => {
    selectedEmployeeIds.includes(id) 
      ? setSelectedEmployeeIds(selectedEmployeeIds.filter(empId => empId !== id))
      : setSelectedEmployeeIds([...selectedEmployeeIds, id]);
  };

  const assignBulkTasks = async () => {
    if (!taskTitle || selectedEmployeeIds.length === 0) return alert("Task title and recipients required!");
    try {
      const taskEntries = selectedEmployeeIds.map(empId => ({
        title: taskTitle, employee_id: empId, status: "pending",
        priority: taskPriority, start_date: startDate, due_date: dueDate
      }));
      const { error } = await supabase.from("tasks").insert(taskEntries);
      if (error) throw error;
      alert("Tasks assigned!");
      setTaskTitle(""); setSelectedEmployeeIds([]); setStartDate(""); setDueDate(""); fetchTasks();
    } catch (err) { alert(err.message); }
  };

  const deleteTask = async (id) => {
    if (window.confirm("Delete task?")) {
      await supabase.from("tasks").delete().eq("id", id);
      fetchTasks();
    }
  };

  const saveSalaryConfig = async () => {
    if (!configDept || !configSalary) return alert("Please select department and enter amount");
    try {
      const { error } = await supabase
        .from("salary_configs")
        .upsert({ department: configDept, base_salary: configSalary }, { onConflict: 'department' });
      if (error) throw error;
      alert(`Salary configuration for ${configDept} saved!`);
      setConfigDept(""); setConfigSalary("");
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="admin-container">
      <div className="sidebar">
        <div className="brand-section" style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', textAlign: 'center' }}>
            <h1 style={{ color: '#00d2ff', fontSize: '28px', margin: 0, fontWeight: '800', letterSpacing: '1px' }}>CEREVYN</h1>
            <p style={{ color: '#888', fontSize: '10px', margin: '5px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Admin Portal</p>
        </div>

        <ul className="nav-links">
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</li>
          <li className={activeTab === "addEmployee" ? "active" : ""} onClick={() => { setActiveTab("addEmployee"); resetForm(); }}>Add Employee</li>
          <li className={activeTab === "employeeList" ? "active" : ""} onClick={() => setActiveTab("employeeList")}>Employee List</li>
          <li className={activeTab === "tasks" ? "active" : ""} onClick={() => setActiveTab("tasks")}>Tasks</li>
          <li className={activeTab === "attendance" ? "active" : ""} onClick={() => setActiveTab("attendance")}>Sign-In Monitor</li>
          <li className={activeTab === "leaves" ? "active" : ""} onClick={() => setActiveTab("leaves")}>Leave Requests</li>
          <li className={activeTab === "payroll" ? "active" : ""} onClick={() => setActiveTab("payroll")}>Payroll Management</li>
          <li className={activeTab === "salaryConfig" ? "active" : ""} onClick={() => setActiveTab("salaryConfig")}>Salary Settings</li>
        </ul>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="main-area">
        <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <h3 style={{ margin: 0 }}>Welcome back, {user?.name || "Administrator"}</h3>
             <span style={{ fontSize: '11px', color: '#00d2ff', fontWeight: 'bold' }}>CEREVYN CLOUD SYSTEMS</span>
          </div>
          <div className="stats-summary">
            <span>👥 {employees.length} Employees</span>
            <span>📝 {tasks.length} Tasks</span>
            <span>✉️ {leaves.filter(l => l.status === "Pending").length} Leaves</span>
          </div>
        </div>

        <div className="content">
          {loading ? (
            <div className="loading-state"><p>Syncing with Database...</p></div>
          ) : (
            <React.Fragment>
              {activeTab === "dashboard" && (
                <div className="dashboard-wrapper">
                  <h2 className="dashboard-title">Operational Overview</h2>
                  <div className="dashboard-stats">
                    <div className="stat-box blue"><div className="stat-icon">👥</div><span>Total Workforce</span><h3>{employees.length}</h3></div>
                    <div className="stat-box purple"><div className="stat-icon">📝</div><span>Active Tasks</span><h3>{tasks.length}</h3></div>
                    <div className="stat-box green"><div className="stat-icon">✉️</div><span>Pending Leaves</span><h3>{leaves.filter(l => l.status === "Pending").length}</h3></div>
                  </div>
                </div>
              )}

              {activeTab === "addEmployee" && (
                <div className="professional-form">
                  <h2>{isEditing ? "Modify Employee Records" : "Register New Staff Member"}</h2>
                  
                  <div className="grid-3">
                    <input name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} />
                    <input name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleChange} />
                    <input name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} />
                  </div>
                  
                  <div className="grid-2">
                    <input name="email" placeholder="Email *" value={formData.email} onChange={handleChange} />
                    <input name="employeeId" placeholder="Employee ID" value={formData.employeeId} onChange={handleChange} />
                  </div>

                  <div className="grid-2">
                    <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} />
                    <input name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} />
                  </div>

                  <div className="grid-3">
                    <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                    <input name="adharNumber" placeholder="Aadhar Number" value={formData.adharNumber} onChange={handleChange} />
                    <input name="panNo" placeholder="PAN Number" value={formData.panNo} onChange={handleChange} />
                  </div>

                  <div className="grid-3">
                    <input name="bankName" placeholder="Bank Name" value={formData.bankName} onChange={handleChange} />
                    <input name="bankAccount" placeholder="Bank Account No." value={formData.bankAccount} onChange={handleChange} />
                    <input name="ifscCode" placeholder="IFSC Code" value={formData.ifscCode} onChange={handleChange} />
                  </div>

                  <div className="grid-2">
                    <input name="base_salary" type="number" placeholder="Base Salary (₹)" value={formData.base_salary} onChange={handleChange} />
                    <input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} title="Joining Date" />
                  </div>

                  <div style={{ padding: '15px', background: 'rgba(0, 210, 255, 0.05)', borderRadius: '8px', border: '1px dashed #00d2ff', marginTop: '20px' }}>
                    <h4 style={{ color: '#00d2ff', marginBottom: '10px' }}>Emergency Contact & Documentation</h4>
                    <div className="grid-2">
                      <input name="emergencyContact" placeholder="Emergency Phone Number" value={formData.emergencyContact} onChange={handleChange} />
                      <input name="relation" placeholder="Relation (e.g., Father, Spouse)" value={formData.relation} onChange={handleChange} />
                    </div>
                    <div style={{ marginTop: '15px' }}>
                      <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>
                        Upload Identification Document (Aadhar/PAN - Image or PDF)
                      </label>
                      <input type="file" onChange={handleFileChange} style={{ background: 'transparent', padding: '10px 0' }} />
                      {formData.docUrl && <p style={{ fontSize: '11px', color: '#28a745' }}>Current: <a href={formData.docUrl} target="_blank" rel="noreferrer">View Uploaded Doc</a></p>}
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: '20px' }}>
                    <button className="primary-btn" onClick={handleAddOrUpdate}>{isEditing ? "Update Records" : "Enroll Member"}</button>
                    {isEditing && <button className="secondary-btn" onClick={resetForm}>Cancel</button>}
                  </div>
                </div>
              )}

              {activeTab === "employeeList" && (
                <div className="table-card">
                  <h2>Employee Corporate Directory</h2>
                  <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Dept</th>
                        <th>Emergency Contact</th>
                        <th>ID Document</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => (
                        <tr key={emp.id}>
                          <td>{emp.employeeId}</td>
                          <td>
                             <div style={{fontWeight: 'bold'}}>{emp.fullName}</div>
                             <div style={{fontSize: '11px', color: '#888'}}>{emp.email}</div>
                          </td>
                          <td>{emp.department}</td>
                          <td>
                            <div style={{fontSize: '12px'}}>{emp.emergencyContact || 'N/A'}</div>
                            <div style={{fontSize: '10px', color: '#00d2ff'}}>{emp.relation}</div>
                          </td>
                          <td>
                            {emp.docUrl ? (
                              <a href={emp.docUrl} target="_blank" rel="noreferrer" style={{color: '#28a745', textDecoration: 'underline', fontSize: '12px'}}>
                                📄 View Document
                              </a>
                            ) : <span style={{color: '#777', fontSize: '11px'}}>No File</span>}
                          </td>
                          <td><span className={`status-badge ${emp.status.toLowerCase()}`}>{emp.status}</span></td>
                          <td>
                            <button className="edit-btn-small" onClick={() => { setFormData(emp); setCurrentEditId(emp.id); setIsEditing(true); setActiveTab("addEmployee"); }}>Edit</button>
                            <button className="delete-btn-small" onClick={() => deleteEmployee(emp.id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="tasks-section">
                  <div className="table-card bulk-assign-form">
                    <h2>Bulk Task Allocation Engine</h2>
                    <div className="task-assignment-grid">
                      <div className="form-left">
                        <input placeholder="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                        <div className="grid-2" style={{gap: '10px', marginTop: '10px'}}>
                          <input type="date" title="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                          <input type="date" title="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                        <select style={{marginTop: '10px'}} value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                          <option value="Low">Low Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="High">High Priority</option>
                        </select>
                        <button className="primary-btn" style={{width: '100%', marginTop: '15px'}} onClick={assignBulkTasks}>
                           Assign to {selectedEmployeeIds.length} Selected Staff
                        </button>
                      </div>
                      <div className="form-right employee-picker">
                        <h4>Select Recipients:</h4>
                        <div className="employee-checklist">
                          {employees.map(emp => (
                            <label key={emp.id} className="check-item">
                              <input type="checkbox" checked={selectedEmployeeIds.includes(emp.id)} onChange={() => handleEmployeeToggle(emp.id)} />
                              {emp.fullName} <span className="muted">({emp.department})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-card" style={{marginTop: "20px"}}>
                    <h2>Task Progress & Submissions</h2>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Task</th><th>Assignee</th><th>Timeline</th><th>Submissions</th><th>Comments</th><th>Status</th><th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map(task => {
                            const owner = employees.find(e => e.id === task.employeeId);
                            return (
                              <tr key={task.id}>
                                <td><strong>{task.title}</strong></td>
                                <td>{owner?.fullName || "Staff Removed"}</td>
                                <td>
                                  <div style={{fontSize: '11px'}}>S: {task.startDate || '--'}</div>
                                  <div style={{fontSize: '11px', color: '#d9534f'}}>D: {task.dueDate || '--'}</div>
                                </td>
                                <td>
                                  <div className="submission-links" style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                    {task.report_url ? (
                                      <a href={task.report_url} target="_blank" rel="noopener noreferrer" 
                                          style={{ color: '#28a745', textDecoration: 'underline', fontWeight: 'bold', fontSize: '12px' }}>
                                          📄 View Report
                                      </a>
                                    ) : <span style={{color: '#777', fontSize: '11px'}}>No Report</span>}
                                    
                                    {task.github_link ? (
                                      <a href={task.github_link.startsWith('http') ? task.github_link : `https://${task.github_link}`} 
                                          target="_blank" rel="noopener noreferrer"
                                          style={{ color: '#00d2ff', textDecoration: 'underline', fontWeight: 'bold', fontSize: '12px' }}>
                                          🔗 Git Repo
                                      </a>
                                    ) : <span style={{color: '#777', fontSize: '11px'}}>No Git Link</span>}
                                  </div>
                                </td>
                                <td><i style={{fontSize: '12px'}}>{task.feedback}</i></td>
                                <td><span className={`status-badge ${task.status}`}>{task.status}</span></td>
                                <td><button className="delete-btn-small" onClick={() => deleteTask(task.id)}>Remove</button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "attendance" && <AdminAttendance />}
              {activeTab === "payroll" && <AdminPayroll allEmployees={employees} />}
              {activeTab === "leaves" && (
                <div className="table-card">
                    <h2>Leave Requests</h2>
                    <table>
                      <thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {leaves.map(l => (
                          <tr key={l.id}>
                            <td>{l.employees?.first_name} {l.employees?.last_name}</td>
                            <td>{l.leave_type}</td>
                            <td>{l.start_date}</td>
                            <td>{l.end_date}</td>
                            <td><span className={`status-badge ${l.status.toLowerCase()}`}>{l.status}</span></td>
                            <td>
                              {l.status === "Pending" && (
                                <><button className="edit-btn-small" onClick={() => handleLeaveAction(l.id, "Approved")}>Approve</button>
                                <button className="delete-btn-small" onClick={() => handleLeaveAction(l.id, "Rejected")}>Reject</button></>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}

              {activeTab === "salaryConfig" && (
                <div className="table-card">
                  <h2>Salary Rules</h2>
                  <div className="professional-form">
                    <select value={configDept} onChange={(e) => setConfigDept(e.target.value)}>
                      <option value="">Department</option>
                      <option value="IT">IT</option><option value="HR">HR</option>
                    </select>
                    <input type="number" placeholder="Base Salary" value={configSalary} onChange={(e) => setConfigSalary(e.target.value)} />
                    <button className="primary-btn" onClick={saveSalaryConfig}>Update</button>
                  </div>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}