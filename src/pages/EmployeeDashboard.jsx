import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import Sidebar from "./sidebar";
import Topbar from "./Topbar";
import TaskCard from "./taskcard";
import "./employee.css";

export default function EmployeeDashboard({ user, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [comment, setComment] = useState("");
  const [tasks, setTasks] = useState([]);

  /* ================= FETCH TASKS FROM SUPABASE ================= */
  const fetchTasks = useCallback(async () => {
    // Step 1: Find this employee's record in the employees table by email
    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("email", user.email)
      .single();

    if (empError || !empData) {
      console.warn("No employee record found for email:", user.email);
      setTasks([]);
      return;
    }

    // Step 2: Fetch tasks where employee_id matches the employees.id
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("employee_id", empData.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setTasks(data || []);
    } else {
      console.error("Error fetching tasks:", error.message);
    }
  }, [user.email]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ================= COUNTS ================= */
  const totalTasks = tasks.length;
  const ongoingTasks = tasks.filter(t => t.status === "ongoing").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  /* ================= MENU CHANGE ================= */
  const handleMenuChange = (menu) => {
    setActive(menu);
    setSelectedTask(null);
  };

  /* ================= SUBMIT UPDATE (FIXED LOGIC) ================= */
  const handleSubmit = async () => {
    if (!statusUpdate) {
      alert("Please select a status");
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: statusUpdate,
          // Use 'employee_comments' to match AdminDashboard mapping
          employee_comments: comment 
        })
        .eq("id", selectedTask.id);

      if (error) throw error;

      alert("Task update submitted successfully!");
      
      // Reset state and refresh UI
      setSelectedTask(null);
      setStatusUpdate("");
      setComment("");
      fetchTasks(); 
      
    } catch (error) {
      console.error("Submission Error:", error.message);
      // Alert will show if the column 'employee_comments' doesn't exist in Supabase
      alert("Submit failed: " + error.message);
    }
  };

  return (
    <div className="emp-container">
      <Sidebar
        active={active}
        setActive={handleMenuChange}
        onLogout={onLogout}
      />

      <div className="main-area">
        <Topbar user={user} />

        <div className="content">
          {/* DASHBOARD */}
          {active === "dashboard" && (
            <div className="dashboard-wrapper">
              <h2 className="dashboard-title">
                Welcome Back, {user?.name} 👋
              </h2>

              <div className="dashboard-stats">
                <div className="stat-box blue">
                  <div className="stat-icon">📊</div>
                  <span>Total Tasks</span>
                  <h3>{totalTasks}</h3>
                </div>

                <div className="stat-box green">
                  <div className="stat-icon">⏳</div>
                  <span>Ongoing</span>
                  <h3>{ongoingTasks}</h3>
                </div>

                <div className="stat-box purple">
                  <div className="stat-icon">✅</div>
                  <span>Completed</span>
                  <h3>{completedTasks}</h3>
                </div>
              </div>
            </div>
          )}

          {/* TASK LIST */}
          {active === "tasks" && !selectedTask && (
            <div className="task-section">
              <div className="section-header">
                <h2>Your Assigned Tasks</h2>
              </div>

              <div className="task-grid">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="task-card-wrapper"
                      onClick={() => setSelectedTask(task)}
                    >
                      <TaskCard task={task} />
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    No tasks assigned yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TASK DETAILS */}
          {active === "tasks" && selectedTask && (
            <div className="task-details-container">
              <div className="task-header-pro">
                <h2>{selectedTask.title}</h2>
                <button
                  className="back-btn"
                  onClick={() => setSelectedTask(null)}
                >
                  ← Back
                </button>
              </div>

              <div className="task-details-grid">
                <div className="task-info-card">
                  <div className="info-row">
                    <span>Description</span>
                    <p>{selectedTask.description || "No description provided."}</p>
                  </div>

                  <div className="info-row">
                    <span>Start Date</span>
                    <p>{selectedTask.start_date || "-"}</p>
                  </div>

                  <div className="info-row">
                    <span>Due Date</span>
                    <p>{selectedTask.due_date || "-"}</p>
                  </div>

                  <div className="info-row">
                    <span>Priority</span>
                    <p className={`priority-badge ${selectedTask.priority?.toLowerCase()}`}>
                      {selectedTask.priority || "Normal"}
                    </p>
                  </div>

                  <div className="info-row">
                    <span>Current Status</span>
                    <p className={`status-badge ${selectedTask.status}`}>
                      {selectedTask.status}
                    </p>
                  </div>
                </div>

                <div className="update-card">
                  <h3>Submit Task Update</h3>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                    >
                      <option value="">Select Status</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Comment</label>
                    <textarea
                      placeholder="Write your work update here..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={!statusUpdate}
                  >
                    Submit to Admin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {active === "profile" && (
            <div className="profile-glass">
              <h2>Profile Information</h2>

              <div className="glass-card profile-card">
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> Employee</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}