import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase";
import "./admin.css";

export default function AdminDashboard({
  user,
  onLogout,
  employees: propEmployees,
  setEmployees: propSetEmployees,
  tasks: propTasks,
  setTasks: propSetTasks,
}) {
  // --- State Management ---
  const [localEmployees, setLocalEmployees] = useState([]);
  const [localTasks, setLocalTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);

  // Sync with Props
  const employees = propEmployees ?? localEmployees;
  const setEmployees = propSetEmployees ?? setLocalEmployees;
  const tasks = propTasks ?? localTasks;
  const setTasks = propSetTasks ?? setLocalTasks;

  const initialFetchDone = useRef(false);

  // Form States
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    employeeId: "",
    department: "",
    designation: "",
    phone: "",
    joiningDate: "",
    status: "Active",
  });

  const [taskTitle, setTaskTitle] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState(""); 
  const [dueDate, setDueDate] = useState("");

  // --- Database Functions ---

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedData = data.map((emp) => ({
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
          fullName: `${emp.first_name} ${emp.last_name}`.trim(),
        }));
        setEmployees(mappedData);
      }
    } catch (err) {
      console.error("Fetch Employees Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [setEmployees]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setTasks(data.map(task => ({
          id: task.id,
          title: task.title,
          employeeId: task.employee_id,
          status: task.status || 'pending',
          feedback: task.employee_comments || "No feedback",
          startDate: task.start_date,
          dueDate: task.due_date,
          created_at: task.created_at,
        })));
      }
    } catch (err) {
      console.error("Fetch Tasks Error:", err.message);
    }
  }, [setTasks]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchEmployees();
      fetchTasks();
    }
  }, [fetchEmployees, fetchTasks]);

  // --- Event Handlers ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      firstName: "", middleName: "", lastName: "", email: "",
      employeeId: "", department: "", designation: "",
      phone: "", joiningDate: "", status: "Active",
    });
    setIsEditing(false);
    setCurrentEditId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!formData.firstName || !formData.email) return alert("Fill required fields!");

    if (isEditing) {
      await updateEmployee();
    } else {
      await addEmployee();
    }
  };

  const addEmployee = async () => {
    try {
      // 1. Create Employee Record
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
        status: formData.status
      }]);
      if (empError) throw empError;

      // 2. Create User Login
      await supabase.from("users").insert([{
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: "emp@123",
        role: "employee"
      }]);

      alert("Employee added and Login created!");
      fetchEmployees();
      resetForm();
      setActiveTab("employeeList");
    } catch (err) { alert(err.message); }
  };

  const updateEmployee = async () => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          email: formData.email,
          employee_id: formData.employeeId,
          department: formData.department,
          designation: formData.designation,
          phone: formData.phone,
          status: formData.status
        })
        .eq("id", currentEditId);

      if (error) throw error;
      alert("Employee details updated!");
      fetchEmployees();
      resetForm();
      setActiveTab("employeeList");
    } catch (err) { alert(err.message); }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm("Are you sure? This will remove the employee.")) {
      await supabase.from("employees").delete().eq("id", id);
      fetchEmployees();
    }
  };

  const assignTask = async () => {
    if (!taskTitle || !selectedEmployee) return alert("Missing Task details!");
    try {
      const { error } = await supabase.from("tasks").insert([{
        title: taskTitle,
        employee_id: selectedEmployee,
        status: "pending",
        start_date: startDate,
        due_date: dueDate
      }]);
      if (error) throw error;
      alert("Task Assigned!");
      setTaskTitle("");
      fetchTasks();
    } catch (err) { alert(err.message); }
  };

  const deleteTask = async (id) => {
    if (window.confirm("Delete this task?")) {
      await supabase.from("tasks").delete().eq("id", id);
      fetchTasks();
    }
  };

  // --- UI Render ---
  return (
    <div className="admin-container">
      <div className="sidebar">
        <h2 className="logo">Admin Panel</h2>
        <ul className="nav-links">
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</li>
          <li className={activeTab === "addEmployee" ? "active" : ""} onClick={() => { setActiveTab("addEmployee"); resetForm(); }}>Add Employee</li>
          <li className={activeTab === "employeeList" ? "active" : ""} onClick={() => setActiveTab("employeeList")}>Employee List</li>
          <li className={activeTab === "tasks" ? "active" : ""} onClick={() => setActiveTab("tasks")}>Tasks</li>
        </ul>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="main-area">
        <div className="topbar">
          <h3>Welcome, {user?.name || "Admin"}</h3>
          <div className="stats-summary">
            <span>👥 {employees.length} Employees</span>
            <span>📝 {tasks.length} Tasks</span>
          </div>
        </div>

        <div className="content">
          {loading ? <p>Loading Data...</p> : (
            <>
              {activeTab === "dashboard" && (
                <div className="cards">
                  <div className="card"><h3>Total Employees</h3><p>{employees.length}</p></div>
                  <div className="card"><h3>Total Tasks</h3><p>{tasks.length}</p></div>
                  <div className="card"><h3>Active Depts</h3><p>{new Set(employees.map(e => e.department)).size}</p></div>
                </div>
              )}

              {activeTab === "addEmployee" && (
                <div className="professional-form">
                  <h2>{isEditing ? "Edit Employee" : "Register New Employee"}</h2>
                  <div className="grid-3">
                    <input name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} />
                    <input name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleChange} />
                    <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
                  </div>
                  <div className="grid-2">
                    <input name="email" placeholder="Email Address *" value={formData.email} onChange={handleChange} />
                    <input name="employeeId" placeholder="Employee ID ID" value={formData.employeeId} onChange={handleChange} />
                  </div>
                  <div className="grid-2">
                    <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} />
                    <input name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} />
                  </div>
                  <div className="grid-2">
                    <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                    <input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} />
                  </div>
                  <div className="form-actions">
                    <button className="primary-btn" onClick={handleAddOrUpdate}>
                      {isEditing ? "Update Employee" : "Add Employee & Create Login"}
                    </button>
                    {isEditing && <button className="secondary-btn" onClick={resetForm}>Cancel Edit</button>}
                  </div>
                </div>
              )}

              {activeTab === "employeeList" && (
                <div className="table-card">
                  <h2>Employee Directory</h2>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Status</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp) => (
                          <tr key={emp.id}>
                            <td>{emp.employeeId}</td>
                            <td>{emp.fullName}</td>
                            <td>{emp.email}</td>
                            <td>{emp.department}</td>
                            <td><span className={`status-badge ${emp.status.toLowerCase()}`}>{emp.status}</span></td>
                            <td>
                              <button className="edit-btn-small" onClick={() => {
                                setFormData(emp);
                                setCurrentEditId(emp.id);
                                setIsEditing(true);
                                setActiveTab("addEmployee");
                              }}>Edit</button>
                              <button className="delete-btn-small" onClick={() => deleteEmployee(emp.id)}>Delete</button>
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
                  <div className="table-card">
                    <h2>Assign New Task</h2>
                    <div className="form-inline">
                      <input placeholder="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                      <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                        <option value="">Select Employee</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                      </select>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                      <button className="primary-btn" onClick={assignTask}>Assign</button>
                    </div>
                  </div>

                  <div className="table-card" style={{marginTop: "20px"}}>
                    <h2>Active Tasks</h2>
                    <table>
                      <thead>
                        <tr><th>Task</th><th>Assigned To</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {tasks.map(task => {
                          const owner = employees.find(e => e.id === task.employeeId);
                          return (
                            <tr key={task.id}>
                              <td>{task.title}</td>
                              <td>{owner?.fullName || "Deleted User"}</td>
                              <td>{task.dueDate}</td>
                              <td><span className={`status-badge ${task.status}`}>{task.status}</span></td>
                              <td><button className="delete-btn-small" onClick={() => deleteTask(task.id)}>Delete</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}