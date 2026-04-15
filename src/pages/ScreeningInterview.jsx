import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import "./ScreeningInterview.css";

export default function ScreeningInterview() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitedCandidates();
  }, []);

  const fetchInvitedCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("status", "invited")
      .order("interview_date", { ascending: true });

    if (error) {
      console.error("Fetch error:", error.message);
      setCandidates([]);
    } else {
      setCandidates(data || []);
    }
    setLoading(false);
  };

  const updateInterviewStatus = async (id, status) => {
    const { error } = await supabase
      .from("applications")
      .update({
        status,
        interview_completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert("Unable to update interview status: " + error.message);
    } else {
      fetchInvitedCandidates();
    }
  };

  if (loading) {
    return <div className="si-loading">Loading screening interviews...</div>;
  }

  return (
    <div className="si-container">
      <div className="si-header">
        <h2>Screening & Interview</h2>
        <p>Manage interview pipeline and candidate progress</p>
      </div>

      <div className="si-grid">
        {candidates.length === 0 ? (
          <div className="si-empty">
            No candidates have been invited yet.
          </div>
        ) : (
          candidates.map((candidate) => (
            <div key={candidate.id} className="si-card">
              {/* Top */}
              <div className="si-top">
                <div>
                  <h3>
                    {candidate.full_name ||
                      candidate.applicant_name ||
                      "Candidate"}
                  </h3>
                  <p>
                    {candidate.position_applied ||
                      candidate.job_title ||
                      "Interview"}
                  </p>
                </div>

                <span className="si-badge">
                  Interview Scheduled
                </span>
              </div>

              {/* Details */}
              <div className="si-details">
                <div>
                  <strong>Email:</strong>{" "}
                  {candidate.applicant_email ||
                    candidate.email ||
                    "N/A"}
                </div>

                <div>
                  <strong>Interview:</strong>{" "}
                  {candidate.interview_date
                    ? new Date(candidate.interview_date).toLocaleString()
                    : "To be scheduled"}
                </div>

                <div>
                  <strong>Experience:</strong>{" "}
                  {candidate.experience || "N/A"}
                </div>
              </div>

              {/* Actions */}
              <div className="si-actions">
                <button
                  onClick={() =>
                    updateInterviewStatus(candidate.id, "interviewed")
                  }
                  className="si-btn primary"
                >
                  Mark Done
                </button>

                <button
                  onClick={() =>
                    updateInterviewStatus(candidate.id, "offered")
                  }
                  className="si-btn success"
                >
                  Offer
                </button>

                <button
                  onClick={() =>
                    updateInterviewStatus(candidate.id, "rejected")
                  }
                  className="si-btn danger"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}