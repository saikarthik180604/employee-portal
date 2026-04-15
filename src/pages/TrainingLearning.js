import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const TrainingLearning = ({ session }) => {
  const [courses, setCourses] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from('training_courses').select('*');
      if (error) console.error("Fetch error:", error.message);
      setCourses(data || []);
    };
    fetchCourses();
  }, []);

  const enroll = async (courseId) => {
    // 1. Safety check for the session
    if (!session?.user?.id) {
      alert("Session not found. Please log in again.");
      return;
    }

    setEnrollingId(courseId); // Visual feedback for the button

    try {
      // 2. Insert enrollment with status
      const { error } = await supabase.from('training_enrollments').insert([
        { 
          employee_id: session.user.id, 
          course_id: courseId,
          status: 'enrolled' 
        }
      ]);

      if (error) {
        // Handle duplicate enrollment if you have a unique constraint
        if (error.code === '23505') {
          alert("You are already enrolled in this course!");
        } else {
          throw error;
        }
      } else {
        alert("Enrolled successfully!");
      }
    } catch (err) {
      console.error("Enrollment failed:", err.message);
      alert("Database Error: " + err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h2 style={{ color: '#38bdf8' }}>Training & Learning</h2>
      <div style={{ display: 'grid', gap: '15px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ background: '#111827', padding: '15px', borderRadius: '10px', border: '1px solid #374151' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{course.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{course.description}</p>
            <button 
              onClick={() => enroll(course.id)} 
              disabled={enrollingId === course.id}
              style={{ 
                background: enrollingId === course.id ? '#4b5563' : '#2ecc71', 
                padding: '8px 15px', 
                borderRadius: '5px', 
                border: 'none', 
                cursor: enrollingId === course.id ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
            >
              {enrollingId === course.id ? "Processing..." : "Enroll Now"}
            </button>
          </div>
        ))}
        {courses.length === 0 && <p>No courses available at the moment.</p>}
      </div>
    </div>
  );
};

export default TrainingLearning;