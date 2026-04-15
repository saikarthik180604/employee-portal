import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function JobSearch({ user }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setJobs([]);
        return;
      }

      setJobs(data || []);
    }

    loadJobs();
  }, []);

  const fetchApplications = useCallback(async () => {
    if (!user?.email) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setApplications([]);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const apply = async (job) => {
    if (!user?.email) {
      alert("Login is required to apply.");
      return;
    }

    const { error } = await supabase.from("applications").insert([{
      job_id: job.id,
      applicant_name: user.name || user.email,
      applicant_email: user.email,
      position_applied: job.job_title,
      status: "pending",
      created_at: new Date().toISOString(),
    }] );

    if (error) {
      alert("Application failed: " + error.message);
      return;
    }

    alert("Applied successfully!");
    fetchApplications();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8" }}>Job Search & Apply</h2>
      <p style={{ color: "#94a3b8" }}>Browse open roles and manage your applications.</p>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        <div style={{ padding: "20px", background: "#111827", borderRadius: "12px", border: "1px solid #283046" }}>
          <h3 style={{ marginBottom: "15px" }}>Open Positions</h3>
          {jobs.length === 0 ? (
            <p>No open positions are available at the moment.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "15px", borderRadius: "10px", background: "#0f172a", border: "1px solid #374151" }}>
                <div>
                  <strong>{job.job_title}</strong>
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>{job.vacancies || 1} vacancy</div>
                </div>
                <button onClick={() => apply(job)} style={{ background: "#38bdf8", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", color: "#000", fontWeight: "bold" }}>
                  Apply
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "20px", background: "#111827", borderRadius: "12px", border: "1px solid #283046" }}>
          <h3 style={{ marginBottom: "15px" }}>My Applications</h3>
          {loading ? (
            <p>Loading submitted applications...</p>
          ) : applications.length === 0 ? (
            <p>No applications submitted yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "12px" }}>
              {applications.map((app) => (
                <li key={app.id} style={{ padding: "15px", borderRadius: "10px", background: "#0f172a", border: "1px solid #374151" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{app.position_applied || app.job_title || "Applied Role"}</strong>
                      <div style={{ color: "#94a3b8", fontSize: "13px" }}>{new Date(app.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{ color: app.status === "offered" ? "#16a34a" : app.status === "rejected" ? "#f87171" : "#facc15", fontWeight: "bold" }}>
                      {app.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}