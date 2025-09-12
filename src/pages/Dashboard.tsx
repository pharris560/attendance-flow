import React from 'react';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Dashboard: React.FC = () => {
  const { students, staff, classes, attendanceRecords } = useApp();

  // Simplified dashboard data - only essential calculations
  const dashboardData = useMemo(() => {
    const totalStudents = students.length;
    const totalStaff = staff.length;
    const totalClasses = classes.length;
    
    // Only calculate today's data - much faster
    const today = new Date().toDateString();
    const todayRecords = attendanceRecords.filter(record => 
      new Date(record.date).toDateString() === today
    );
    
    const todayStudentRecords = todayRecords.filter(record => record.type === 'student');
    const todayPresentStudents = todayStudentRecords.filter(record => record.status === 'present').length;
    const studentsWithAttendanceToday = new Set(todayStudentRecords.map(record => record.studentId)).size;
    const todayAttendanceRate = studentsWithAttendanceToday > 0 
      ? Math.round((todayPresentStudents / studentsWithAttendanceToday) * 100)
      : 0;

    // Attendance distribution data
    const attendanceDistribution = [];
    const hasAttendanceData = todayStudentRecords.length > 0;
    
    if (hasAttendanceData) {
      const presentCount = todayStudentRecords.filter(record => record.status === 'present').length;
      const absentCount = todayStudentRecords.filter(record => record.status === 'absent').length;
      const tardyCount = todayStudentRecords.filter(record => record.status === 'tardy').length;
      const excusedCount = todayStudentRecords.filter(record => record.status === 'excused').length;
      const otherCount = todayStudentRecords.filter(record => record.status === 'other').length;
      
      if (presentCount > 0) {
        attendanceDistribution.push({
          name: 'Present',
          value: presentCount,
          color: '#10B981'
        });
      }
      
      if (absentCount > 0) {
        attendanceDistribution.push({
          name: 'Absent',
          value: absentCount,
          color: '#EF4444'
        });
      }
      
      if (tardyCount > 0) {
        attendanceDistribution.push({
          name: 'Tardy',
          value: tardyCount,
          color: '#F59E0B'
        });
      }
      
      if (excusedCount > 0) {
        attendanceDistribution.push({
          name: 'Excused',
          value: excusedCount,
          color: '#3B82F6'
        });
      }
      
      if (otherCount > 0) {
        attendanceDistribution.push({
          name: 'Other',
          value: otherCount,
          color: '#8B5CF6'
        });
      }
    }

    return {
      totalStudents,
      totalStaff,
      totalClasses,
      todayPresentStudents,
      studentsWithAttendanceToday,
      todayAttendanceRate,
      attendanceDistribution,
      hasAttendanceData
    };
  }, [students.length, staff.length, classes.length, attendanceRecords.length]); // Only recalculate when counts change

  const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({
    title, value, icon: Icon, color
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your attendance management system</p>
      </div>

      {/* Stats Cards - Always show these first for immediate feedback */}
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
          title="Total Classes" 
          value={dashboardData.totalClasses.toString()} 
          icon={BookOpen} 
          color="bg-green-500"
        />
        <StatCard 
          title="Today's Rate" 
          value={`${dashboardData.todayAttendanceRate}%`} 
          icon={TrendingUp} 
          color="bg-orange-500"
        />
      </div>

      {/* Only show charts if we have attendance data */}
      {dashboardData.hasAttendanceData ? (
        <>
          {/* Attendance Distribution Chart - Only if we have data */}
          {dashboardData.attendanceDistribution.length > 0 && (
            <div className="mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 text-center">Attendance Distribution</h2>
                
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.attendanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          return percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : '';
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.attendanceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {dashboardData.attendanceDistribution.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2 text-base font-medium">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Class Attendance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {classes.map((cls, index) => {
                const classStudents = students.filter(student => student.classId === cls.id);
                const todayClassRecords = attendanceRecords.filter(record => 
                  record.type === 'student' &&
                  record.classId === cls.id &&
                  new Date(record.date).toDateString() === new Date().toDateString()
                );
                const presentCount = todayClassRecords.filter(record => record.status === 'present').length;
                const totalStudents = classStudents.length;
                const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
                
                // Color scheme for classes
                const colors = [
                  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                  { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
                  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
                  { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
                  { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
                  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
                  { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
                  { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
                ];
                const colorScheme = colors[index % colors.length];
                
                return (
                  <div key={cls.id} className={`p-4 ${colorScheme.bg} ${colorScheme.border} border rounded-lg`}>
                    <div className="text-center">
                      <h3 className={`font-semibold ${colorScheme.text} text-sm mb-2 truncate`} title={cls.name}>
                        {cls.name}
                      </h3>
                      <div className={`text-2xl font-bold ${colorScheme.text} mb-1`}>
                        {presentCount}/{totalStudents}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        Present Today
                      </div>
                      <div className={`text-sm font-medium ${colorScheme.text}`}>
                        {attendanceRate}% Rate
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Show message if no classes */}
              {classes.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No classes created yet</p>
                  <p className="text-sm">Add classes to see attendance by class</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* No data state - much faster to render */
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Attendance Data Yet</h2>
          <p className="text-gray-600 mb-6">Start taking attendance to see the distribution chart</p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{dashboardData.totalStudents} students ready</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <UserCheck className="h-4 w-4" />
              <span>{dashboardData.totalStaff} staff members ready</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <BookOpen className="h-4 w-4" />
              <span>{dashboardData.totalClasses} classes ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;