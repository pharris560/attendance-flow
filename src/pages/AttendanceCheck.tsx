import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, UserCheck, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Student, Staff } from '../types';

const AttendanceCheck: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { students, staff, classes, markAttendance } = useApp();
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    person?: any;
    type?: 'student' | 'staff';
  } | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    console.log('AttendanceCheck component mounted');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    processAttendance();
  }, []);

  const processAttendance = async () => {
    try {
      console.log('Processing attendance from QR code...');
      console.log('Current app mode check:');
      console.log('- Total students in system:', students.length);
      console.log('- Total staff in system:', staff.length);
      console.log('- Available students:', students.map(s => `${s.firstName} ${s.lastName} (ID: ${s.id.substring(0, 8)})`));
      console.log('- Available staff:', staff.map(s => `${s.firstName} ${s.lastName} (ID: ${s.id.substring(0, 8)})`));
      
      console.log('Search params:', {
        type: searchParams.get('type'),
        id: searchParams.get('id'),
        name: searchParams.get('name'),
        class: searchParams.get('class')
      });
      
      const type = searchParams.get('type') as 'student' | 'staff';
      const id = searchParams.get('id');
      const name = searchParams.get('name');
      const classOrDepartment = searchParams.get('class');
      const timestamp = searchParams.get('timestamp');

      if (!type || !id || !name) {
        console.error('Missing required parameters:', { type, id, name });
        throw new Error('Missing required parameters. Please scan a valid QR code from the ACE Attendance app.');
      }

      console.log('Looking for person:', { type, id });
      
      // Find the person
      const person = type === 'student' 
        ? students.find(s => s.id === id)
        : staff.find(s => s.id === id);

      if (!person) {
        console.error(`${type} not found with ID: ${id}`);
        console.error('❌ PERSON NOT FOUND BY ID');
        console.log('🔍 This could mean:');
        console.log('1. The QR code is from a different database/system');
        console.log('2. The person was deleted from the current system');
        console.log('3. The app is running in demo mode but QR code is from real database');
        console.log('4. The app is connected to real database but QR code is from demo data');
        
        // Try to find by name as fallback
        const personByName = type === 'student' 
          ? students.find(s => `${s.firstName} ${s.lastName}` === name)
          : staff.find(s => `${s.firstName} ${s.lastName}` === name);
          
        if (personByName) {
          console.log('✅ Found person by name as fallback:', personByName);
          // Use the person found by name and mark attendance in their assigned class
          const attendanceData: any = {
            status: 'present' as const,
            date: new Date(),
            type: type
          };

          if (type === 'student') {
            const student = personByName as Student;
            attendanceData.studentId = student.id;
            attendanceData.classId = student.classId;
          } else {
            const staffMember = personByName as Staff;
            attendanceData.staffId = staffMember.id;
            attendanceData.department = staffMember.department;
          }

          await markAttendance(attendanceData);

          const locationInfo = type === 'student' 
            ? classes.find(c => c.id === (personByName as Student).classId)?.name || 'No class assigned'
            : (personByName as Staff).department;

          setStatus({
            success: true,
            message: `✅ ${personByName.firstName} ${personByName.lastName} has been marked as "Present" in ${locationInfo}!\n\n(Note: Matched by name - QR code ID didn't match current system)`,
            person: personByName,
            type
          });
          
          setTimeout(() => {
            navigate('/');
          }, 5000);
          return;
        }
        
        // Provide more helpful error message
        const currentMode = students.length <= 6 ? 'DEMO MODE' : 'DATABASE MODE';
        throw new Error(`${type === 'student' ? 'Student' : 'Staff member'} "${name}" not found.\n\nPossible causes:\n• QR code is from a different system\n• Person was removed from current system\n• App is in ${currentMode} but QR code is from different mode\n\nCurrent system has ${students.length} students and ${staff.length} staff members.`);
      }

      console.log('Found person:', person);
      
      // Mark attendance as present
      const attendanceData: any = {
        status: 'present' as const,
        date: new Date(),
        type: type
      };

      if (type === 'student') {
        const student = person as Student;
        attendanceData.studentId = student.id;
        attendanceData.classId = student.classId;
        
        // Ensure the student has a class assigned
        if (!student.classId) {
          console.warn('Student has no class assigned:', student);
        }
      } else {
        const staffMember = person as Staff;
        attendanceData.staffId = staffMember.id;
        attendanceData.department = staffMember.department;
        // For staff, we don't assign to a specific class, but use department
      }

      console.log('Marking attendance:', attendanceData);
      await markAttendance(attendanceData);
      console.log('Attendance marked successfully');

      // Get class/department info for success message
      const locationInfo = type === 'student' 
        ? classes.find(c => c.id === (person as Student).classId)?.name || 'No class assigned'
        : (person as Staff).department;

      setStatus({
        success: true,
        message: `✅ ${person.firstName} ${person.lastName} has been marked as "Present" in ${locationInfo}!`,
        person,
        type
      });
      
      // Auto-redirect after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);

    } catch (error) {
      console.error('Error processing attendance:', error);
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process attendance'
      });
    } finally {
      setProcessing(false);
    }
  };

  const goToDashboard = () => {
    navigate('/');
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 lg:p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          {status?.success ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          
          <h1 className={`text-xl lg:text-2xl font-bold mb-2 ${
            status?.success ? 'text-green-900' : 'text-red-900'
          }`}>
            {status?.success ? 'Attendance Recorded!' : 'Error'}
          </h1>
          
          <p className={`text-base lg:text-lg ${
            status?.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {status?.message}
          </p>
        </div>

        {status?.person && status?.type && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              {status.type === 'student' ? (
                <Users className="h-5 w-5 text-blue-600" />
              ) : (
                <UserCheck className="h-5 w-5 text-purple-600" />
              )}
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                status.type === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {status.type === 'student' ? 'Student' : 'Staff'}
              </span>
            </div>
            
            <p className="font-medium text-gray-900">
              {status.person.firstName} {status.person.lastName}
            </p>
            
            {status.type === 'student' && (
              <p className="text-sm text-gray-600">
                Class: {classes.find(c => c.id === status.person.classId)?.name || 'No class assigned'}
              </p>
            )}
            
            {status.type === 'staff' && (
              <p className="text-sm text-gray-600">
                Department: {status.person.department}
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Marked at: {new Date().toLocaleString()}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={goToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 lg:px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </button>
          
          <p className="text-xs lg:text-sm text-gray-500">
            This window will automatically redirect in 10 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCheck;