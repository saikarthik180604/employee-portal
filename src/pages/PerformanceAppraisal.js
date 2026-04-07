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

  const handleManagerReview = async (id, managerRating, feedback) => {
    const { error } = await supabase
      .from('performance_reviews')
      .update({
        manager_rating: parseInt(managerRating),
        manager_feedback: feedback,
        status: 'completed'
      })
      .eq('id', id);

    if (error) alert(error.message);
    else fetchPendingReviews();
  };

  if (loading) return <div style={{color: '#fff', textAlign: 'center'}}>Loading Appraisals...</div>;

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h2 style={{ color: '#38bdf8' }}>Performance Appraisals (HR Operations)</h2>
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        {reviews.map((rev) => (
          <div key={rev.id} style={hrStyles.card}>
            <div style={hrStyles.header}>
              <h3>{rev.employees?.first_name} {rev.employees?.last_name}</h3>
              <span style={hrStyles.badge}>{rev.status.replace('_', ' ')}</span>
            </div>
            
            <div style={hrStyles.details}>
              <p><strong>Employee Achievements:</strong> {rev.achievements}</p>
              <p><strong>Employee Self-Rating:</strong> {rev.self_rating}/5</p>
            </div>

            {rev.status !== 'completed' && (
              <div style={hrStyles.actionArea}>
                <hr style={{borderColor: '#444'}} />
                <label>Manager Rating (Appraisal)</label>
                <select id={`rate-${rev.id}`} style={hrStyles.select}>
                  <option value="1">1 - Unsatisfactory</option>
                  <option value="2">2 - Developing</option>
                  <option value="3">3 - Proficient</option>
                  <option value="4">4 - Commendable</option>
                  <option value="5">5 - Distinguished</option>
                </select>
                <textarea id={`feed-${rev.id}`} placeholder="Provide calibration feedback..." style={hrStyles.textarea} />
                <button 
                  onClick={() => handleManagerReview(
                    rev.id, 
                    document.getElementById(`rate-${rev.id}`).value,
                    document.getElementById(`feed-${rev.id}`).value
                  )}
                  style={hrStyles.btn}
                >
                  Finalize Appraisal
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const hrStyles = {
  card: { background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid #333' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  badge: { background: '#38bdf822', color: '#38bdf8', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' },
  details: { fontSize: '14px', lineHeight: '1.6', color: '#ccc' },
  actionArea: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
  select: { padding: '8px', background: '#222', color: '#fff', borderRadius: '5px' },
  textarea: { padding: '10px', background: '#222', color: '#fff', borderRadius: '5px', height: '60px' },
  btn: { padding: '10px', background: '#2ecc71', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }
};

export default PerformanceAppraisal;