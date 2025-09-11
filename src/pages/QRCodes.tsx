import React, { useState } from 'react';
import { Download, Search, QrCode, Users, UserCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const QRCodes: React.FC = () => {
  const { students, staff, classes } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | 'students' | 'staff'>('all');

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

  return (
    <div className="ml-64 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Codes</h1>
          <p className="text-gray-600 mt-2">View and download QR codes for students and staff attendance tracking</p>
        </div>
        {filteredPersons.length > 0 && (
          <button
            onClick={downloadAllQRCodes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            <span>Download All</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center space-x-4">
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="students">Students Only</option>
            <option value="staff">Staff Only</option>
          </select>
          
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPersons.map((person) => {
          return (
            <div key={person.id} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
              person.type === 'staff' ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-blue-500'
            }`}>
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
                    if (person.qrCode) {
                      // The QR code now contains a URL, so we'll create a test URL
                      const baseUrl = window.location.origin;
                      const testUrl = `${baseUrl}/attendance-check?type=${person.type}&id=${person.id}&name=${encodeURIComponent(`${person.firstName} ${person.lastName}`)}&class=${encodeURIComponent(person.displayInfo)}&timestamp=${encodeURIComponent(new Date().toISOString())}`;
                      navigator.clipboard.writeText(testUrl);
                      alert(`Copied ${person.firstName}'s attendance URL to clipboard for testing`);
                    } else {
                      alert(`No QR Code found for ${person.firstName}`);
                    }
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
    </div>
  );
};

export default QRCodes;