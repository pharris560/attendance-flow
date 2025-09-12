import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, Users, BookOpen, Clock, ClipboardCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../contexts/AppContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const Reports: React.FC = () => {
  const { students, classes, attendanceRecords } = useApp();
  const [selectedReport, setSelectedReport] = useState('attendance-summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const reportTypes = [
    { id: 'attendance-summary', name: 'Attendance Summary', icon: ClipboardCheck },
    { id: 'student-performance', name: 'Student Performance', icon: Users },
    { id: 'class-analytics', name: 'Class Analytics', icon: BookOpen },
    { id: 'daily-reports', name: 'Daily Reports', icon: Calendar },
    { id: 'trends-analysis', name: 'Trends Analysis', icon: TrendingUp },
  ];

  // Filter records based on date range and class
  const filteredRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    const withinDateRange = recordDate >= startDate && recordDate <= endDate;
    const matchesClass = !selectedClass || record.classId === selectedClass;
    const matchesStudent = !selectedStudent || record.studentId === selectedStudent;
    
    return withinDateRange && matchesClass && matchesStudent;
  });

  // Get students for selected class
  const studentsInSelectedClass = selectedClass 
    ? students.filter(student => student.classId === selectedClass)
    : [];

  // Reset student selection when class changes
  React.useEffect(() => {
    setSelectedStudent('');
  }, [selectedClass]);

  // Generate report data
  const generateAttendanceSummary = () => {
    const summary = {
      totalRecords: filteredRecords.length,
      present: filteredRecords.filter(r => r.status === 'present').length,
      absent: filteredRecords.filter(r => r.status === 'absent').length,
      tardy: filteredRecords.filter(r => r.status === 'tardy').length,
      excused: filteredRecords.filter(r => r.status === 'excused').length,
      other: filteredRecords.filter(r => r.status === 'other').length,
    };

    const attendanceRate = summary.totalRecords > 0 
      ? ((summary.present + summary.excused) / summary.totalRecords * 100).toFixed(1)
      : '0';

    return { ...summary, attendanceRate };
  };

  const generateStudentPerformance = () => {
    const studentStats = students.map(student => {
      const studentRecords = filteredRecords.filter(r => r.studentId === student.id);
      const present = studentRecords.filter(r => r.status === 'present').length;
      const total = studentRecords.length;
      const attendanceRate = total > 0 ? (present / total * 100).toFixed(1) : '0';
      
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        className: classes.find(c => c.id === student.classId)?.name || 'No Class',
        totalRecords: total,
        present,
        absent: studentRecords.filter(r => r.status === 'absent').length,
        tardy: studentRecords.filter(r => r.status === 'tardy').length,
        attendanceRate: parseFloat(attendanceRate)
      };
    });

    return studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate);
  };

  const generateClassAnalytics = () => {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      const classRecords = filteredRecords.filter(r => r.classId === cls.id);
      const present = classRecords.filter(r => r.status === 'present').length;
      const total = classRecords.length;
      const attendanceRate = total > 0 ? (present / total * 100).toFixed(1) : '0';
      
      return {
        id: cls.id,
        name: cls.name,
        studentCount: classStudents.length,
        totalRecords: total,
        present,
        absent: classRecords.filter(r => r.status === 'absent').length,
        attendanceRate: parseFloat(attendanceRate)
      };
    });
  };

  const generateTrendsData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayRecords = attendanceRecords.filter(r => 
        new Date(r.date).toISOString().split('T')[0] === date
      );
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        present: dayRecords.filter(r => r.status === 'present').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
        tardy: dayRecords.filter(r => r.status === 'tardy').length,
        total: dayRecords.length
      };
    });
  };

  const exportReport = (reportData: any, filename: string) => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportPDF = async (reportType: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add header
    pdf.setFontSize(20);
    pdf.text('ACE Attendance - Reports & Analytics', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Report Type: ${reportTypes.find(r => r.id === reportType)?.name || reportType}`, 20, 45);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
    pdf.text(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`, 20, 65);
    
    if (selectedClass) {
      const className = classes.find(c => c.id === selectedClass)?.name || 'Unknown Class';
      pdf.text(`Class: ${className}`, 20, 75);
    }
    
    if (selectedStudent) {
      const student = students.find(s => s.id === selectedStudent);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
      pdf.text(`Student: ${studentName}`, 20, 85);
    }
    
    let yPosition = selectedStudent ? 100 : (selectedClass ? 90 : 80);
    
    // Add content based on report type
    if (reportType === 'attendance-summary') {
      const summary = generateAttendanceSummary();
      
      pdf.setFontSize(16);
      pdf.text('Attendance Summary', 20, yPosition);
      yPosition += 20;
      
      pdf.setFontSize(12);
      pdf.text(`Total Records: ${summary.totalRecords}`, 20, yPosition);
      pdf.text(`Present: ${summary.present}`, 20, yPosition + 10);
      pdf.text(`Absent: ${summary.absent}`, 20, yPosition + 20);
      pdf.text(`Tardy: ${summary.tardy}`, 20, yPosition + 30);
      pdf.text(`Excused: ${summary.excused}`, 20, yPosition + 40);
      pdf.text(`Other: ${summary.other}`, 20, yPosition + 50);
      pdf.text(`Overall Attendance Rate: ${summary.attendanceRate}%`, 20, yPosition + 70);
      
    } else if (reportType === 'student-performance') {
      const performance = generateStudentPerformance();
      
      pdf.setFontSize(16);
      pdf.text('Student Performance Report', 20, yPosition);
      yPosition += 20;
      
      const tableData = performance.map(student => [
        student.name,
        student.className,
        student.present.toString(),
        student.absent.toString(),
        student.tardy.toString(),
        student.totalRecords.toString(),
        `${student.attendanceRate}%`
      ]);
      
      (pdf as any).autoTable({
        head: [['Student', 'Class', 'Present', 'Absent', 'Tardy', 'Total', 'Rate']],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });
      
    } else if (reportType === 'class-analytics') {
      const analytics = generateClassAnalytics();
      
      pdf.setFontSize(16);
      pdf.text('Class Analytics Report', 20, yPosition);
      yPosition += 20;
      
      const tableData = analytics.map(cls => [
        cls.name,
        cls.studentCount.toString(),
        cls.totalRecords.toString(),
        cls.present.toString(),
        cls.absent.toString(),
        `${cls.attendanceRate}%`
      ]);
      
      (pdf as any).autoTable({
        head: [['Class', 'Students', 'Total Records', 'Present', 'Absent', 'Rate']],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });
      
    } else if (reportType === 'daily-reports') {
      pdf.setFontSize(16);
      pdf.text('Daily Attendance Report', 20, yPosition);
      yPosition += 20;
      
      const dailyData = filteredRecords.slice(0, 20).map(record => {
        const student = students.find(s => s.id === record.studentId);
        const className = classes.find(c => c.id === record.classId)?.name;
        const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown';
        const status = record.status === 'other' ? (record.customLabel || 'Other') : record.status;
        
        return [
          studentName,
          className || 'Unknown Class',
          status,
          new Date(record.timestamp).toLocaleTimeString()
        ];
      });
      
      (pdf as any).autoTable({
        head: [['Student', 'Class', 'Status', 'Time']],
        body: dailyData,
        startY: yPosition,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    // Add footer
    pdf.setFontSize(8);
    pdf.text('Generated by ACE Attendance', pageWidth - 60, pageHeight - 10);
    
    // Save the PDF
    const filename = `${reportType.replace('-', '_')}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  };

  const attendanceSummary = generateAttendanceSummary();
  const studentPerformance = generateStudentPerformance();
  const classAnalytics = generateClassAnalytics();
  const trendsData = generateTrendsData();

  const pieChartData = [
    { name: 'Present', value: attendanceSummary.present, color: '#10B981' },
    { name: 'Absent', value: attendanceSummary.absent, color: '#F87171' },
    { name: 'Tardy', value: attendanceSummary.tardy, color: '#F59E0B' },
    { name: 'Excused', value: attendanceSummary.excused, color: '#38BDF8' },
    { name: 'Other', value: attendanceSummary.other, color: '#FB923C' },
  ];

  return (
    <div className="p-4 lg:p-4">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Generate comprehensive attendance reports and insights</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedStudent('');
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          
          {selectedClass && studentsInSelectedClass.length > 0 && (
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">All Students</option>
              {studentsInSelectedClass.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
        {/* Report Types Sidebar */}
        <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Report Types</h2>
          </div>
          <div className="p-2 grid grid-cols-2 lg:grid-cols-1 gap-1">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 lg:mb-1 ${
                    selectedReport === report.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {report.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1">
          {selectedReport === 'attendance-summary' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Attendance Summary</h2>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => exportReport(attendanceSummary, 'attendance_summary')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export JSON</span>
                      <span className="sm:hidden">JSON</span>
                    </button>
                    <button
                      onClick={() => exportPDF('attendance-summary')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Export PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{attendanceSummary.totalRecords}</p>
                    <p className="text-sm text-gray-600">Total Records</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{attendanceSummary.absent}</p>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{attendanceSummary.tardy}</p>
                    <p className="text-sm text-gray-600">Tardy</p>
                  </div>
                  <div className="text-center p-4 bg-sky-50 rounded-lg">
                    <p className="text-2xl font-bold text-sky-500">{attendanceSummary.excused}</p>
                    <p className="text-sm text-gray-600">Excused</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-500">{attendanceSummary.other}</p>
                    <p className="text-sm text-gray-600">Other</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-600 mb-2">
                        {attendanceSummary.attendanceRate}%
                      </div>
                      <p className="text-lg text-gray-600">Overall Attendance Rate</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Based on {attendanceSummary.totalRecords} total records
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'student-performance' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Student Performance Report</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportCSV(studentPerformance, 'student_performance')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => exportPDF('student-performance')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Class</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Present</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Absent</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Tardy</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Total</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPerformance.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                        <td className="py-3 px-4 text-gray-600">{student.className}</td>
                        <td className="py-3 px-4 text-center text-green-600 font-medium">{student.present}</td>
                        <td className="py-3 px-4 text-center text-red-500 font-medium">{student.absent}</td>
                        <td className="py-3 px-4 text-center text-amber-600 font-medium">{student.tardy}</td>
                        <td className="py-3 px-4 text-center font-medium">{student.totalRecords}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            student.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                            student.attendanceRate >= 80 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {student.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'class-analytics' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Class Analytics Report</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => exportCSV(classAnalytics, 'class_analytics')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </button>
                  <button
                    onClick={() => exportPDF('class-analytics')}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {classAnalytics.map((cls) => (
                  <div key={cls.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{cls.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium">{cls.studentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Records:</span>
                        <span className="font-medium">{cls.totalRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Present:</span>
                        <span className="font-medium text-green-600">{cls.present}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Absent:</span>
                        <span className="font-medium text-red-500">{cls.absent}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Attendance Rate:</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          cls.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                          cls.attendanceRate >= 80 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cls.attendanceRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedReport === 'trends-analysis' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">7-Day Attendance Trends</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportCSV(trendsData, 'attendance_trends')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => exportPDF('trends-analysis')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} name="Present" />
                  <Line type="monotone" dataKey="absent" stroke="#F87171" strokeWidth={2} name="Absent" />
                  <Line type="monotone" dataKey="tardy" stroke="#F59E0B" strokeWidth={2} name="Tardy" />
                  <Line type="monotone" dataKey="total" stroke="#6B7280" strokeWidth={2} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedReport === 'daily-reports' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Daily Attendance Report</h2>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => exportReport(filteredRecords, 'daily_report')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={() => exportPDF('daily-reports')}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredRecords.slice(0, 20).map((record) => {
                  const student = students.find(s => s.id === record.studentId);
                  const className = classes.find(c => c.id === record.classId)?.name;
                  
                  return (
                    <div key={record.id} className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          record.status === 'present' ? 'bg-green-500' :
                          record.status === 'absent' ? 'bg-red-400' :
                          record.status === 'tardy' ? 'bg-amber-500' :
                          record.status === 'excused' ? 'bg-sky-400' : 'bg-orange-400'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                          </p>
                          <p className="text-sm text-gray-500">{className}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {record.status === 'other' ? record.customLabel || 'Other' : record.status}
                        </p>
                        <p className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;