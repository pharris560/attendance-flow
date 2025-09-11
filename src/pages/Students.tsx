import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, User, Upload, FileText, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Students: React.FC = () => {
  const { students, classes, addStudent, updateStudent, deleteStudent } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string>('');
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classId: ''
  });

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedClass === '' || student.classId === selectedClass)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudent(editingStudent, formData, photoFile || undefined);
      } else {
        await addStudent(formData, photoFile || undefined);
      }
      setShowModal(false);
      setEditingStudent(null);
      setFormData({ firstName: '', lastName: '', classId: '' });
      setPhotoFile(null);
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student. Please try again.');
    }
  };

  const handleEdit = (student: any) => {
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      classId: student.classId
    });
    setEditingStudent(student.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id).catch(error => {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
      });
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError('');
    setCsvPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvError('CSV file must have at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['firstname', 'lastname'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setCsvError(`Missing required columns: ${missingHeaders.join(', ')}. Required: firstName, lastName. Optional: className`);
          return;
        }

        const preview = lines.slice(1, 6).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const student: any = {};
          
          headers.forEach((header, i) => {
            if (header === 'firstname') student.firstName = values[i] || '';
            else if (header === 'lastname') student.lastName = values[i] || '';
            else if (header === 'classname') student.className = values[i] || '';
          });
          
          return { ...student, rowIndex: index + 2 };
        });

        setCsvPreview(preview);
      } catch (error) {
        setCsvError('Error reading CSV file. Please ensure it\'s a valid CSV format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    
    setIsProcessingCsv(true);
    setCsvError('');
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            try {
              const values = lines[i].split(',').map(v => v.trim());
              const studentData: any = { classId: '' };
              
              headers.forEach((header, index) => {
                if (header === 'firstname') studentData.firstName = values[index] || '';
                else if (header === 'lastname') studentData.lastName = values[index] || '';
                else if (header === 'classname') {
                  const className = values[index] || '';
                  if (className) {
                    const foundClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
                    studentData.classId = foundClass?.id || '';
                  }
                }
              });
              
              if (!studentData.firstName || !studentData.lastName) {
                errors.push(`Row ${i + 1}: Missing first name or last name`);
                errorCount++;
                continue;
              }
              
              await addStudent(studentData);
              successCount++;
            } catch (error) {
              errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              errorCount++;
            }
          }
          
          if (errors.length > 0) {
            setCsvError(`Imported ${successCount} students successfully. ${errorCount} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`);
          } else {
            alert(`Successfully imported ${successCount} students!`);
            setShowCsvModal(false);
            setCsvFile(null);
            setCsvPreview([]);
          }
        } catch (error) {
          setCsvError('Error processing CSV file. Please check the format and try again.');
        } finally {
          setIsProcessingCsv(false);
        }
      };
      
      reader.readAsText(csvFile);
    } catch (error) {
      setCsvError('Error reading file. Please try again.');
      setIsProcessingCsv(false);
    }
  };

  return (
    <div className="ml-64 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">Manage your student roster</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCsvModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student) => {
          const studentClass = classes.find(c => c.id === student.classId);
          return (
            <div key={student.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="text-center mb-4">
                <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={`${student.firstName} ${student.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-sm text-gray-500 mb-3 text-center">
                {studentClass ? studentClass.name : 'No class assigned'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
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
                    setEditingStudent(null);
                    setFormData({ firstName: '', lastName: '', classId: '' });
                    setPhotoFile(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  {editingStudent ? 'Update' : 'Add'} Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Import Students from CSV</h2>
              <button
                onClick={() => {
                  setShowCsvModal(false);
                  setCsvFile(null);
                  setCsvPreview([]);
                  setCsvError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Required columns:</strong> firstName, lastName</li>
                  <li>• <strong>Optional columns:</strong> className (must match existing class names exactly)</li>
                  <li>• First row should contain column headers</li>
                  <li>• Use commas to separate values</li>
                </ul>
                <div className="mt-3 p-2 bg-white rounded border text-xs font-mono">
                  <div className="text-gray-600">Example:</div>
                  <div>firstName,lastName,className</div>
                  <div>John,Smith,Mathematics 101</div>
                  <div>Jane,Doe,English Literature</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {csvError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Error</h4>
                      <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{csvError}</pre>
                    </div>
                  </div>
                </div>
              )}
              
              {csvPreview.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Preview (first 5 rows):
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">First Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Last Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Class</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {csvPreview.map((student, index) => {
                          const classExists = student.className ? 
                            classes.some(c => c.name.toLowerCase() === student.className.toLowerCase()) : 
                            true;
                          
                          return (
                            <tr key={index} className={!classExists ? 'bg-yellow-50' : ''}>
                              <td className="px-3 py-2">{student.firstName}</td>
                              <td className="px-3 py-2">{student.lastName}</td>
                              <td className="px-3 py-2">
                                {student.className || <span className="text-gray-400">No class</span>}
                              </td>
                              <td className="px-3 py-2">
                                {!student.firstName || !student.lastName ? (
                                  <span className="text-red-600 text-xs">Missing name</span>
                                ) : !classExists && student.className ? (
                                  <span className="text-yellow-600 text-xs">Class not found</span>
                                ) : (
                                  <span className="text-green-600 text-xs">Ready</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvFile(null);
                    setCsvPreview([]);
                    setCsvError('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || csvPreview.length === 0 || isProcessingCsv}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  {isProcessingCsv ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Import Students</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;