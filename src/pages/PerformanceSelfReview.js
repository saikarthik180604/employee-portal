import React, { useState } from 'react';
import { supabase } from '../supabase';

const PerformanceSelfReview = ({ session }) => {
  const [formData, setFormData] = useState({
    review_period: 'Q1 2026',
    self_rating: 3,
    self_comments: '',
    achievements: '',
    goals_next_period: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('performance_reviews')
      .upsert({
        employee_id: session.user.id,
        ...formData,
        status: 'pending_hr_review',
        updated_at: new Date()
      });

    if (error) {
      console.error("Submission error:", error.message);
      alert("Error submitting review: " + error.message);
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) return (
    <div style={styles.successCard}>
      <h3>✅ Review Submitted!</h3>
      <p>Your self-assessment has been sent to HR for appraisal.</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Performance Self-Review</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label>Review Period</label>
          <input type="text" value={formData.review_period} readOnly style={styles.readOnlyInput} />
        </div>

        <div style={styles.inputGroup}>
          <label>Key Achievements (This Period)</label>
          <textarea 
            required
            placeholder="List your top accomplishments..."
            value={formData.achievements}
            onChange={(e) => setFormData({...formData, achievements: e.target.value})}
            style={styles.textarea}
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Self Assessment / Comments</label>
          <textarea 
            placeholder="How would you describe your performance?"
            value={formData.self_comments}
            onChange={(e) => setFormData({...formData, self_comments: e.target.value})}
            style={styles.textarea}
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Self Rating (1-5)</label>
          <select 
            value={formData.self_rating}
            onChange={(e) => setFormData({...formData, self_rating: parseInt(e.target.value)})}
            style={styles.select}
          >
            <option value="1">1 - Needs Improvement</option>
            <option value="2">2 - Fair</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Very Good</option>
            <option value="5">5 - Excellent</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? "Submitting..." : "Submit to HR"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: '30px', background: '#1a1a1a', borderRadius: '15px', color: '#fff', maxWidth: '600px', margin: '20px auto' },
  title: { color: '#38bdf8', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  readOnlyInput: { padding: '10px', background: '#333', border: '1px solid #444', borderRadius: '5px', color: '#888' },
  textarea: { padding: '12px', background: '#222', border: '1px solid #444', borderRadius: '8px', color: '#fff', minHeight: '100px' },
  select: { padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '8px', color: '#fff' },
  submitBtn: { padding: '15px', background: '#38bdf8', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  successCard: { textAlign: 'center', padding: '50px', background: '#1a1a1a', color: '#2ecc71', borderRadius: '15px' }
};

export default PerformanceSelfReview;