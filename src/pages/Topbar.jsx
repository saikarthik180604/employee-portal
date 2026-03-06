import React from "react";

export default function Topbar({ user }) {
  return (
    <div className="topbar">
      <h3>
        Welcome, <span>{user?.name}</span>
      </h3>
    </div>
  );
}