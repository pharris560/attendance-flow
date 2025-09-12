import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, Upload, FileText, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import html2canvas from 'html2canvas';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    email: '',
    phone: ''
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
      position: staffMember.position,
      email: staffMember.email || '',
      phone: staffMember.phone || ''
    });
    setEditingStaff(staffMember.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const staffMember = staff.find(s => s.id === id);
    setPersonToDelete(staffMember);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (personToDelete) {
      try {
        await deleteStaff(personToDelete.id);
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error deleting staff member. Please try again.');
      }
    }
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };

  const generateIDCard = async (staffMember: any) => {
    // Create a temporary div for the ID card
    const cardDiv = document.createElement('div');
    cardDiv.style.width = '400px';
    cardDiv.style.height = '250px';
    cardDiv.style.backgroundColor = '#ffffff';
    cardDiv.style.border = '2px solid #7C3AED';
    cardDiv.style.borderRadius = '12px';
    cardDiv.style.padding = '20px';
    cardDiv.style.fontFamily = 'Arial, sans-serif';
    cardDiv.style.position = 'absolute';
    cardDiv.style.left = '-9999px';
    cardDiv.style.display = 'flex';
    cardDiv.style.flexDirection = 'column';
    cardDiv.style.justifyContent = 'space-between';
    
    // Header
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '15px';
    header.innerHTML = `
      <h2 style="margin: 0; color: #1F2937; font-size: 18px; font-weight: bold;">ACE Attendance</h2>
      <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 12px;">Staff ID Card</p>
    `;
    
    // Main content
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.gap = '20px';
    
    // Photo section
    const photoSection = document.createElement('div');
    photoSection.style.flexShrink = '0';
    
    if (staffMember.photoUrl) {
      const img = document.createElement('img');
      img.src = staffMember.photoUrl;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      img.style.border = '2px solid #E5E7EB';
      photoSection.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.width = '80px';
      placeholder.style.height = '80px';
      placeholder.style.borderRadius = '50%';
      placeholder.style.backgroundColor = '#7C3AED';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.color = 'white';
      placeholder.style.fontSize = '24px';
      placeholder.style.fontWeight = 'bold';
      placeholder.textContent = `${staffMember.firstName[0]}${staffMember.lastName[0]}`;
      photoSection.appendChild(placeholder);
    }
    
    // Info section
    const infoSection = document.createElement('div');
    infoSection.style.flex = '1';
    infoSection.innerHTML = `
      <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 20px; font-weight: bold;">${staffMember.firstName} ${staffMember.lastName}</h3>
      <p style="margin: 0 0 4px 0; color: #7C3AED; font-size: 14px; font-weight: 600;">${staffMember.position}</p>
      <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px;">${staffMember.department}</p>
      <p style="margin: 0; color: #6B7280; font-size: 12px;">Staff ID: ${staffMember.id.substring(0, 8)}</p>
    `;
    
    // QR Code section
    const qrSection = document.createElement('div');
    qrSection.style.flexShrink = '0';
    qrSection.style.textAlign = 'center';
    
    if (staffMember.qrCode && staffMember.qrCode.startsWith('data:image')) {
      const qrImg = document.createElement('img');
      qrImg.src = staffMember.qrCode;
      qrImg.style.width = '60px';
      qrImg.style.height = '60px';
      qrImg.style.border = '1px solid #E5E7EB';
      qrImg.style.borderRadius = '4px';
      qrSection.appendChild(qrImg);
      
      const qrLabel = document.createElement('p');
      qrLabel.style.margin = '4px 0 0 0';
      qrLabel.style.fontSize = '10px';
      qrLabel.style.color = '#6B7280';
      qrLabel.textContent = 'Scan for Attendance';
      qrSection.appendChild(qrLabel);
    }
    
    content.appendChild(photoSection);
    content.appendChild(infoSection);
    content.appendChild(qrSection);
    
    // Footer
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.marginTop = '15px';
    footer.style.paddingTop = '10px';
    footer.style.borderTop = '1px solid #E5E7EB';
    footer.innerHTML = `
      <p style="margin: 0; color: #9CA3AF; font-size: 10px;">Generated on ${new Date().toLocaleDateString()}</p>
    `;
    
    cardDiv.appendChild(header);
    cardDiv.appendChild(content);
    cardDiv.appendChild(footer);
    
    // Add to DOM temporarily
    document.body.appendChild(cardDiv);
    
    try {
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate canvas
      const canvas = await html2canvas(cardDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Download the image
      const link = document.createElement('a');
      link.download = `${staffMember.firstName}_${staffMember.lastName}_ID_Card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (error) {
      console.error('Error generating ID card:', error);
      alert('Error generating ID card. Please try again.');
    } finally {
      // Remove temporary element
      document.body.removeChild(cardDiv);
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
          setCsvError(`Missing required columns: ${missingHeaders.join(', ')}. Required: firstName, lastName, department, position. Optional: email, phone`);
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
            else if (header === 'email') staffMember.email = values[i] || '';
            else if (header === 'phone') staffMember.phone = values[i] || '';
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
                else if (header === 'email') staffData.email = values[index] || '';
                else if (header === 'phone') staffData.phone = values[index] || '';
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
    <div className="p-4 lg:p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-2">Manage your staff members and their attendance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowCsvModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm lg:text-base"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Staff Member</span>
            <span className="sm:hidden">Add Staff</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
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
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          <option value="">All Positions</option>
          {positions.map((position) => (
            <option key={position} value={position}>{position}</option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {finalFilteredStaff.map((staffMember) => (
          <div key={staffMember.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="text-center mb-4">
              <div className="w-32 h-32 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                {staffMember.photoUrl ? (
                  <img
                    src={staffMember.photoUrl}
                    alt={`${staffMember.firstName} ${staffMember.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCheck className="h-10 w-10 text-white" />
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
            {(staffMember.email || staffMember.phone) && (
              <div className="text-xs text-gray-500 mb-3 text-center space-y-1">
                {staffMember.email && <p>📧 {staffMember.email}</p>}
                {staffMember.phone && <p>📱 {staffMember.phone}</p>}
              </div>
            )}
            
            {/* QR Code Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-700 mb-2">QR Code</p>
                {staffMember.qrCode && staffMember.qrCode.startsWith('data:image') ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={staffMember.qrCode}
                      alt={`QR Code for ${staffMember.firstName} ${staffMember.lastName}`}
                      className="w-20 h-20 border border-gray-200 rounded object-contain bg-white"
                    />
                    <button
                      onClick={() => {
                        generateIDCard(staffMember);
                      }}
                      className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors duration-200 font-medium"
                    >
                      Download ID Card
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center mx-auto">
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Generating...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="staff@school.edu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    setFormData({ firstName: '', lastName: '', department: '', position: '', email: '', phone: '' });
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
                  <li>• <strong>Optional columns:</strong> email, phone</li>
                  <li>• First row should contain column headers</li>
                  <li>• Use commas to separate values</li>
                </ul>
                <div className="mt-3 p-2 bg-white rounded border text-xs font-mono">
                  <div className="text-gray-600">Example:</div>
                  <div>firstName,lastName,department,position,email,phone</div>
                  <div>John,Smith,Mathematics,Teacher,john@school.edu,(555) 123-4567</div>
                  <div>Jane,Doe,Administration,Principal,jane@school.edu,(555) 987-6543</div>
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
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Email</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Phone</th>
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
                            <td className="px-3 py-2 text-xs">
                              {staffMember.email || <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {staffMember.phone || <span className="text-gray-400">-</span>}
                            </td>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && personToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h2>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this staff member?
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

export default Staff;