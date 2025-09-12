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

/** Simple in-file error boundary so runtime errors don't render a blank page */
class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { hasError: boolean; error?: unknown }
> {
  state = { hasError: false as boolean, error: undefined as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Visible in the browser console & Netlify logs (SSR/edge) if applicable
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded">
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { loading } = useApp();
  const location = useLocation();

  // Dedicated lightweight route for QR/attendance flow
  const isAttendanceCheck = location.pathname.startsWith('/attendance-check');
  if (isAttendanceCheck) {
    return (
      <>
        <Routes>
          <Route path="/attendance-check" element={<AttendanceCheck />} />
        </Routes>

        {/* Build stamp (handy while debugging deploys) */}
        <footer className="fixed bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs shadow">
          <BuildInfo />
        </footer>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ACE Attendance...</p>
        </div>
      </div>
    );
  }

  // Main app layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar should be fixed in its own component; we add left padding for content */}
      <Sidebar />

      {/* Push content to the right of a 16rem (w-64) sidebar; adjust if your Sidebar width differs */}
      <div className="pl-64">
        {/* Keep header sticky and reasonably short inside the component */}
        <Header />

        <main className="p-6">
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
            {/* Keep this here as well so deep links still resolve inside the shell */}
            <Route path="/attendance-check" element={<AttendanceCheck />} />
          </Routes>
        </main>
      </div>

      {/* Build stamp (always visible for now; remove if you want to hide in prod) */}
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
