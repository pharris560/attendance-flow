import React, { useState } from 'react';
import { Calendar, Filter, Clock, UserCheck, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import AttendanceButton from '../components/AttendanceButton';

const StaffAttendance: React.FC = () => {
  const { staff, attendanceRecords, markAttendance } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [showCustomLabelModal, setShowCustomLabelModal] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<any>(null);

  // Get unique departments
  const departments = Array.from(new Set(staff.map(s => s.department))).sort();

  // Filter staff by department
  const filteredStaff = selectedDepartment 
    ? staff.filter(s => s.department === selectedDepartment)
    : staff;

  const getTodaysAttendance = (staffId: string) => {
    return attendanceRecords.find(record => 
      record.staffId === staffId && 
      record.type === 'staff' &&
      new Date(record.date).toISOString().split('T')[0] === selectedDate
    );
  };

  const handleAttendanceClick = (staffMember: any, status: 'present' | 'absent' | 'tardy' | 'excused' | 'other') => {
    if (status === 'other') {
      setPendingRecord({ 
        staffId: staffMember.id, 
        department: staffMember.department, 
        status, 
        date: new Date(selectedDate),
        type: 'staff'
      });
      setShowCustomLabelModal(true);
      return;
    }

    markAttendance({
      staffId: staffMember.id,
      department: staffMember.department,
      status,
      date: new Date(selectedDate),
      type: 'staff',
    });
  };

  const handleCustomLabelSubmit = () => {
    if (pendingRecord && customLabel.trim()) {
      markAttendance({
        ...pendingRecord,
        customLabel: customLabel.trim(),
      });
      setShowCustomLabelModal(false);
      setCustomLabel('');
      setPendingRecord(null);
    }
  };

  return (
    <div className="p-4 lg:p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Staff Attendance</h1>
        <p className="text-gray-600 mt-2">Mark attendance for staff members</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Staff Attendance - {new Date(selectedDate).toLocaleDateString()}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredStaff.length} staff members
            {selectedDepartment && ` in ${selectedDepartment}`}
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredStaff.map((staffMember) => {
            const attendance = getTodaysAttendance(staffMember.id);
            
            return (
              <div key={staffMember.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {staffMember.firstName[0]}{staffMember.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {staffMember.firstName} {staffMember.lastName}
                      </h3>
                      <div className="mt-1">
                        <p className="text-sm text-purple-600 font-medium">{staffMember.position}</p>
                        <p className="text-sm text-gray-500">{staffMember.department}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {attendance && (
                      <div className="mr-4 text-sm text-gray-500">
                        <span className="font-medium">Status: </span>
                        <span className={`capitalize px-2 py-1 rounded text-xs font-medium ${
                          attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                          attendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                          attendance.status === 'tardy' ? 'bg-amber-100 text-amber-800' :
                          attendance.status === 'excused' ? 'bg-sky-100 text-sky-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {attendance.status === 'other' ? attendance.customLabel || 'Other' : attendance.status}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">(Click to change)</span>
                        <span className="ml-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(attendance.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    <AttendanceButton
                      status="present"
                      label="Present"
                      onClick={() => handleAttendanceClick(staffMember, 'present')}
                      active={attendance?.status === 'present'}
                    />
                    <AttendanceButton
                      status="absent"
                      label="Absent"
                      onClick={() => handleAttendanceClick(staffMember, 'absent')}
                      active={attendance?.status === 'absent'}
                    />
                    <AttendanceButton
                      status="tardy"
                      label="Tardy"
                      onClick={() => handleAttendanceClick(staffMember, 'tardy')}
                      active={attendance?.status === 'tardy'}
                    />
                    <AttendanceButton
                      status="excused"
                      label="Excused"
                      onClick={() => handleAttendanceClick(staffMember, 'excused')}
                      active={attendance?.status === 'excused'}
                    />
                    <AttendanceButton
                      status="other"
                      label="Other"
                      onClick={() => handleAttendanceClick(staffMember, 'other')}
                      active={attendance?.status === 'other'}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-500">
              {selectedDepartment 
                ? `No staff members in ${selectedDepartment} department`
                : "Add staff members to start taking attendance"
              }
            </p>
          </div>
        )}
      </div>

      {/* Custom Label Modal */}
      {showCustomLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Attendance Label</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter a custom label for this attendance status:
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g., Training, Meeting, Sick Leave, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCustomLabelModal(false);
                  setCustomLabel('');
                  setPendingRecord(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomLabelSubmit}
                disabled={!customLabel.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendance;