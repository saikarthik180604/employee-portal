import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const Probation = ({ session }) => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const onboardingTasks = [
    { id: 'meet_team', label: '🤝 Meet the Team (Introductions)', icon: '👥' },
    { id: 'learn_tools', label: '🛠️ Learn Tools (Slack, Jira, VS Code)', icon: '💻' },
    { id: 'first_task', label: '🚀 Complete First Assigned Task', icon: '✅' },
    { id: 'it_setup', label: '📧 IT & Email Setup', icon: '📨' },
    { id: 'hr_docs', label: '📑 Sign HR Compliance Docs', icon: '📝' }
  ];

  const fetchProbationData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('probation')
        .select('completed_tasks')
        .eq('employee_id', session.user.id)
        .maybeSingle(); // Prevents 406 error if row doesn't exist yet

      if (error) throw error;
      
      if (data && data.completed_tasks) {
        setCompletedTasks(data.completed_tasks);
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [session.user.id]);

  useEffect(() => {
    if (session?.user?.id) fetchProbationData();
  }, [session, fetchProbationData]);

  const toggleTask = async (taskId) => {
    // 1. Calculate new state
    const isCompleted = completedTasks.includes(taskId);
    const updatedTasks = isCompleted 
      ? completedTasks.filter(id => id !== taskId) 
      : [...completedTasks, taskId];

    // 2. Update UI immediately
    setCompletedTasks(updatedTasks);

    // 3. Calculate percentage for the database
    const progressPercent = Math.round((updatedTasks.length / onboardingTasks.length) * 100);

    // 4. Sync with Supabase
    const { error } = await supabase
      .from('probation')
      .update({ 
        completed_tasks: updatedTasks,
        tasks_completed: updatedTasks.length,
        onboarding_progress: progressPercent 
      })
      .eq('employee_id', session.user.id);

    if (error) {
      console.error("Update Error:", error.message);
      alert("Failed to save progress. Check console.");
    }
  };

  const progress = Math.round((completedTasks.length / onboardingTasks.length) * 100);

  if (loading) return <div style={styles.loader}>Loading your progress...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🌱 Probation: Settle In</h1>
        <p>Complete these steps to finish your onboarding phase.</p>
      </header>

      <div style={styles.card}>
        <div style={styles.flexBetween}>
          <span style={styles.boldText}>Onboarding Progress</span>
          <span style={styles.percentText}>{progress}%</span>
        </div>
        <div style={styles.progressBg}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
        </div>
      </div>

      <div style={styles.taskList}>
        {onboardingTasks.map((task) => {
          const isChecked = completedTasks.includes(task.id);
          return (
            <div 
              key={task.id} 
              style={{ 
                ...styles.taskItem, 
                borderLeft: isChecked ? '5px solid #4CAF50' : '5px solid #ddd' 
              }}
              onClick={() => toggleTask(task.id)}
            >
              <span style={styles.icon}>{task.icon}</span>
              <span style={{ 
                ...styles.taskLabel, 
                textDecoration: isChecked ? 'line-through' : 'none',
                color: isChecked ? '#95a5a6' : '#2c3e50'
              }}>
                {task.label}
              </span>
              <input 
                type="checkbox" 
                checked={isChecked} 
                readOnly 
                style={styles.checkbox}
              />
            </div>
          );
        })}
      </div>

      {progress === 100 && (
        <div style={styles.confettiBox}>
          🎉 **All Set!** You've completed your initial onboarding.
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '30px' },
  card: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
  flexBetween: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  boldText: { fontWeight: 'bold' },
  percentText: { color: '#2ecc71', fontWeight: 'bold' },
  progressBg: { background: '#eee', height: '10px', borderRadius: '5px' },
  progressFill: { background: '#2ecc71', height: '100%', borderRadius: '5px', transition: '0.3s' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  taskItem: { display: 'flex', alignItems: 'center', padding: '15px', background: '#fff', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  icon: { marginRight: '15px', fontSize: '1.2rem' },
  taskLabel: { flex: 1 },
  checkbox: { width: '18px', height: '18px' },
  confettiBox: { marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center', color: '#2e7d32' },
  loader: { textAlign: 'center', marginTop: '50px' }
};

export default Probation;