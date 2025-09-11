import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, Upload, FileText, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Staff: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string>('');
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    position: ''
  });

  // Get unique positions
  const positions = Array.from(new Set(staff.map(s => s.position))).sort();

  const filteredStaff = staff.filter(staffMember =>
    `${staffMember.firstName} ${staffMember.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const finalFilteredStaff = filteredStaff.filter(staffMember =>
    selectedPosition === '' || staffMember.position === selectedPosition
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await updateStaff(editingStaff, formData, photoFile || undefined);
      } else {
        await addStaff(formData, photoFile || undefined);
      }
      setShowModal(false);
      setEditingStaff(null);
      setFormData({ firstName: '', lastName: '', department: '', position: '' });
      setPhotoFile(null);
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Error saving staff member. Please try again.');
    }
  };

  const handleEdit = (staffMember: any) => {
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      department: staffMember.department,
      position: staffMember.position
    });
    setEditingStaff(staffMember.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(id).catch(error => {
        console.error('Error deleting staff:', error);
        alert('Error deleting staff member. Please try again.');
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
        const requiredHeaders = ['firstname', 'lastname', 'department', 'position'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setCsvError(`Missing required columns: ${missingHeaders.join(', ')}. Required: firstName, lastName, department, position`);
          return;
        }

        const preview = lines.slice(1, 6).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const staffMember: any = {};
          
          headers.forEach((header, i) => {
            if (header === 'firstname') staffMember.firstName = values[i] || '';
            else if (header === 'lastname') staffMember.lastName = values[i] || '';
            else if (header === 'department') staffMember.department = values[i] || '';
            else if (header === 'position') staffMember.position = values[i] || '';
          });
          
          return { ...staffMember, rowIndex: index + 2 };
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
              const staffData: any = {};
              
              headers.forEach((header, index) => {
                if (header === 'firstname') staffData.firstName = values[index] || '';
                else if (header === 'lastname') staffData.lastName = values[index] || '';
                else if (header === 'department') staffData.department = values[index] || '';
                else if (header === 'position') staffData.position = values[index] || '';
              });
              
              if (!staffData.firstName || !staffData.lastName || !staffData.department || !staffData.position) {
                errors.push(`Row ${i + 1}: Missing required fields (firstName, lastName, department, or position)`);
                errorCount++;
                continue;
              }
              
              await addStaff(staffData);
              successCount++;
            } catch (error) {
              errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              errorCount++;
            }
          }
          
          if (errors.length > 0) {
            setCsvError(`Imported ${successCount} staff members successfully. ${errorCount} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`);
          } else {
            alert(`Successfully imported ${successCount} staff members!`);
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
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-2">Manage your staff members and their attendance</p>
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
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Positions</option>
          {positions.map((position) => (
            <option key={position} value={position}>{position}</option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {finalFilteredStaff.map((staffMember) => (
          <div key={staffMember.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                {staffMember.photoUrl ? (
                  <img
                    src={staffMember.photoUrl}
                    alt={`${staffMember.firstName} ${staffMember.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCheck className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handleEdit(staffMember)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(staffMember.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center">
              {staffMember.firstName} {staffMember.lastName}
            </h3>
            <p className="text-sm text-purple-600 font-medium mb-1 text-center">{staffMember.position}</p>
            <p className="text-sm text-gray-500 mb-3 text-center">{staffMember.department}</p>
            
          </div>
        ))}
      </div>

      {finalFilteredStaff.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedPosition
              ? "Try adjusting your search or filter criteria"
              : "Add staff members to get started"
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
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
                    setEditingStaff(null);
                    setFormData({ firstName: '', lastName: '', department: '', position: '' });
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
                  {editingStaff ? 'Update' : 'Add'} Staff Member
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
              <h2 className="text-xl font-semibold text-gray-900">Import Staff from CSV</h2>
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
                  <li>• <strong>Required columns:</strong> firstName, lastName, department, position</li>
                  <li>• First row should contain column headers</li>
                  <li>• Use commas to separate values</li>
                </ul>
                <div className="mt-3 p-2 bg-white rounded border text-xs font-mono">
                  <div className="text-gray-600">Example:</div>
                  <div>firstName,lastName,department,position</div>
                  <div>John,Smith,Mathematics,Teacher</div>
                  <div>Jane,Doe,Administration,Principal</div>
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
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Department</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Position</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {csvPreview.map((staffMember, index) => (
                          <tr key={index} className={!staffMember.firstName || !staffMember.lastName || !staffMember.department || !staffMember.position ? 'bg-red-50' : ''}>
                            <td className="px-3 py-2">{staffMember.firstName}</td>
                            <td className="px-3 py-2">{staffMember.lastName}</td>
                            <td className="px-3 py-2">{staffMember.department}</td>
                            <td className="px-3 py-2">{staffMember.position}</td>
                            <td className="px-3 py-2">
                              {!staffMember.firstName || !staffMember.lastName || !staffMember.department || !staffMember.position ? (
                                <span className="text-red-600 text-xs">Missing data</span>
                              ) : (
                                <span className="text-green-600 text-xs">Ready</span>
                              )}
                            </td>
                          </tr>
                        ))}
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
                      <span>Import Staff</span>
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

export default Staff;