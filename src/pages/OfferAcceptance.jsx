import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function OfferAcceptance({ user }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    if (!user?.email) {
      setOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_email", user.email)
      .eq("status", "offered")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setOffers([]);
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const acceptOffer = async (applicationId) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: "onboarded", accepted_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) {
      alert("Unable to accept offer: " + error.message);
      return;
    }

    await supabase.from("employees").insert([
      {
        email: user.email,
        first_name: user.name?.split(" ")[0] || "",
        last_name: user.name?.split(" ").slice(1).join(" ") || "",
        status: "Active",
        joining_date: new Date().toISOString().split("T")[0],
      }
    ], { ignoreDuplicates: true });

    alert("Offer accepted! Welcome to the team.");
    fetchOffers();
  };

  if (loading) {
    return <div style={{ color: "white", padding: "30px" }}>Checking pending offers...</div>;
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2 style={{ color: "#38bdf8" }}>Offer Acceptance</h2>
      <p style={{ color: "#94a3b8" }}>Accept your pending offer letters and complete onboarding.</p>

      {offers.length === 0 ? (
        <div style={{ marginTop: "20px", padding: "25px", background: "#111827", borderRadius: "12px" }}>
          No offer letters are pending for your account.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "18px", marginTop: "20px" }}>
          {offers.map((offer) => (
            <div key={offer.id} style={{ padding: "25px", background: "#111827", borderRadius: "12px", border: "1px solid #283046" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{offer.position_applied || offer.job_title || "Job Offer"}</h3>
                  <p style={{ color: "#94a3b8", marginTop: "6px" }}>Offered on {new Date(offer.created_at).toLocaleDateString()}</p>
                </div>
                <span style={{ padding: "6px 12px", borderRadius: "999px", background: "#16a34a", color: "white", fontSize: "12px" }}>Ready to Accept</span>
              </div>

              <div style={{ marginTop: "18px", color: "#cbd5e1", display: "grid", gap: "8px" }}>
                <div><strong>Salary:</strong> {offer.proposed_salary || "TBD"}</div>
                <div><strong>Joining Date:</strong> {offer.proposed_start_date || "TBD"}</div>
                <div><strong>Remarks:</strong> {offer.notes || "Review the offer details before accepting."}</div>
              </div>

              <button onClick={() => acceptOffer(offer.id)} style={{ ...buttonStyle, background: "#16a34a", marginTop: "20px" }}>
                Accept Offer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  background: "#0f172a",
  border: "1px solid #374151",
  color: "white",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
};