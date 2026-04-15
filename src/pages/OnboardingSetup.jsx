import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./OnboardingSetup.css";

export default function OnboardingSetup() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfferedCandidates();
  }, []);

  const fetchOfferedCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .in("status", ["offered", "onboarded"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setApplications([]);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const onboardCandidate = async (applicationId) => {
    const { error } = await supabase
      .from("applications")
      .update({
        status: "onboarded",
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      alert("Unable to onboard candidate: " + error.message);
      return;
    }

    fetchOfferedCandidates();
  };

  if (loading) {
    return <div className="ob-loading">Loading onboarding setup...</div>;
  }

  return (
    <div className="ob-container">
      <div className="ob-header">
        <h2>Onboarding Setup</h2>
        <p>Convert offers into employees and prepare onboarding flow</p>
      </div>

      <div className="ob-grid">
        {applications.length === 0 ? (
          <div className="ob-empty">
            No candidates available for onboarding.
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="ob-card">
              {/* Top */}
              <div className="ob-top">
                <div>
                  <h3>
                    {app.full_name ||
                      app.applicant_name ||
                      "Candidate"}
                  </h3>
                  <p>
                    {app.position_applied || app.job_title}
                  </p>
                </div>

                <span className={`ob-badge ${app.status}`}>
                  {app.status}
                </span>
              </div>

              {/* Details */}
              <div className="ob-details">
                <div>
                  <strong>Email:</strong>{" "}
                  {app.applicant_email || app.email || "N/A"}
                </div>

                <div>
                  <strong>Offer Date:</strong>{" "}
                  {new Date(app.created_at).toLocaleDateString()}
                </div>

                <div>
                  <strong>Salary:</strong>{" "}
                  {app.proposed_salary || "TBD"}
                </div>

                {app.onboarded_at && (
                  <div>
                    <strong>Onboarded:</strong>{" "}
                    {new Date(app.onboarded_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Action */}
              {app.status !== "onboarded" && (
                <button
                  onClick={() => onboardCandidate(app.id)}
                  className="ob-btn"
                >
                  Complete Onboarding
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}