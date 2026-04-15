import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import "./LDManagement.css";

const LDManagement = () => {
  const [courseTitle, setCourseTitle] = useState("");
  const [courses, setCourses] = useState([]);

  // NEW STATES
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchEmployees();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("training_courses")
      .select("*")
      .order("created_at", { ascending: false });

    setCourses(data || []);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, name");

    setEmployees(data || []);
  };

  const fetchProgress = async (employeeId) => {
    const { data } = await supabase
      .from("course_progress")
      .select(`
        progress,
        status,
        training_courses (
          id,
          title
        )
      `)
      .eq("employee_id", employeeId);

    setProgressData(data || []);
  };

  const addCourse = async () => {
    if (!courseTitle.trim()) return;

    await supabase.from("training_courses").insert([
      {
        title: courseTitle,
        created_at: new Date().toISOString(),
      },
    ]);

    setCourseTitle("");
    fetchCourses();
  };

  const assignCourse = async (courseId) => {
    if (!selectedEmployee) {
      alert("Select employee first");
      return;
    }

    await supabase.from("employee_courses").insert([
      {
        employee_id: selectedEmployee,
        course_id: courseId,
      },
    ]);

    await supabase.from("course_progress").upsert([
      {
        employee_id: selectedEmployee,
        course_id: courseId,
        progress: 0,
        status: "not_started",
      },
    ]);

    fetchProgress(selectedEmployee);
  };

  const updateProgress = async (courseId, progress) => {
    await supabase.from("course_progress").upsert([
      {
        employee_id: selectedEmployee,
        course_id: courseId,
        progress,
        status: progress === 100 ? "completed" : "in_progress",
        completed_at:
          progress === 100 ? new Date().toISOString() : null,
      },
    ]);

    fetchProgress(selectedEmployee);
  };

  return (
    <div className="ld-container">
      {/* Header */}
      <div className="ld-header">
        <h2>Learning & Development</h2>
        <p>Upskill your workforce with structured training programs</p>
      </div>

      {/* Stats */}
      <div className="ld-stats">
        <div className="ld-stat-card">
          <h3>{courses.length}</h3>
          <p>Total Courses</p>
        </div>
        <div className="ld-stat-card">
          <h3>{employees.length}</h3>
          <p>Employees</p>
        </div>
        <div className="ld-stat-card">
          <h3>{progressData.length}</h3>
          <p>Assigned Courses</p>
        </div>
      </div>

      {/* Employee Selector */}
      <select
        className="ld-select"
        onChange={(e) => {
          setSelectedEmployee(e.target.value);
          fetchProgress(e.target.value);
        }}
      >
        <option value="">Select Employee</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>

      {/* Add Course */}
      <div className="ld-card">
        <h3>Create New Course</h3>

        <div className="ld-form">
          <input
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="Enter course title (e.g. React Advanced)"
          />

          <button onClick={addCourse}>+ Add Course</button>
        </div>
      </div>

      {/* Course List */}
      <div className="ld-grid">
        {courses.length === 0 ? (
          <div className="ld-empty">No courses created yet.</div>
        ) : (
          courses.map((c) => {
            const courseProgress = progressData.find(
              (p) => p.training_courses.id === c.id
            );

            return (
              <div key={c.id} className="ld-course-card">
                <div className="ld-course-top">
                  <h4>{c.title}</h4>
                  <span className="ld-badge">Course</span>
                </div>

                <div className="ld-course-body">
                  <p>Skill-based training module for employees</p>

                  <div className="ld-progress">
                    <div
                      className="ld-progress-bar"
                      style={{
                        width: `${courseProgress?.progress || 0}%`,
                      }}
                    ></div>
                  </div>

                  <p style={{ fontSize: "12px", marginTop: "5px" }}>
                    {courseProgress?.progress || 0}% Completed
                  </p>
                </div>

                <div className="ld-actions">
                  <button onClick={() => assignCourse(c.id)}>
                    Assign
                  </button>
                  <button onClick={() => updateProgress(c.id, 25)}>
                    25%
                  </button>
                  <button onClick={() => updateProgress(c.id, 50)}>
                    50%
                  </button>
                  <button onClick={() => updateProgress(c.id, 100)}>
                    Complete
                  </button>
                </div>

                <div className="ld-course-footer">
                  <span>
                    Created:{" "}
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LDManagement;