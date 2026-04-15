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
    
    // Using upsert based on employee_id and review_period 
    // This allows employees to update their review until HR locks it
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
      <h3>Review Submitted</h3>
      <p>Your self-assessment for {formData.review_period} has been sent to HR for appraisal.</p>
      <button onClick={() => setSubmitted(false)} style={styles.backBtn}>Edit Submission</button>
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
          <label>Goals for Next Period</label>
          <textarea 
            placeholder="What do you want to achieve in the next quarter?"
            value={formData.goals_next_period}
            onChange={(e) => setFormData({...formData, goals_next_period: e.target.value})}
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
  container: { padding: '30px', background: '#111827', borderRadius: '15px', color: '#fff', maxWidth: '600px', margin: '20px auto', border: '1px solid #374151' },
  title: { color: '#38bdf8', marginBottom: '20px', fontSize: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  readOnlyInput: { padding: '10px', background: '#1f2937', border: '1px solid #374151', borderRadius: '5px', color: '#9ca3af' },
  textarea: { padding: '12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', minHeight: '100px', outline: 'none' },
  select: { padding: '10px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', outline: 'none' },
  submitBtn: { padding: '15px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' },
  successCard: { textAlign: 'center', padding: '50px', background: '#111827', color: '#2ecc71', borderRadius: '15px', border: '1px solid #065f46' },
  backBtn: { marginTop: '20px', background: 'transparent', color: '#9ca3af', border: '1px solid #374151', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }
};

export default PerformanceSelfReview;