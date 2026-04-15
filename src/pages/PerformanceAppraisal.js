import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const PerformanceAppraisal = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setLoading(true);
    // Using the 'employees' table join to get names as per your requirement
    const { data, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        employees (first_name, last_name, designation)
      `)
      .order('created_at', { ascending: false });

    if (!error) setReviews(data);
    setLoading(false);
  };

  const handleManagerReview = async (id, adminRating, feedback) => {
    const { error } = await supabase
      .from('performance_reviews')
      .update({
        admin_rating: parseInt(adminRating), // Matches our SQL table
        admin_feedback: feedback,           // Matches our SQL table
        status: 'completed'
      })
      .eq('id', id);

    if (error) alert(error.message);
    else {
      alert("Appraisal Finalized Successfully!");
      fetchPendingReviews();
    }
  };

  if (loading) return <div style={{color: '#fff', textAlign: 'center', marginTop: '50px'}}>Loading Appraisals...</div>;

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h2 style={{ color: '#38bdf8' }}>Performance Appraisals (HR Operations)</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Review employee self-assessments and provide final ratings.</p>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {reviews.length === 0 ? <p>No performance reviews found.</p> : reviews.map((rev) => (
          <div key={rev.id} style={hrStyles.card}>
            <div style={hrStyles.header}>
              <div>
                <h3 style={{margin: 0}}>{rev.employees?.first_name} {rev.employees?.last_name}</h3>
                <small style={{color: '#888'}}>{rev.employees?.designation} • {rev.review_period}</small>
              </div>
              <span style={{
                ...hrStyles.badge, 
                background: rev.status === 'completed' ? '#2ecc7122' : '#38bdf822',
                color: rev.status === 'completed' ? '#2ecc71' : '#38bdf8'
              }}>
                {rev.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            
            <div style={hrStyles.details}>
              <p><strong>Employee Achievements:</strong> {rev.achievements}</p>
              <p><strong>Self Assessment:</strong> {rev.self_comments}</p>
              <p><strong>Employee Self-Rating:</strong> <span style={{color: '#38bdf8'}}>{rev.self_rating}/5</span></p>
            </div>

            {rev.status !== 'completed' ? (
              <div style={hrStyles.actionArea}>
                <hr style={{borderColor: '#333', margin: '10px 0'}} />
                <h4 style={{margin: '0 0 10px 0', color: '#2ecc71'}}>Final HR Appraisal</h4>
                
                <label style={{fontSize: '12px', color: '#888'}}>Final Rating (1-5)</label>
                <select id={`rate-${rev.id}`} style={hrStyles.select}>
                  <option value="1">1 - Unsatisfactory</option>
                  <option value="2">2 - Developing</option>
                  <option value="3" selected>3 - Proficient</option>
                  <option value="4">4 - Commendable</option>
                  <option value="5">5 - Distinguished</option>
                </select>

                <label style={{fontSize: '12px', color: '#888', marginTop: '5px'}}>Calibration Feedback</label>
                <textarea id={`feed-${rev.id}`} placeholder="Provide official feedback..." style={hrStyles.textarea} />
                
                <button 
                  onClick={() => handleManagerReview(
                    rev.id, 
                    document.getElementById(`rate-${rev.id}`).value,
                    document.getElementById(`feed-${rev.id}`).value
                  )}
                  style={hrStyles.btn}
                >
                  Finalize & Disburse Rating
                </button>
              </div>
            ) : (
              <div style={{marginTop: '15px', padding: '15px', background: '#111', borderRadius: '8px', borderLeft: '4px solid #2ecc71'}}>
                <p style={{margin: 0, fontSize: '14px'}}><strong>Final Rating:</strong> {rev.admin_rating}/5</p>
                <p style={{margin: '5px 0 0 0', fontSize: '14px', color: '#aaa'}}><strong>HR Feedback:</strong> {rev.admin_feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const hrStyles = {
  card: { background: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #374151' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  badge: { padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  details: { fontSize: '14px', lineHeight: '1.7', color: '#d1d5db', background: '#1f2937', padding: '15px', borderRadius: '8px' },
  actionArea: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  select: { padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '8px', border: '1px solid #374151', outline: 'none' },
  textarea: { padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '8px', border: '1px solid #374151', height: '80px', outline: 'none', resize: 'none' },
  btn: { marginTop: '10px', padding: '14px', background: '#2ecc71', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }
};

export default PerformanceAppraisal;