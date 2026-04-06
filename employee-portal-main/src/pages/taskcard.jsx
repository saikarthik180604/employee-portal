import React from "react";

export default function TaskCard({ task }) {
  const getStatusClass = () => {
    if (task.status === "Pending") return "status pending";
    if (task.status === "In Progress") return "status progress";
    if (task.status === "Completed") return "status completed";
    return "status";
  };

  return (
    <div className="task-card">
      <div className="task-header">
        <h3>{task.title}</h3>
        <span className={getStatusClass()}>{task.status}</span>
      </div>
    </div>
  );
}