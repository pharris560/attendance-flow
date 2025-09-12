import React from 'react';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Dashboard: React.FC = () => {
  const { students, staff, classes, attendanceRecords } = useApp();

  // Memoize expensive calculations
  const dashboardData = useMemo(() => {
    // Calculate statistics
    const totalStudents = students.length;
    const totalStaff = staff.length;
    const totalClasses = classes.length;
    
    // Get today's attendance records
    const todayRecords = attendanceRecords.filter(record => 
      new Date(record.date).toDateString() === new Date().toDateString()
    );
    
    // Count students present today (only student records)
    const todayStudentRecords = todayRecords.filter(record => record.type === 'student');
    const todayPresentStudents = todayStudentRecords.filter(record => 
      record.type === 'student' && record.status === 'present'
    ).length;
    
    // Get unique students who had attendance taken today
    const studentsWithAttendanceToday = new Set(
      todayStudentRecords.map(record => record.studentId)
    ).size;
    
    // Calculate attendance rate for today
    const todayAttendanceRate = studentsWithAttendanceToday > 0 
      ? Math.round((todayPresentStudents / studentsWithAttendanceToday) * 100)
      : 0;

    // Attendance data for charts
    const attendanceByStatus = [
      { name: 'Present', value: attendanceRecords.filter(r => r.status === 'present').length, color: '#10B981' },
      { name: 'Absent', value: attendanceRecords.filter(r => r.status === 'absent').length, color: '#F87171' },
      { name: 'Tardy', value: attendanceRecords.filter(r => r.status === 'tardy').length, color: '#F59E0B' },
      { name: 'Excused', value: attendanceRecords.filter(r => r.status === 'excused').length, color: '#38BDF8' },
      { name: 'Other', value: attendanceRecords.filter(r => r.status === 'other').length, color: '#FB923C' },
    ];

    return {
      totalStudents,
      totalStaff,
      totalClasses,
      todayPresentStudents,
      studentsWithAttendanceToday,
      todayAttendanceRate,
      attendanceByStatus
    };
  }, [students, staff, classes, attendanceRecords]);
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

      {/* Attendance Distribution Chart */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 text-center">Attendance Distribution</h2>
          
          {/* Legend at top for mobile */}
          <div className="mb-4 flex flex-wrap justify-center gap-2 lg:hidden">
            {attendanceByStatus.filter(item => item.value > 0).map((item) => (
              <div key={item.name} className="flex items-center space-x-2 text-sm font-medium">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={attendanceByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => {
                  // Only show labels on desktop
                  if (window.innerWidth < 1024) return '';
                  return percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : '';
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {attendanceByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          </div>
          
          {/* Legend at bottom for desktop */}
          <div className="mt-4 hidden lg:flex flex-wrap justify-center gap-3">
            {attendanceByStatus.filter(item => item.value > 0).map((item) => (
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
            const classRecords = attendanceRecords.filter(record => record.classId === cls.id);
            const classStudents = students.filter(student => student.classId === cls.id);
            
            // For Staff class, use staff records instead
            const isStaffClass = cls.name === 'Staff';
            const relevantRecords = isStaffClass 
              ? attendanceRecords.filter(record => record.type === 'staff')
              : classRecords;
            
            const pieData = [
              { name: 'Present', value: relevantRecords.filter(r => r.status === 'present').length, color: '#10B981' },
              { name: 'Absent', value: relevantRecords.filter(r => r.status === 'absent').length, color: '#F87171' },
              { name: 'Tardy', value: relevantRecords.filter(r => r.status === 'tardy').length, color: '#F59E0B' },
              { name: 'Excused', value: relevantRecords.filter(r => r.status === 'excused').length, color: '#38BDF8' },
              { name: 'Other', value: relevantRecords.filter(r => r.status === 'other').length, color: '#FB923C' },
            ];
            
            const totalRecords = relevantRecords.length;
            const presentCount = pieData[0].value;
            const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0';
            const memberCount = isStaffClass ? staff.length : classStudents.length;
            
            return (
              <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                    <p className="text-sm text-gray-500">
                      {memberCount} {isStaffClass ? 'staff members' : 'students'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isStaffClass ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {isStaffClass ? (
                      <UserCheck className="h-5 w-5 text-white" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
                
                {totalRecords > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData.filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [value, name]}
                          labelStyle={{ color: '#374151' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                        <span className={`text-sm font-bold ${
                          parseFloat(attendanceRate) >= 90 ? 'text-green-600' :
                          parseFloat(attendanceRate) >= 80 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {attendanceRate}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {pieData.filter(item => item.value > 0).map((item) => (
                          <div key={item.name} className="flex items-center space-x-1 text-sm font-medium">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-600">{item.name}: {item.value}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Total Records: {totalRecords}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <Calendar className="h-12 w-12 mb-2" />
                    <p className="text-sm">No attendance data</p>
                    <p className="text-xs">Start taking attendance to see charts</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {classes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-500">Create classes to see attendance overview charts</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;