import { useState } from 'react';
import HomePage from './components/homepage';
import LoginPage from './components/loginpage';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import { RoleOverlay } from './components/homepage';

const defaultCreds = {
  admin: { email: '', password: '', isSet: false, name: 'Administrator' },
  teacher: { email: '', password: '', isSet: false, name: 'Teacher' },
};

function App() {
  const [page, setPage] = useState('home');
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [showRoleOverlay, setShowRoleOverlay] = useState(false);
  const [portalCreds, setPortalCreds] = useState(defaultCreds);
  const [classTimetables, setClassTimetables] = useState({});
  const [ttChangelog, setTtChangelog] = useState([]);
  const [adminAnns, setAdminAnns] = useState([]);

  const updateCred = (role, data) => {
    setPortalCreds(prev => ({ ...prev, [role]: { ...prev[role], ...data } }));
  };

  const handleSignIn = () => setShowRoleOverlay(true);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setShowRoleOverlay(false);
    setPage('login');
  };

  const handleLogin = (role, userData) => {
    setUser(userData);
    // Save token to localStorage
    if (userData.token) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('role', role);
    }
    setPage(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
    setPage('home');
  };

  return (
    <>
      {page === 'home' && (
        <HomePage onSignIn={handleSignIn} setPage={setPage} />
      )}
      {showRoleOverlay && (
        <RoleOverlay
          onClose={() => setShowRoleOverlay(false)}
          onSelect={handleRoleSelect}
        />
      )}
      {page === 'login' && (
        <LoginPage
          role={role}
          onBack={() => setPage('home')}
          onLogin={handleLogin}
          portalCreds={portalCreds}
          updateCred={updateCred}
        />
      )}
      {page === 'admin' && (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          classTimetables={classTimetables}
          setClassTimetables={setClassTimetables}
          ttChangelog={ttChangelog}
          setTtChangelog={setTtChangelog}
          adminAnns={adminAnns}
          setAdminAnns={setAdminAnns}
        />
      )}
      {page === 'student' && (
        <StudentDashboard
          user={user}
          onLogout={handleLogout}
          classTimetables={classTimetables}
          adminAnns={adminAnns}
        />
      )}
      {page === 'teacher' && (
        <TeacherDashboard
          user={user}
          onLogout={handleLogout}
          classTimetables={classTimetables}
          setClassTimetables={setClassTimetables}
          ttChangelog={ttChangelog}
          setTtChangelog={setTtChangelog}
          adminAnns={adminAnns}
        />
      )}
    </>
  );
}

export default App;