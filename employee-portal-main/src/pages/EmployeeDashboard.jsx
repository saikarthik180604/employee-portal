import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import Sidebar from "./sidebar";
import Topbar from "./Topbar";
import "./employee.css";

function TaskCard({ task, onUpdate }) {
  const [comment, setComment] = useState("");

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>Status: {task.status}</p>
      <p>{task.employee_comments || "No comments yet."}</p>

      <textarea
        placeholder="Add a quick comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="task-actions">
        <button onClick={() => onUpdate(task, "ongoing", comment)}>
          Mark Ongoing
        </button>
        <button onClick={() => onUpdate(task, "completed", comment)}>
          Mark Completed
        </button>
      </div>
    </div>
  );
}

export default function EmployeeDashboard({ user, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState("");

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    const { data: empData } = await supabase
      .from("employees")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!empData) return;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("employee_id", empData.id)
      .order("created_at", { ascending: false });

    setTasks(data || []);
  }, [user.email]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Quick update handler
  const quickUpdate = async (task, newStatus, comment) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        employee_comments: comment || `Status changed to ${newStatus} on ${new Date().toLocaleString()}`
      })
      .eq("id", task.id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      fetchTasks();
    }
  };

  const handleStatClick = (status) => {
    setTaskFilter(status || "");
    setActive("tasks");
  };

  return (
    <div className="emp-container">
      <Sidebar active={active} setActive={setActive} onLogout={onLogout} />

      <div className="main-area">
        <Topbar user={user} />

        <div className="content">
          {/* Dashboard */}
          {active === "dashboard" && (
            <div className="dashboard-wrapper">
              <h2>Welcome Back, {user?.name}</h2>
              <div className="dashboard-stats">
                <div className="stat-box blue clickable" onClick={() => handleStatClick("")}>
                  <span>Total</span>
                  <h3>{tasks.length}</h3>
                </div>
                <div className="stat-box green clickable" onClick={() => handleStatClick("ongoing")}>
                  <span>Ongoing</span>
                  <h3>{tasks.filter(t => t.status === "ongoing").length}</h3>
                </div>
                <div className="stat-box purple clickable" onClick={() => handleStatClick("completed")}>
                  <span>Completed</span>
                  <h3>{tasks.filter(t => t.status === "completed").length}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Task List */}
          {active === "tasks" && (
            <>
              {taskFilter && (
                <div className="filter-info">
                  <span>Showing <strong>{taskFilter}</strong> tasks</span>
                  <button className="clear-filter-btn" onClick={() => setTaskFilter("")}>
                    View All
                  </button>
                </div>
              )}
              <div className="task-grid">
                {tasks
                  .filter(t => (taskFilter ? t.status === taskFilter : true))
                  .map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={quickUpdate} />
                  ))}
              </div>
            </>
          )}

          {/* Profile */}
          {active === "profile" && (
            <div className="glass-card">
              <h2>Profile Information</h2>
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
