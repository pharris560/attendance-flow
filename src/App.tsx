const AppContent: React.FC = () => {
  const { loading } = useApp();

  // route guard first
  const isAttendanceCheck = window.location.pathname === '/attendance-check';
  if (isAttendanceCheck) {
    return (
      <Routes>
        <Route path="/attendance-check" element={<AttendanceCheck />} />
      </Routes>
    );
  }

  // loading guard next
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

  // main layout + footer last
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
