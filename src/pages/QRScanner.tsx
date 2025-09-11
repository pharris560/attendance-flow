import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Scan, Users, UserCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import QrScanner from 'qr-scanner';

const QRScanner: React.FC = () => {
  const { students, staff, classes, markAttendance } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    person?: any;
    type?: 'student' | 'staff';
  } | null>(null);
  const [manualId, setManualId] = useState('');
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup QR scanner when component unmounts
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError('');
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Starting QR scanner...');

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          processQRCode(result.data);
        },
        {
          onDecodeError: (error) => {
            // Don't log decode errors as they happen frequently while scanning
            // console.log('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
        }
      );

      console.log('QR Scanner created, starting camera...');
      await qrScannerRef.current.start();
      console.log('Camera started successfully');
      setIsScanning(true);
      
    } catch (error) {
      console.error('Error starting camera:', error);
      setCameraError(error instanceof Error ? error.message : 'Failed to start camera');
      setScanResult({
        success: false,
        message: `Camera Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check camera permissions or try manual entry.`
      });
    }
  };

  const stopCamera = () => {
    try {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      setIsScanning(false);
      setCameraError('');
      console.log('Camera stopped');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const processQRCode = async (qrData: string) => {
    try {
      console.log('Processing QR code data:', qrData);
      
      let personId: string;
      let personType: 'student' | 'staff';
      let qrInfo: any = null;

      // Check if it's a full attendance URL
      if (qrData.includes('/attendance-check')) {
        try {
          const url = new URL(qrData);
          const urlParams = url.searchParams;
          personType = urlParams.get('type') as 'student' | 'staff';
          personId = urlParams.get('id') || '';
          
          if (!personType || !personId) {
            throw new Error('Invalid attendance URL format. Missing type or id parameter.');
          }
          
          qrInfo = {
            type: personType,
            id: personId,
            name: urlParams.get('name') || '',
            class: urlParams.get('class') || '',
            timestamp: urlParams.get('timestamp') || new Date().toISOString()
          };
          
          console.log('Parsed attendance URL:', qrInfo);
        } catch (urlError) {
          throw new Error('Invalid attendance URL format. Please copy the full URL from the QR Codes page.');
        }
      } else {
      try {
        // Try to parse as JSON first (new format)
        qrInfo = JSON.parse(qrData);
        personId = qrInfo.id;
        personType = qrInfo.type;
        console.log('Parsed QR code info:', qrInfo);
      } catch (parseError) {
        // Fallback to old formats
        if (qrData.startsWith('student:')) {
          personId = qrData.replace('student:', '');
          personType = 'student';
          console.log('Detected student QR code (old format):', personId);
        } else if (qrData.startsWith('staff:')) {
          personId = qrData.replace('staff:', '');
          personType = 'staff';
          console.log('Detected staff QR code (old format):', personId);
        } else {
          // Try to find by direct ID match
          const student = students.find(s => s.id === qrData);
          const staffMember = staff.find(s => s.id === qrData);
          
          if (student) {
            personId = student.id;
            personType = 'student';
            console.log('Found student by direct ID match:', personId);
          } else if (staffMember) {
            personId = staffMember.id;
            personType = 'staff';
            console.log('Found staff by direct ID match:', personId);
          } else {
            console.error('QR code data not recognized:', qrData);
            throw new Error(`Invalid QR code format. Expected:\n• Full attendance URL from QR Codes page\n• JSON format: {"type":"student","id":"uuid"}\n• Old format: "student:ID" or "staff:ID"\n• Valid UUID of existing student/staff`);
          }
        }
      }
      }

      // Find the person
      const person = personType === 'student' 
        ? students.find(s => s.id === personId)
        : staff.find(s => s.id === personId);

      if (!person) {
        console.error(`${personType} not found with ID:`, personId);
        throw new Error(`${personType === 'student' ? 'Student' : 'Staff member'} not found with ID: ${personId}`);
      }

      console.log('Found person:', person.firstName, person.lastName);

      // Mark attendance as present
      const attendanceData: any = {
        status: 'present' as const,
        date: new Date(),
        type: personType
      };

      if (personType === 'student') {
        attendanceData.studentId = person.id;
        attendanceData.classId = person.classId;
      } else {
        attendanceData.staffId = person.id;
        attendanceData.department = person.department;
      }

      await markAttendance(attendanceData);

      const className = personType === 'student' 
        ? classes.find(c => c.id === person.classId)?.name || 'No class assigned'
        : person.department;

      setScanResult({
        success: true,
        message: `✅ ${person.firstName} ${person.lastName} marked as present in ${className}!${qrInfo ? ` (QR generated: ${new Date(qrInfo.timestamp).toLocaleString()})` : ''}`,
        person,
        type: personType
      });

      // Auto-clear result after 4 seconds
      setTimeout(() => {
        setScanResult(null);
      }, 4000);

    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process QR code'
      });

      // Auto-clear error after 6 seconds
      setTimeout(() => {
        setScanResult(null);
      }, 6000);
    }
  };

  const handleManualEntry = async () => {
    if (!manualId.trim()) return;
    
    await processQRCode(manualId.trim());
    setManualId('');
  };

  const checkCameraPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission check failed:', error);
      return false;
    }
  };

  return (
    <div className="ml-64 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-600 mt-2">Scan QR codes to automatically mark attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera Scanner</h2>
          
          <div className="space-y-4">
            {!isScanning ? (
              <div className="text-center">
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-16 w-16 text-gray-400" />
                </div>
                {cameraError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{cameraError}</p>
                  </div>
                )}
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors duration-200"
                >
                  <Scan className="h-5 w-5" />
                  <span>Start Camera</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Make sure to allow camera permissions when prompted
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Position QR code within the camera view</p>
                <button
                  onClick={stopCamera}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-4 transition-colors duration-200"
                >
                  Stop Camera
                </button>
              </div>
            )}
            
            {/* Video element always present in DOM */}
            <video
              ref={videoRef}
              className={`w-full max-w-md h-64 bg-black rounded-lg mx-auto ${isScanning ? 'block' : 'hidden'}`}
              playsInline
              muted
            />
          </div>
        </div>

        {/* Manual Entry Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Entry</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter QR Code Data or ID
              </label>
              <textarea
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder='Paste the full attendance URL from QR Codes page, or JSON format like: {"type":"student","id":"uuid-here"}'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleManualEntry()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Best: Copy the full attendance URL from the QR Codes page. Also accepts JSON format or valid UUIDs.
              </p>
            </div>
            
            <button
              onClick={handleManualEntry}
              disabled={!manualId.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Mark Present
            </button>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-blue-900">{students.length}</p>
                  <p className="text-xs text-blue-600">Students</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <UserCheck className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-purple-900">{staff.length}</p>
                  <p className="text-xs text-purple-600">Staff</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={checkCameraPermissions}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
              >
                Test Camera Permissions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className={`mt-6 p-4 rounded-xl border-2 ${
          scanResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {scanResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                scanResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {scanResult.message}
              </p>
              {scanResult.person && scanResult.type && (
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {scanResult.type === 'student' ? (
                      <Users className="h-4 w-4 text-blue-600" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-purple-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {scanResult.type === 'student' ? 'Student' : 'Staff'}
                    </span>
                  </div>
                  {scanResult.type === 'student' && (
                    <div className="text-sm text-gray-600">
                      Class: {classes.find(c => c.id === scanResult.person?.classId)?.name || 'No class'}
                    </div>
                  )}
                  {scanResult.type === 'staff' && (
                    <div className="text-sm text-gray-600">
                      Department: {scanResult.person?.department}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use QR Scanner</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Camera Method:</strong> Click "Start Camera" and allow camera permissions. Position the QR code within the camera view for automatic detection.</p>
          <p><strong>Manual Method:</strong> Copy QR code data from the QR Codes page and paste it into the manual entry field.</p>
          <p><strong>QR Code Format:</strong> QR codes contain JSON data with person details including name, class/department, and timestamp.</p>
          <p><strong>Automatic Attendance:</strong> Successfully scanned QR codes automatically mark the person as "Present" for today.</p>
          <p><strong>Troubleshooting:</strong> If camera doesn't start, check browser permissions or use the "Test Camera Permissions" button.</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;