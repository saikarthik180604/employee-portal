import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./WorkforcePlanning.css";

export default function WorkforcePlanning() {
  const [title, setTitle] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_postings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setJobs([]);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const postJob = async () => {
    if (!title.trim()) {
      alert("Please enter a job title.");
      return;
    }

    const { error } = await supabase.from("job_postings").insert([
      {
        job_title: title.trim(),
        vacancies: 1,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      alert("Unable to post job: " + error.message);
      return;
    }

    setTitle("");
    fetchJobs();
  };

  return (
    <div className="wp-container">
      <div className="wp-header">
        <h2>Workforce Planning</h2>
        <p>Manage hiring pipeline and open positions efficiently</p>
      </div>

      <div className="wp-grid">
        {/* Post Job Card */}
        <div className="wp-card">
          <h3>Create Job Opening</h3>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Backend Developer"
            className="wp-input"
          />

          <button onClick={postJob} className="wp-button">
            + Post Job
          </button>
        </div>

        {/* Jobs List */}
        <div className="wp-card">
          <h3>Open Positions</h3>

          {loading ? (
            <p className="wp-muted">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="wp-muted">No open positions yet.</p>
          ) : (
            <div className="wp-job-list">
              {jobs.map((job) => (
                <div key={job.id} className="wp-job-card">
                  <div className="wp-job-top">
                    <span className="wp-job-title">{job.job_title}</span>
                    <span className="wp-badge">
                      {job.vacancies || 1} Vacancy
                    </span>
                  </div>

                  <div className="wp-job-date">
                    Posted on{" "}
                    {new Date(
                      job.created_at || job.createdAt
                    ).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}