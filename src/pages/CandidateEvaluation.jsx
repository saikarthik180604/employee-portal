import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import "./CandidateEvaluation.css";

export default function CandidateEvaluation() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error.message);
      setApplications([]);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (applicationId, status) => {
    const { error } = await supabase
      .from("applications")
      .update({
        status,
        interview_date:
          status === "invited" ? new Date().toISOString() : undefined,
      })
      .eq("id", applicationId);

    if (error) {
      alert("Unable to update status: " + error.message);
      return;
    }

    fetchApplications();
  };

  if (loading) {
    return <div className="ce-loading">Loading candidate pipeline...</div>;
  }

  return (
    <div className="ce-container">
      <div className="ce-header">
        <h2>Candidate Evaluation</h2>
        <p>Track, evaluate, and move candidates through hiring pipeline</p>
      </div>

      <div className="ce-grid">
        {applications.length === 0 ? (
          <div className="ce-empty">No applications available.</div>
        ) : (
          applications.map((application) => (
            <div key={application.id} className="ce-card">
              {/* Top */}
              <div className="ce-top">
                <div>
                  <h3>
                    {application.full_name ||
                      application.applicant_name ||
                      "Unnamed Candidate"}
                  </h3>
                  <p>
                    {application.position_applied ||
                      application.job_title ||
                      "Application"}
                  </p>
                </div>

                <span className={`ce-badge ${application.status || "pending"}`}>
                  {application.status || "pending"}
                </span>
              </div>

              {/* Details */}
              <div className="ce-details">
                <div><strong>Email:</strong> {application.applicant_email || application.email || "N/A"}</div>
                <div><strong>Experience:</strong> {application.experience || "N/A"}</div>
                <div><strong>Submitted:</strong> {new Date(application.created_at).toLocaleDateString()}</div>

                {application.interview_date && (
                  <div>
                    <strong>Interview:</strong>{" "}
                    {new Date(application.interview_date).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="ce-actions">
                {application.status !== "invited" &&
                  application.status !== "offered" && (
                    <button
                      onClick={() =>
                        updateStatus(application.id, "invited")
                      }
                      className="ce-btn primary"
                    >
                      Invite
                    </button>
                  )}

                {application.status !== "offered" && (
                  <button
                    onClick={() =>
                      updateStatus(application.id, "offered")
                    }
                    className="ce-btn success"
                  >
                    Offer
                  </button>
                )}

                {application.status !== "rejected" && (
                  <button
                    onClick={() =>
                      updateStatus(application.id, "rejected")
                    }
                    className="ce-btn danger"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}