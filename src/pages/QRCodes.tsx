import React, { useState } from 'react';
import { Download, Search, QrCode, Users, UserCheck, Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const QRCodes: React.FC = () => {
  const { students, staff, classes, addStudent, updateStudent, deleteStudent, addStaff, updateStaff, deleteStaff } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | 'students' | 'staff'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [modalType, setModalType] = useState<'student' | 'staff'>('student');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classId: '',
    department: '',
    position: ''
  });

  // Combine students and staff for unified display
  const allPersons = [
    ...students.map(student => ({
      ...student,
      type: 'student' as const,
      displayInfo: classes.find(c => c.id === student.classId)?.name || 'No class assigned'
    })),
    ...staff.map(staffMember => ({
      ...staffMember,
      type: 'staff' as const,
      displayInfo: `${staffMember.position} - ${staffMember.department}`
    }))
  ];

  const filteredPersons = allPersons.filter(person => {
    const matchesSearch = `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || person.type === selectedType;
    
    if (person.type === 'student') {
      const matchesClass = selectedClass === '' || (person as any).classId === selectedClass;
      return matchesSearch && matchesType && matchesClass;
    } else {
      // For staff, ignore class filter
      return matchesSearch && matchesType;
    }
  });

  const downloadQRCode = (person: any) => {
    const link = document.createElement('a');
    link.download = `${person.firstName}_${person.lastName}_QR.png`;
    link.href = person.qrCode;
    link.click();
  };

  const downloadAllQRCodes = () => {
    filteredPersons.forEach((person, index) => {
      setTimeout(() => {
        downloadQRCode(person);
      }, index * 100); // Small delay to prevent browser from blocking multiple downloads
    });
  };

  const handleAddStudent = () => {
    setModalType('student');
    setEditingPerson(null);
    setFormData({ firstName: '', lastName: '', classId: '', department: '', position: '' });
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleAddStaff = () => {
    setModalType('staff');
    setEditingPerson(null);
    setFormData({ firstName: '', lastName: '', classId: '', department: '', position: '' });
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleEdit = (person: any) => {
    setEditingPerson(person);
    setModalType(person.type);
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      classId: person.type === 'student' ? person.classId : '',
      department: person.type === 'staff' ? person.department : '',
      position: person.type === 'staff' ? person.position : ''
    });
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleDeleteClick = (person: any) => {
    setPersonToDelete(person);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (personToDelete) {
      try {
        if (personToDelete.type === 'student') {
          await deleteStudent(personToDelete.id);
        } else {
          await deleteStaff(personToDelete.id);
        }
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Error deleting person. Please try again.');
      }
    }
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'student') {
        const studentData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          classId: formData.classId
        };
        
        if (editingPerson) {
          await updateStudent(editingPerson.id, studentData, photoFile || undefined);
        } else {
          await addStudent(studentData, photoFile || undefined);
        }
      } else {
        const staffData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department,
          position: formData.position
        };
        
        if (editingPerson) {
          await updateStaff(editingPerson.id, staffData, photoFile || undefined);
        } else {
          await addStaff(staffData, photoFile || undefined);
        }
      }
      
      setShowModal(false);
      setEditingPerson(null);
      setFormData({ firstName: '', lastName: '', classId: '', department: '', position: '' });
      setPhotoFile(null);
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Error saving person. Please try again.');
    }
  };

  return (
    <div className="p-4 lg:p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">QR Codes</h1>
          <p className="text-gray-600 mt-2">View and download QR codes for students and staff attendance tracking</p>
        </div>
        {filteredPersons.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleAddStudent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Student</span>
              <span className="sm:hidden">Student</span>
            </button>
            <button
              onClick={handleAddStaff}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Staff</span>
              <span className="sm:hidden">Staff</span>
            </button>
            <button
              onClick={downloadAllQRCodes}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download All</span>
              <span className="sm:hidden">All</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students and staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'all' | 'students' | 'staff')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="students">Students Only</option>
            <option value="staff">Staff Only</option>
          </select>
          
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto ${
              selectedType === 'staff' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={selectedType === 'staff'}
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredPersons.map((person) => {
          return (
            <div key={person.id} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
              person.type === 'staff' ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-blue-500'
            }`}>
              <div className="flex items-center justify-end space-x-2 mb-2">
                <button
                  onClick={() => handleEdit(person)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(person)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-2">
                  {person.type === 'student' ? (
                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                  ) : (
                    <UserCheck className="h-5 w-5 text-purple-500 mr-2" />
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    person.type === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {person.type === 'student' ? 'Student' : 'Staff'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {person.firstName} {person.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {person.displayInfo}
                </p>
              </div>
              
              <div className="flex justify-center mb-4">
                {person.qrCode && person.qrCode.startsWith('data:image') ? (
                  <img
                    src={person.qrCode}
                    alt={`QR Code for ${person.firstName} ${person.lastName}`}
                    className="w-32 h-32 border border-gray-200 rounded-lg object-contain bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Generating...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => downloadQRCode(person)}
                  disabled={!person.qrCode}
                  className={`w-full disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 ${
                    person.type === 'student' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                
                {/* Test button to copy ID for manual testing */}
                <button
                  onClick={() => {
                    // Create the attendance URL for testing
                    const baseUrl = window.location.origin;
                    const attendanceUrl = `${baseUrl}/attendance-check?type=${encodeURIComponent(person.type)}&id=${encodeURIComponent(person.id)}&name=${encodeURIComponent(`${person.firstName} ${person.lastName}`)}&class=${encodeURIComponent(person.displayInfo)}&timestamp=${encodeURIComponent(new Date().toISOString())}`;
                    
                    navigator.clipboard.writeText(attendanceUrl).then(() => {
                      alert(`Copied ${person.firstName}'s attendance URL to clipboard for testing`);
                    }).catch(() => {
                      // Fallback: create JSON data for manual entry
                      const qrData = JSON.stringify({
                        type: person.type,
                        id: person.id,
                        name: `${person.firstName} ${person.lastName}`,
                        class: person.displayInfo,
                        timestamp: new Date().toISOString(),
                        app: 'AttendanceFlow'
                      });
                      navigator.clipboard.writeText(qrData);
                      alert(`Copied ${person.firstName}'s QR data to clipboard for manual testing`);
                    });
                  }}
                  className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                >
                  Copy Attendance URL for Testing
                </button>
              </div>
            </div>
          );
        })}
        {filteredPersons.length === 0 && (
          <div className="col-span-full text-center py-12">
            <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedClass || selectedType !== 'all'
                ? "Try adjusting your search or filter criteria"
                : "Add students and staff to generate their QR codes"
              }
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingPerson 
                ? `Edit ${modalType === 'student' ? 'Student' : 'Staff Member'}` 
                : `Add New ${modalType === 'student' ? 'Student' : 'Staff Member'}`
              }
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {modalType === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {modalType === 'staff' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g., Mathematics, Administration, English"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      placeholder="e.g., Teacher, Principal, Administrator"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a photo file or leave blank for default icon</p>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPerson(null);
                    setFormData({ firstName: '', lastName: '', classId: '', department: '', position: '' });
                    setPhotoFile(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${
                    modalType === 'student' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white px-4 py-2 rounded-lg transition-colors duration-200`}
                >
                  {editingPerson ? 'Update' : 'Add'} {modalType === 'student' ? 'Student' : 'Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && personToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h2>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete {personToDelete.firstName} {personToDelete.lastName}?
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

export default QRCodes;