import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { useApp } from './contexts/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import StaffAttendance from './pages/StaffAttendance';
import Classes from './pages/Classes';
import QRScanner from './pages/QRScanner';
import QRCodes from './pages/QRCodes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AttendanceCheck from './pages/AttendanceCheck';
import BuildInfo from './components/BuildInfo';

const AppContent: React.FC = () => {
  const { loading } = useApp();

  // show dedicated screen for QR check route
  const isAttendanceCheck = window.location.pathname === '/attendance-check';
  if (isAttendanceCheck) {
    return (
      <Routes>
        <Route path="/attendance-check" element={<AttendanceCheck />} />
      </Routes>
    );
  }

  // loading gate
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AttendanceFlow...</p>
        </div>
      </div>
    );
  }

  // main layout
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/staff-attendance" element={<StaffAttendance />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/qr-codes" element={<QRCodes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/attendance-check" element={<AttendanceCheck />} />
        </Routes>
      </main>

      <footer className="p-3 text-xs text-gray-500 opacity-60">
        {import.meta.env.MODE !== 'production' && <BuildInfo />}
      </footer>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
