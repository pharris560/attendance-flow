import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, Users, ArrowLeft, Calendar, Clock, Filter, UserPlus, UserMinus, UserCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import AttendanceButton from '../components/AttendanceButton';

const Classes: React.FC = () => {
  const { classes, students, staff, addClass, updateClass, deleteClass, attendanceRecords, markAttendance, updateStudent } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customLabel, setCustomLabel] = useState<string>('');
  const [showCustomLabelModal, setShowCustomLabelModal] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<any>(null);
  const [showStudentManagementModal, setShowStudentManagementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacherId: 'teacher1', // Default teacher
  });

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateClass(editingClass, formData);
    } else {
      addClass(formData);
    }
    setShowModal(false);
    setEditingClass(null);
    setFormData({ name: '', description: '', teacherId: 'teacher1' });
  };

  const handleEdit = (cls: any) => {
    setFormData({
      name: cls.name,
      description: cls.description,
      teacherId: cls.teacherId,
    });
    setEditingClass(cls.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setClassToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (classToDelete) {
      deleteClass(classToDelete);
    }
    setShowDeleteModal(false);
    setClassToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setClassToDelete(null);
  };

  const getStudentCount = (classId: string) => {
    return students.filter(student => student.classId === classId).length;
  };

  const handleClassClick = (classId: string) => {
    setSelectedClass(classId);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
  };

  // Attendance functionality
  const classStudents = selectedClass 
    ? students.filter(student => student.classId === selectedClass)
    : [];

  const getTodaysAttendance = (studentId: string) => {
    return attendanceRecords.find(record => 
      record.studentId === studentId && 
      record.type === 'student' &&
      new Date(record.date).toISOString().split('T')[0] === selectedDate
    );
  };

  const handleAttendanceClick = async (student: any, status: 'present' | 'absent' | 'tardy' | 'excused' | 'other') => {
    if (status === 'other') {
      setPendingRecord({ studentId: student.id, classId: student.classId, status, date: new Date(selectedDate), type: 'student' });
      setShowCustomLabelModal(true);
      return;
    }

    try {
      setLoadingAttendance(`${student.id}-${status}`);
      setAttendanceError('');
      
      await markAttendance({
        studentId: student.id,
        classId: student.classId,
        status,
        date: new Date(selectedDate),
        type: 'student',
      });
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      setAttendanceError(`Failed to mark ${student.firstName} ${student.lastName} as ${status}. Please try again.`);
    } finally {
      setLoadingAttendance(null);
    }
  };

  const handleCustomLabelSubmit = async () => {
    if (pendingRecord && customLabel.trim()) {
      try {
        setAttendanceError('');
        await markAttendance({
          ...pendingRecord,
          customLabel: customLabel.trim(),
        });
        setShowCustomLabelModal(false);
        setCustomLabel('');
        setPendingRecord(null);
      } catch (error) {
        console.error('Failed to mark custom attendance:', error);
        setAttendanceError('Failed to save custom attendance. Please try again.');
      }
    }
  };

  const handleAddStudentToClass = async (studentId: string) => {
    try {
      await updateStudent(studentId, { classId: selectedClass });
    } catch (error) {
      console.error('Error adding student to class:', error);
      alert('Error adding student to class. Please try again.');
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string) => {
    try {
      await updateStudent(studentId, { classId: '' });
    } catch (error) {
      console.error('Error removing student from class:', error);
      alert('Error removing student from class. Please try again.');
    }
  };

  // If a class is selected, show attendance interface
  if (selectedClass) {
    const currentClass = classes.find(c => c.id === selectedClass);
    const isStaffClass = currentClass?.name === 'Staff';
    
    // For Staff class, show staff members; for regular classes, show students
    const availableStudents = isStaffClass 
      ? [] // Staff class doesn't use the student management system
      : students.filter(student => !student.classId || student.classId !== selectedClass);
    
    // For Staff class, get all staff members as the "class members"
    const classMembers = isStaffClass 
      ? staff.map(staffMember => ({
          id: staffMember.id,
          firstName: staffMember.firstName,
          lastName: staffMember.lastName,
          classId: selectedClass, // Treat as if they're in this "class"
          photoUrl: staffMember.photoUrl,
          department: staffMember.department,
          position: staffMember.position
        }))
      : classStudents;
    
    return (
      <div className="p-4 lg:p-4">
        <div className="mb-8">
          <div className="flex items-center space-x-2 lg:space-x-4 mb-4">
            <button
              onClick={handleBackToClasses}
              className="flex items-center space-x-1 lg:space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm lg:text-base"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
            </button>
          </div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Attendance - {currentClass?.name}</h1>
          <div className="mt-2">
            <p className="text-gray-600">
              {isStaffClass ? 'Mark staff attendance' : 'Mark student attendance for this class'}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
              <label className="text-sm font-medium text-gray-700">Teacher:</label>
              <select
                value={currentClass?.teacherId || ''}
                onChange={(e) => {
                  if (currentClass) {
                    updateClass(currentClass.id, { teacherId: e.target.value === '' ? null : e.target.value });
                  }
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
              >
                <option value="">Select a teacher</option>
                {staff.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.id}>
                    {staffMember.firstName} {staffMember.lastName} - {staffMember.position}
                  </option>
                ))}
              </select>
              
              <label className="text-sm font-medium text-gray-700">Assistant Teacher:</label>
              <select
                value={currentClass?.assistantTeacherId || ''}
                onChange={(e) => {
                  if (currentClass) {
                    updateClass(currentClass.id, { assistantTeacherId: e.target.value === '' ? null : e.target.value });
                  }
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
              >
                <option value="">Select an assistant teacher</option>
                {staff.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.id}>
                    {staffMember.firstName} {staffMember.lastName} - {staffMember.position}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Date:</span>
            </div>
            
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              />
            </div>
          </div>
            
            <button
              onClick={() => setShowStudentManagementModal(true)}
              className={`${isStaffClass ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base w-full sm:w-auto`}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{isStaffClass ? 'Manage Staff' : 'Manage Students'}</span>
              <span className="sm:hidden">{isStaffClass ? 'Staff' : 'Students'}</span>
            </button>
          </div>
          
          {attendanceError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{attendanceError}</p>
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isStaffClass ? 'Staff' : 'Student'} Attendance - {new Date(selectedDate).toLocaleDateString()}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {classMembers.length} {isStaffClass ? 'staff members' : 'students'} in this {isStaffClass ? 'group' : 'class'}
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {classMembers.map((member) => {
              const attendance = isStaffClass 
                ? attendanceRecords.find(record => 
                    record.staffId === member.id && 
                    record.type === 'staff' &&
                    new Date(record.date).toDateString() === new Date(selectedDate).toDateString()
                  )
                : getTodaysAttendance(member.id);
              
              return (
                <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${isStaffClass ? 'bg-purple-500' : 'bg-blue-500'} rounded-full flex items-center justify-center`}>
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium text-lg">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </h3>
                        {isStaffClass && (
                          <div className="mt-1">
                            <p className="text-sm text-purple-600 font-medium">{(member as any).position}</p>
                            <p className="text-sm text-gray-500">{(member as any).department}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-wrap gap-1 lg:gap-2">
                        <AttendanceButton
                        status="present"
                        label="Present"
                        onClick={() => isStaffClass 
                          ? (async () => {
                              try {
                                setLoadingAttendance(`${member.id}-present`);
                                setAttendanceError('');
                                await markAttendance({
                                  staffId: member.id,
                                  department: (member as any).department,
                                  status: 'present',
                                  date: new Date(selectedDate),
                                  type: 'staff',
                                });
                              } catch (error) {
                                setAttendanceError(`Failed to mark ${member.firstName} ${member.lastName} as present. Please try again.`);
                              } finally {
                                setLoadingAttendance(null);
                              }
                            })()
                          : handleAttendanceClick(member, 'present')
                        }
                        active={attendance?.status === 'present'}
                        loading={loadingAttendance === `${member.id}-present`}
                      />
                      <AttendanceButton
                        status="absent"
                        label="Absent"
                        onClick={() => isStaffClass 
                          ? (async () => {
                              try {
                                setLoadingAttendance(`${member.id}-absent`);
                                setAttendanceError('');
                                await markAttendance({
                                  staffId: member.id,
                                  department: (member as any).department,
                                  status: 'absent',
                                  date: new Date(selectedDate),
                                  type: 'staff',
                                });
                              } catch (error) {
                                setAttendanceError(`Failed to mark ${member.firstName} ${member.lastName} as absent. Please try again.`);
                              } finally {
                                setLoadingAttendance(null);
                              }
                            })()
                          : handleAttendanceClick(member, 'absent')
                        }
                        active={attendance?.status === 'absent'}
                        loading={loadingAttendance === `${member.id}-absent`}
                      />
                      <AttendanceButton
                        status="tardy"
                        label="Tardy"
                        onClick={() => isStaffClass 
                          ? (async () => {
                              try {
                                setLoadingAttendance(`${member.id}-tardy`);
                                setAttendanceError('');
                                await markAttendance({
                                  staffId: member.id,
                                  department: (member as any).department,
                                  status: 'tardy',
                                  date: new Date(selectedDate),
                                  type: 'staff',
                                });
                              } catch (error) {
                                setAttendanceError(`Failed to mark ${member.firstName} ${member.lastName} as tardy. Please try again.`);
                              } finally {
                                setLoadingAttendance(null);
                              }
                            })()
                          : handleAttendanceClick(member, 'tardy')
                        }
                        active={attendance?.status === 'tardy'}
                        loading={loadingAttendance === `${member.id}-tardy`}
                      />
                      <AttendanceButton
                        status="excused"
                        label="Excused"
                        onClick={() => isStaffClass 
                          ? (async () => {
                              try {
                                setLoadingAttendance(`${member.id}-excused`);
                                setAttendanceError('');
                                await markAttendance({
                                  staffId: member.id,
                                  department: (member as any).department,
                                  status: 'excused',
                                  date: new Date(selectedDate),
                                  type: 'staff',
                                });
                              } catch (error) {
                                setAttendanceError(`Failed to mark ${member.firstName} ${member.lastName} as excused. Please try again.`);
                              } finally {
                                setLoadingAttendance(null);
                              }
                            })()
                          : handleAttendanceClick(member, 'excused')
                        }
                        active={attendance?.status === 'excused'}
                        loading={loadingAttendance === `${member.id}-excused`}
                      />
                      <AttendanceButton
                        status="other"
                        label="Other"
                        onClick={() => isStaffClass 
                          ? (() => {
                              setPendingRecord({ 
                                staffId: member.id, 
                                department: (member as any).department, 
                                status: 'other', 
                                date: new Date(selectedDate),
                                type: 'staff'
                              });
                              setShowCustomLabelModal(true);
                            })()
                          : handleAttendanceClick(member, 'other')
                        }
                        active={attendance?.status === 'other'}
                        loading={loadingAttendance === `${member.id}-other`}
                      />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {classMembers.length === 0 && (
            <div className="text-center py-12">
              {isStaffClass ? (
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              ) : (
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isStaffClass ? 'No staff members found' : 'No students in this class'}
              </h3>
              <p className="text-gray-500">
                {isStaffClass 
                  ? 'Add staff members to start taking attendance'
                  : 'Add students to this class to start taking attendance'
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
                  placeholder={isStaffClass ? "e.g., Training, Meeting, Sick Leave, etc." : "e.g., Field Trip, Medical Leave, etc."}
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

        {/* Student Management Modal */}
        {showStudentManagementModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowStudentManagementModal(false)}
          >
            <div 
              className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-96 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {isStaffClass ? 'Manage Staff' : 'Manage Students'} - {currentClass?.name}
              </h2>
              
              {isStaffClass ? (
                <div className="h-80">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    All Staff Members ({staff.length})
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-3 h-64 overflow-y-auto">
                    {staff.length === 0 ? (
                      <p className="text-gray-500 text-sm">No staff members found</p>
                    ) : (
                      <div className="space-y-2">
                        {staff.map((staffMember) => (
                          <div key={staffMember.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                            <div>
                              <span className="text-sm font-medium">
                                {staffMember.firstName} {staffMember.lastName}
                              </span>
                              <p className="text-xs text-purple-600">{staffMember.position}</p>
                              <p className="text-xs text-gray-500">{staffMember.department}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                {/* Current Students */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Current Students ({classStudents.length})
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-3 h-64 overflow-y-auto">
                    {classStudents.length === 0 ? (
                      <p className="text-gray-500 text-sm">No students in this class</p>
                    ) : (
                      <div className="space-y-2">
                        {classStudents.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">
                              {student.firstName} {student.lastName}
                            </span>
                            <button
                              onClick={() => handleRemoveStudentFromClass(student.id)}
                              className="text-red-600 hover:text-red-800 p-1 transition-colors duration-200"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Students */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Available Students ({availableStudents.length})
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-3 h-64 overflow-y-auto">
                    {availableStudents.length === 0 ? (
                      <p className="text-gray-500 text-sm">All students are assigned to classes</p>
                    ) : (
                      <div className="space-y-2">
                        {availableStudents.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium">
                                {student.firstName} {student.lastName}
                              </span>
                              {student.classId && (
                                <p className="text-xs text-gray-500">
                                  Currently in: {classes.find(c => c.id === student.classId)?.name}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddStudentToClass(student.id)}
                              className="text-green-600 hover:text-green-800 p-1 transition-colors duration-200"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowStudentManagementModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h2>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this class?
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default classes view
  return (
    <div className="lg:ml-64 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-2">Manage your class schedule and take attendance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Class</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(cls)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{cls.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{cls.description}</p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{getStudentCount(cls.id)} students</span>
              </div>
            </div>

            <button
              onClick={() => handleClassClick(cls.id)}
              className={`w-full ${cls.name === 'Staff' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2`}
            >
              {cls.name === 'Staff' ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Manage Staff</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  <span>Take Attendance</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClass(null);
                    setFormData({ name: '', description: '', teacherId: 'teacher1' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  {editingClass ? 'Update' : 'Add'} Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h2>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this class?
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;