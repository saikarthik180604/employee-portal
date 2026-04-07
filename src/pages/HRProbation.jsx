import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

const HRProbation = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProbationData();
  }, []);

  const fetchProbationData = async () => {
    try {
      setLoading(true);
      // Fetch employees and JOIN their matching probation progress
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id, first_name, last_name, designation, joining_date,
          probation(onboarding_progress)
        `);

      if (error) throw error;

      // Format data so onboarding_progress is easy to access
      const formatted = data.map(emp => ({
        ...emp,
        onboarding_progress: emp.probation?.[0]?.onboarding_progress || 0
      }));

      setEmployees(formatted);
    } catch (err) {
      console.error("HR Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>Probation Monitoring (HR View)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #444' }}>
            <th>Employee</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '15px' }}>{emp.first_name} {emp.last_name}</td>
              <td style={{ padding: '15px' }}>
                <div style={{ background: '#222', width: '100px', height: '8px', borderRadius: '4px' }}>
                  <div style={{ background: '#38bdf8', width: `${emp.onboarding_progress}%`, height: '100%', borderRadius: '4px' }}></div>
                </div>
                <small>{emp.onboarding_progress}%</small>
              </td>
              <td>{emp.onboarding_progress === 100 ? "✅ Ready" : "⏳ Active"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HRProbation;