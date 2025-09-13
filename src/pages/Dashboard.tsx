// src/pages/Dashboard.tsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Dashboard: React.FC = () => {
  const { students, staff, classes, attendanceRecords } = useApp();

  // Memoize expensive calculations
  const dashboardData = useMemo(() => {
    // Basic counts
    const totalStudents = students.length;
    const totalStaff = staff.length;
    const totalClasses = classes.length;

    // Today's records
    const todayStr = new Date().toDateString();
    const todayRecords = attendanceRecords.filter(
      (record) => new Date(record.date).toDateString() === todayStr
    );

    // Students only (today)
    const todayStudentRecords = todayRecords.filter((record) => record.type === 'student');
    const todayPresentStudents = todayStudentRecords.filter((r) => r.status === 'present').length;

    // Unique students with attendance today
    const studentsWithAttendanceToday = new Set(
      todayStudentRecords.map((r) => r.studentId)
    ).size;

    // Attendance rate
    const todayAttendanceRate =
      studentsWithAttendanceToday > 0
        ? Math.round((todayPresentStudents / studentsWithAttendanceToday) * 100)
        : 0;

    // Global (all-time) status totals (used elsewhere if needed)
    const attendanceByStatus = [
      { name: 'Present', value: attendanceRecords.filter((r) => r.status === 'present').length, color: '#10B981' },
      { name: 'Absent',  value: attendanceRecords.filter((r) => r.status === 'absent').length,  color: '#F87171' },
      { name: 'Tardy',   value: attendanceRecords.filter((r) => r.status === 'tardy').length,   color: '#F59E0B' },
      { name: 'Excused', value: attendanceRecords.filter((r) => r.status === 'excused').length, color: '#38BDF8' },
      { name: 'Other',   value: attendanceRecords.filter((r) => r.status === 'other').length,   color: '#FB923C' },
    ];

    return {
      totalStudents,
      totalStaff,
      totalClasses,
      todayPresentStudents,
      studentsWithAttendanceToday,
      todayAttendanceRate,
      attendanceByStatus,
      todayStr,
    };
  }, [students, staff, classes, attendanceRecords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          value={dashboardData.totalStudents.toString()}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Staff"
          value={dashboardData.totalStaff.toString()}
          icon={UserCheck}
          color="bg-purple-500"
        />
        <StatCard
          title="Today's Attendance"
          value={`${dashboardData.todayPresentStudents}/${dashboardData.studentsWithAttendanceToday}`}
          icon={Calendar}
          color="bg-green-500"
        />
        <StatCard
          title="Attendance Rate"
          value={`${dashboardData.todayAttendanceRate}%`}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Class-specific Pie Charts */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Class Attendance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => {
            // Filter records for this class (all-time). If you want **today only**, also match date === today.
            const classRecords = attendanceRecords.filter(
              (record) => record.classId === cls.id
              // && new Date(record.date).toDateString() === dashboardData.todayStr  // <-- uncomment for "today only"
            );

            // "Staff" card shows staff records instead of a class
            const isStaffClass = cls.name === 'Staff';
            const relevantRecords = isStaffClass
              ? attendanceRecords.filter(
                  (record) =>
                    record.type === 'staff'
                    // && new Date(record.date).toDateString() === dashboardData.todayStr // <-- today-only option
                )
              : classRecords;

            const pieData = [
              { name: 'Present', value: relevantRecords.filter((r) => r.status === 'present').length, color: '#10B981' },
              { name: 'Absent',  value: relevantRecords.filter((r) => r.status === 'absent').length,  color: '#F87171' },
              { name: 'Tardy',   value: relevantRecords.filter((r) => r.status === 'tardy').length,   color: '#F59E0B' },
              { name: 'Excused', value: relevantRecords.filter((r) => r.status === 'excused').length, color: '#38BDF8' },
            ];

            const filteredPieData = pieData.filter((d) => d.value > 0);

            return (
              <div key={cls.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{cls.name}</h3>

                {/* Legend (top, mobile) — uses class-scoped data */}
                <div className="mb-4 flex flex-wrap justify-center gap-2 lg:hidden">
                  {filteredPieData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2 text-sm font-medium">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pie */}
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredPieData} // <-- per-class data (fix)
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                      >
                        {filteredPieData.map((entry, index) => (
                          <Cell key={`cell-${cls.id}-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend (bottom, desktop) — uses class-scoped data */}
                <div className="mt-4 hidden lg:flex flex-wrap justify-center gap-2">
                  {filteredPieData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2 text-sm font-medium">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} rounded-md p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
