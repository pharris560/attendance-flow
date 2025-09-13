import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, User, Upload, FileText, X, Crop } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import html2canvas from 'html2canvas';

const Students: React.FC = () => {
  const { students, classes, addStudent, updateStudent, deleteStudent } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", classId: "", photoUrl: "" }); // add fields you actually have
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [croppedImage, setCroppedImage] = useState<string>('');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classId: '',
    email: '',
    phone: ''
  });

  function handleOpenEdit(student: any) {
  setEditingStudent(student.id);                            // <-- critical
  setForm({
    name: student.name ?? "",
    classId: student.classId ?? "",
    photoUrl: student.photoUrl ?? "",
  });  
  setError(null);
  setShowModal(true);
  
  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedClass === '' || student.classId === selectedClass)
  );

  // ---------- Photo crop helpers ----------
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setOriginalImage(imageUrl);
      setShowCropModal(true);
      // Reset crop area to center
      setCropArea({ x: 50, y: 50, width: 200, height: 200 });
    };
    reader.readAsDataURL(file);
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - cropArea.x,
      y: e.clientY - rect.top - cropArea.y
    });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const newX = Math.max(0, Math.min(rect.width - cropArea.width, e.clientX - rect.left - dragStart.x));
    const newY = Math.max(0, Math.min(rect.height - cropArea.height, e.clientY - rect.top - dragStart.y));

    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
  };

  const applyCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 200;
      canvas.height = 200;

      // Calculate scale factors
      const containerWidth = 400; // Preview container width
      const containerHeight = 300; // Preview container height
      const scaleX = img.width / containerWidth;
      const scaleY = img.height / containerHeight;

      // Draw cropped image
      ctx?.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        200,
        200
      );

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCroppedImage(croppedDataUrl);

      // Convert to File object
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-photo.jpg', { type: 'image/jpeg' });
          setPhotoFile(croppedFile);
        }
      }, 'image/jpeg', 0.8);

      setShowCropModal(false);
    };

    img.src = originalImage;
  };

  // ---------- CRUD ----------
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
      // Keep keys consistent to avoid undefined later
      setFormData({ firstName: '', lastName: '', classId: '', email: '', phone: '' });
      setPhotoFile(null);
      setCroppedImage('');
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student. Please try again.');
    }
  };

  const handleEdit = (student: any) => {
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      classId: student.classId,
      email: student.email || '',
      phone: student.phone || ''
    });
    setEditingStudent(student.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const student = students.find(s => s.id === id);
    setPersonToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (personToDelete) {
      try {
        await deleteStudent(personToDelete.id);
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
      }
    }
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPersonToDelete(null);
  };

  // ---------- ID Card ----------
  const generateIDCard = async (student: any) => {
    const studentClass = classes.find(c => c.id === student.classId);

    // Create a temporary div for the ID card
    const cardDiv = document.createElement('div');
    cardDiv.style.width = '400px';
    cardDiv.style.height = '250px';
    cardDiv.style.backgroundColor = '#ffffff';
    cardDiv.style.border = '2px solid #3B82F6';
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
      <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 12px;">Student ID Card</p>
    `;

    // Main content
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.gap = '20px';

    // Photo section
    const photoSection = document.createElement('div');
    photoSection.style.flexShrink = '0';

    if (student.photoUrl) {
      const img = document.createElement('img');
      img.src = student.photoUrl;
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
      placeholder.style.backgroundColor = '#3B82F6';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.color = 'white';
      placeholder.style.fontSize = '24px';
      placeholder.style.fontWeight = 'bold';
      placeholder.textContent = `${student.firstName[0]}${student.lastName[0]}`;
      photoSection.appendChild(placeholder);
    }

    // Info section
    const infoSection = document.createElement('div');
    infoSection.style.flex = '1';
    infoSection.innerHTML = `
      <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 20px; font-weight: bold;">${student.firstName} ${student.lastName}</h3>
      <p style="margin: 0 0 4px 0; color: #3B82F6; font-size: 14px; font-weight: 600;">${studentClass ? studentClass.name : 'No class assigned'}</p>
      <p style="margin: 0; color: #6B7280; font-size: 12px;">Student ID: ${student.id.substring(0, 8)}</p>
    `;

    // QR Code section
    const qrSection = document.createElement('div');
    qrSection.style.flexShrink = '0';
    qrSection.style.textAlign = 'center';

    if (student.qrCode && student.qrCode.startsWith('data:image')) {
      const qrImg = document.createElement('img');
      qrImg.src = student.qrCode;
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
      link.download = `${student.firstName}_${student.lastName}_ID_Card.png`;
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

  // ---------- CSV helpers ----------
  const norm = (s?: string) => (s ?? '').trim();
  const stripBOM = (s: string) => s.replace(/^\uFEFF/, '');

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError('');
    setCsvPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = stripBOM(String(event.target?.result ?? ''));
        const lines = csv.split(/\r?\n/).filter(line => line.trim());

        if (lines.length < 2) {
          setCsvError('CSV file must have at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => norm(h).toLowerCase());
        const requiredHeaders = ['firstname', 'lastname']; // we’ll map variants during import too
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setCsvError(`Missing required columns: ${missingHeaders.join(', ')}. Required: firstName, lastName. Optional: className, email, phone`);
          return;
        }

        const preview = lines.slice(1, 6).map((line, index) => {
          const values = line.split(',').map(v => norm(v));
          const row: any = {};

          headers.forEach((header, i) => {
            if (header === 'firstname') row.firstName = values[i] || '';
            else if (header === 'lastName'.toLowerCase()) row.lastName = values[i] || '';
            else if (header === 'classname') row.className = values[i] || '';
            else if (header === 'email') row.email = values[i] || '';
            else if (header === 'phone') row.phone = values[i] || '';
          });

        return { ...row, rowIndex: index + 2 };
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
          const csv = stripBOM(String(event.target?.result ?? ''));
          const lines = csv.split(/\r?\n/).filter(line => line.trim());
          const headers = lines[0].split(',').map(h => norm(h).toLowerCase());

          // header alias map
          const alias = (h: string) => {
            const x = h.toLowerCase().trim();
            if (['first', 'first name', 'firstname'].includes(x)) return 'firstname';
            if (['last', 'last name', 'lastname'].includes(x)) return 'lastname';
            if (['class', 'class name', 'classname'].includes(x)) return 'classname';
            return x; // email / phone
          };
          const aliasedHeaders = headers.map(alias);

          let successCount = 0;
          let errorCount = 0;
          const failures: Array<{ row: number; error: string; payload: any }> = [];

          for (let i = 1; i < lines.length; i++) {
            const raw = lines[i];
            const values = raw.split(',').map(v => norm(v));
            const row: Record<string, string> = {};
            aliasedHeaders.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

            const payload: any = {
              firstName: norm(row['firstname']),
              lastName: norm(row['lastname']),
              classId: '',
              email: norm(row['email']),
              phone: norm(row['phone']),
            };

            // resolve classId from className (optional)
            const className = norm(row['classname']);
            if (className) {
              const found = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
              if (found) {
                payload.classId = found.id;
              } else {
                // not fatal; import continues without a class
                console.warn(`Class "${className}" not found for row ${i + 1}`);
              }
            }

            // required fields
            if (!payload.firstName || !payload.lastName) {
              errorCount++;
              failures.push({
                row: i + 1,
                error: `Missing required fields: firstName="${payload.firstName}", lastName="${payload.lastName}"`,
                payload
              });
              continue;
            }

            try {
              await addStudent(payload);
              successCount++;
            } catch (err: any) {
              errorCount++;
              const msg = err?.message ?? String(err);
              failures.push({ row: i + 1, error: msg, payload });
              console.error('Error adding student', { row: i + 1, payload, error: err });
            }
          }

          if (errorCount > 0 && successCount > 0) {
            alert(`Partial success: ${successCount} students imported, ${errorCount} failed. Check the error details below.`);
          } else if (errorCount > 0) {
            alert(`Import failed: ${errorCount} row(s) errored. See details below.`);
          } else {
            alert(`Successfully imported ${successCount} students!`);
            setShowCsvModal(false);
            setCsvFile(null);
            setCsvPreview([]);
          }

          setCsvError(
            failures.length
              ? `Failed rows:\n` + failures.map(f => `Row ${f.row}: ${f.error}`).join('\n')
              : ''
          );
        } catch (error: any) {
          console.error('CSV processing error:', error);
          setCsvError(`Error processing CSV file: ${error?.message ?? 'Unknown error'}. Please check the format and try again.`);
        } finally {
          setIsProcessingCsv(false);
        }
      };

      reader.readAsText(csvFile);
    } catch (error: any) {
      console.error('File reading error:', error);
      setCsvError(`Error reading file: ${error?.message ?? 'Unknown error'}. Please try again.`);
      setIsProcessingCsv(false);
    }
  };

  return (
    <div className="p-4 lg:p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">Manage your student roster</p>
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
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
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
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
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

              {/* QR Code Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-700 mb-2">QR Code</p>
                  {student.qrCode && student.qrCode.startsWith('data:image') ? (
                    <div className="flex flex-col items-center space-y-2">
                      <img
                        src={student.qrCode}
                        alt={`QR Code for ${student.firstName} ${student.lastName}`}
                        className="w-20 h-20 border border-gray-200 rounded object-contain bg-white"
                      />
                      <button
                        onClick={() => {
                          generateIDCard(student);
                        }}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors duration-200 font-medium"
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
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a photo file or leave blank for default icon</p>

                {croppedImage && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Preview:</p>
                    <img
                      src={croppedImage}
                      alt="Cropped preview"
                      className="w-16 h-16 rounded-full object-cover border border-gray-300"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStudent(null);
                    setFormData({ firstName: '', lastName: '', classId: '', email: '', phone: '' });
                    setPhotoFile(null);
                    setCroppedImage('');
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

      {/* Photo Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Crop Photo</h2>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setOriginalImage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div
                  className="relative inline-block border-2 border-gray-300 rounded-lg overflow-hidden cursor-move"
                  style={{ width: '400px', height: '300px' }}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                >
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />

                  {/* Crop overlay */}
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
                    style={{
                      left: `${cropArea.x}px`,
                      top: `${cropArea.y}px`,
                      width: `${cropArea.width}px`,
                      height: `${cropArea.height}px`,
                    }}
                    onMouseDown={handleCropMouseDown}
                  >
                    <div className="absolute inset-0 border-2 border-dashed border-white opacity-75"></div>

                    {/* Corner handles (visual only) */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize"></div>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <Crop className="h-4 w-4 inline mr-1" />
                Drag the blue area to select the part of the image you want to use
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setOriginalImage('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCrop}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Crop className="h-4 w-4" />
                  <span>Apply Crop</span>
                </button>
              </div>
            </div>
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
                  <li>• <strong>Optional columns:</strong> className (must match existing class names exactly), email, phone</li>
                  <li>• First row should contain column headers</li>
                  <li>• Use commas to separate values</li>
                </ul>
                <div className="mt-3 p-2 bg-white rounded border text-xs font-mono">
                  <div className="text-gray-600">Example:</div>
                  <div>firstName,lastName,className,email,phone</div>
                  <div>John,Smith,Mathematics 101,john@school.edu,(555) 123-4567</div>
                  <div>Jane,Doe,English Literature,jane@school.edu,(555) 987-6543</div>
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
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Email</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Phone</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {csvPreview.map((csvStudent, index) => {
                          const classExists = csvStudent.className ?
                            classes.some(c => c.name.toLowerCase() === csvStudent.className.toLowerCase()) :
                            true;

                          return (
                            <tr key={index} className={!classExists ? 'bg-yellow-50' : ''}>
                              <td className="px-3 py-2">{csvStudent.firstName}</td>
                              <td className="px-3 py-2">{csvStudent.lastName}</td>
                              <td className="px-3 py-2">
                                {csvStudent.className || <span className="text-gray-400">No class</span>}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {csvStudent.email || <span className="text-gray-400">-</span>}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {csvStudent.phone || <span className="text-gray-400">-</span>}
                              </td>
                              <td className="px-3 py-2">
                                {!csvStudent.firstName || !csvStudent.lastName ? (
                                  <span className="text-red-600 text-xs">Missing name</span>
                                ) : !classExists && csvStudent.className ? (
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
              {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-2">Delete student?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone.
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
      </div> {/* ← CLOSE the outermost Students page container */}
    );       {/* ← CLOSE the return( ... ) parenthesis */}
};          {/* ← CLOSE the Students component function */}

export default Students;
