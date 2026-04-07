import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import Calendar from "react-calendar"; 
import "react-calendar/dist/Calendar.css"; 
import "./AdminAttendance.css";

// NEW: Required imports for export functionality
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * AdminAttendance Component
 * Monitors real-time sign-ins, handles leave approvals, 
 * and provides a visual calendar for salary release calculations.
 */
export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // NEW: State for Calendar Selection
  const [selectedEmployeeForCal, setSelectedEmployeeForCal] = useState("");

  const officeStartTime = "09:30:00";
  const todayDate = new Date().toISOString().split('T')[0];

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: empData } = await supabase.from("employees").select("id, first_name, last_name");
      if (empData) setEmployees(empData);

      const { data: attData, error: attError } = await supabase
        .from("attendance")
        .select(`
          id, date, check_in, check_out, status, latitude, longitude,
          employees ( id, first_name, last_name )
        `)
        .order("date", { ascending: false });

      if (attError) throw attError;

      const { data: leaveData } = await supabase
        .from("leaves")
        .select(`*, employees(id, first_name, last_name)`)
        .order("created_at", { ascending: false });
      
      setLeaves(leaveData || []);

      if (attData) {
        const mappedData = attData.map((item) => {
          let currentStatus = item.status || "Present";
          if (item.check_in && item.check_in > officeStartTime && currentStatus !== "Absent") {
            currentStatus = "Late";
          }

          return {
            id: item.id,
            employeeId: item.employees?.id,
            name: item.employees ? `${item.employees.first_name} ${item.employees.last_name}` : "Unknown",
            date: item.date,
            checkIn: item.check_in || "-",
            checkOut: item.check_out || "-",
            status: currentStatus,
            latitude: item.latitude,
            longitude: item.longitude,
            duration: item.check_out ? "Calculated" : "-" 
          };
        });

        const absentEmployees = empData
          .filter(emp => !mappedData.some(rec => rec.employeeId === emp.id && rec.date === todayDate))
          .filter(emp => !leaveData?.some(l => l.employee_id === emp.id && l.status === 'Approved' && todayDate >= l.start_date && todayDate <= l.end_date))
          .map(emp => ({
            id: `absent-${emp.id}`,
            name: `${emp.first_name} ${emp.last_name}`,
            date: todayDate,
            checkIn: "-",
            checkOut: "-",
            status: "Absent",
            duration: "-",
            latitude: null,
            longitude: null
          }));

        setRecords([...mappedData, ...absentEmployees]);
      }
    } catch (err) {
      console.error("Error fetching data:", err.message);
    } finally {
      setLoading(false);
    }
  }, [todayDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleLeaveAction = async (leaveId, newStatus) => {
    const { error } = await supabase
      .from("leaves")
      .update({ status: newStatus })
      .eq("id", leaveId);

    if (error) alert(error.message);
    else fetchAttendance();
  };

  // Calendar Color Logic
  const getTileClassName = ({ date, view }) => {
    if (view !== "month" || !selectedEmployeeForCal) return;

    const dateStr = date.toLocaleDateString('en-CA'); 
    
    const dayRecord = records.find(r => r.employeeId === selectedEmployeeForCal && r.date === dateStr);
    const dayLeave = leaves.find(l => l.employee_id === selectedEmployeeForCal && dateStr >= l.start_date && dateStr <= l.end_date && l.status === 'Approved');

    if (dayRecord) {
      if (dayRecord.status === "Late") return "tile-late"; 
      if (dayRecord.status === "Present") return "tile-present";
    }
    
    if (dayLeave) {
      if (dayLeave.leave_type === 'Permission' || dayLeave.leave_type === 'Half Day') return "tile-permission";
      return "tile-absent"; 
    }

    if (dateStr < todayDate && date.getDay() !== 0 && date.getDay() !== 6) {
      return "tile-absent"; 
    }
  };

  const filteredRecords = records.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? rec.status === statusFilter : true;
    const matchesDate =
      (!fromDate || new Date(rec.date) >= new Date(fromDate)) &&
      (!toDate || new Date(rec.date) <= new Date(toDate));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleEdit = (id) => alert(`Edit record: ${id}`);
  const handleMark = (id) => alert(`Mark manual for: ${id}`);

  // NEW: Logic for Export and Printing
  const handleExport = (type) => {
    const dataToExport = filteredRecords.map(r => ({
      Employee: r.name,
      Date: r.date,
      SignIn: r.checkIn,
      SignOut: r.checkOut,
      Status: r.status
    }));

    if (type === "CSV") {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Attendance_Report_${todayDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === "Excel") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      XLSX.writeFile(workbook, `Attendance_Report_${todayDate}.xlsx`);
    } else if (type === "Print") {
      window.print();
    }
  };

  return (
    <div className="admin-attendance-container" style={{ color: '#fff' }}>
      <h2 className="attendance-title">Sign-In & Salary Release Monitor</h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card present">Present Today 
            <h3>{records.filter(r => (r.status === "Present" || r.status === "Late") && r.date === todayDate).length}</h3>
        </div>
        <div className="card late">On Approved Leave 
            <h3>{leaves.filter(l => l.status === 'Approved' && todayDate >= l.start_date && todayDate <= l.end_date).length}</h3>
        </div>
        <div className="card absent">Absent Today 
            <h3>{records.filter(r => r.status === "Absent" && r.date === todayDate).length}</h3>
        </div>
        <div className="card hours">Pending Leaves <h3>{leaves.filter(l => l.status === 'Pending').length}</h3></div>
      </div>

      {/* FIXED: CALENDAR REPORT SECTION (Removed White Background) */}
      <div className="calendar-report-section" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: '#fff' }}>Monthly Calendar Report (Salary Release)</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>
          <div className="calendar-wrapper-dark">
            <select 
              value={selectedEmployeeForCal} 
              onChange={(e) => setSelectedEmployeeForCal(e.target.value)}
              className="employee-select"
              style={{ marginBottom: '15px', padding: '10px', borderRadius: '5px', background: '#333', color: '#fff', border: '1px solid #555', width: '100%' }}
            >
              <option value="">-- Select Employee to View Calendar --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id} style={{background: '#222'}}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
            <Calendar tileClassName={getTileClassName} />
          </div>
          <div className="legend-box" style={{ flex: 1, padding: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#fff' }}>Color Codes</h4>
            <p><span className="dot green"></span> Green: Present (Full Salary)</p>
            <p><span className="dot orange"></span> orange: Late (Possible Deduction)</p>
            <p><span className="dot blue"></span> Blue: Permission / Half Day</p>
            <p><span className="dot red"></span> Red: Absent / Unpaid</p>
            <hr style={{ opacity: 0.2 }} />
            {selectedEmployeeForCal && (
              <button className="export-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => alert("Processing Salary...")}>Calculate Salary</button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Management Section */}
      <div className="pending-leaves-section" style={{marginBottom: '30px'}}>
        <h3 style={{ color: '#fff' }}>Pending Leave Requests</h3>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type / Period</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.filter(l => l.status === "Pending").map(leave => (
              <tr key={leave.id}>
                <td>{leave.employees?.first_name} {leave.employees?.last_name}</td>
                <td>{leave.leave_type} ({leave.start_date} to {leave.end_date})</td>
                <td>{leave.reason}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleLeaveAction(leave.id, 'Approved')}>Approve</button>
                  <button className="manual-btn" style={{backgroundColor: '#e74c3c'}} onClick={() => handleLeaveAction(leave.id, 'Rejected')}>Reject</button>
                </td>
              </tr>
            ))}
            {leaves.filter(l => l.status === "Pending").length === 0 && <tr><td colSpan="4">No pending requests</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Filters */}
      <div className="filters">
        <input type="text" placeholder="Search Employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button className="filter-btn" onClick={fetchAttendance}>Refresh</button>
      </div>

      {/* Attendance Table */}
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Sign-In</th>
            <th>Sign-Out</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7">Loading real-time logs...</td></tr>
          ) : filteredRecords.length === 0 ? (
            <tr><td colSpan="7">No records found.</td></tr>
          ) : (
            filteredRecords.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.name}</td>
                <td>{rec.date}</td>
                <td style={{color: rec.status === "Late" ? "#f59e0b" : "inherit"}}>{rec.checkIn}</td>
                <td>{rec.checkOut}</td>
                <td>
                  {rec.latitude ? (
                    <a 
                      href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{color: '#4dabf7', fontSize: '12px'}}
                    >
                      📍 View Map
                    </a>
                  ) : "-"}
                </td>
                <td><span className={`badge ${rec.status.toLowerCase()}`}>{rec.status}</span></td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(rec.id)}>Edit</button>
                  <button className="manual-btn" onClick={() => handleMark(rec.id)}>Mark</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="export-section">
        <button className="export-btn" onClick={() => handleExport("CSV")}>Export CSV</button>
        <button className="export-btn" onClick={() => handleExport("Excel")}>Export Excel</button>
        <button className="export-btn" onClick={() => handleExport("Print")}>Print</button>
      </div>
    </div>
  );
}