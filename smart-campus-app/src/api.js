const API_URL = 'http://localhost:5000/api';

// Auth
export const loginUser = (data) => fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(res => res.json());

// Students
export const getStudents = () => fetch(`${API_URL}/students`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(res => res.json());

export const addStudent = (data) => fetch(`${API_URL}/students`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify(data)
}).then(res => res.json());

// Teachers
export const getTeachers = () => fetch(`${API_URL}/teachers`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(res => res.json());

export const addTeacher = (data) => fetch(`${API_URL}/teachers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify(data)
}).then(res => res.json());

// Attendance
export const markAttendance = (data) => fetch(`${API_URL}/attendance`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify(data)
}).then(res => res.json());

export const getStudentAttendance = (studentId) => fetch(`${API_URL}/attendance/student/${studentId}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(res => res.json());

// Assignments
export const getAssignments = (className) => fetch(`${API_URL}/assignments/class/${className}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(res => res.json());

export const createAssignment = (data) => fetch(`${API_URL}/assignments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify(data)
}).then(res => res.json());

// Results
export const getStudentResults = (studentId) => fetch(`${API_URL}/results/student/${studentId}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(res => res.json());

export const addResult = (data) => fetch(`${API_URL}/results`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify(data)
}).then(res => res.json());