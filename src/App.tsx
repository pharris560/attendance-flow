import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import { AppProvider, useApp } from './contexts/AppContext';
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

/** Small error boundary to avoid white screens */
class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { hasError: boolean; error?: unknown }
> {
  state = { hasError: false, error: undefined as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, info: unknown) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { loading } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (location.pathname.startsWith('/attendance-check')) {
    return (
      <>
        <Routes>
          <Route path="/attendance-check" element={<AttendanceCheck />} />
        </Routes>
        <footer className="fixed bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs shadow">
          <BuildInfo />
        </footer>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ACE Attendance...</p>
        </div>
      </div>
    );
  }

  // Responsive: desktop = two columns; mobile = stacked with drawer
  return (
    <div className="min-h-dvh bg-gray-50 lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 lg:px-4 py-4 overflow-auto">
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
      </div>

      <footer className="fixed bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs shadow">
        <BuildInfo />
      </footer>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </AppProvider>
  );
}

export default App;
