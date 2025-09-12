import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Staff, Class, AttendanceRecord } from '../types';
import { generateQRCodeURL } from '../utils/qrCodeGenerator';
import { supabase, uploadProfilePhoto, deleteProfilePhoto } from '../lib/supabase';

interface AppContextType {
  students: Student[];
  staff: Staff[];
  classes: Class[];
  attendanceRecords: AttendanceRecord[];
  addStudent: (student: Omit<Student, 'id' | 'qrCode' | 'createdAt'>, photoFile?: File) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>, photoFile?: File) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addStaff: (staff: Omit<Staff, 'id' | 'qrCode' | 'createdAt'>, photoFile?: File) => Promise<void>;
  updateStaff: (id: string, staff: Partial<Staff>, photoFile?: File) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addClass: (classData: Omit<Class, 'id' | 'createdAt'>) => Promise<void>;
  updateClass: (id: string, classData: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  markAttendance: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Reduced console logging for better performance
      
      // Check if Supabase is configured
      if (!supabase) {
        await addSampleData();
        setLoading(false);
        return;
      }
      
      try {
        // Load all data in parallel for better performance
        const [classesResult, studentsResult, staffResult, attendanceResult] = await Promise.all([
          supabase.from('classes').select('*').order('created_at', { ascending: true }).limit(100),
          supabase.from('students').select('*').order('created_at', { ascending: true }).limit(100),
          supabase.from('staff').select('*').order('created_at', { ascending: true }).limit(100),
          supabase.from('attendance_records').select('*').order('timestamp', { ascending: false }).limit(1000) // Limit recent records
        ]);

        // Check for errors
        if (classesResult.error) throw classesResult.error;
        if (studentsResult.error) throw studentsResult.error;
        if (staffResult.error) throw staffResult.error;
        if (attendanceResult.error) throw attendanceResult.error;

        const { data: classesData } = classesResult;
        const { data: studentsData } = studentsResult;
        const { data: staffData } = staffResult;
        const { data: attendanceData } = attendanceResult;

        // If no data exists, add sample data for testing
        if (classesData.length === 0 && studentsData.length === 0 && staffData.length === 0) {
          await addSampleData();
        } else {
          setClasses(classesData);
          setStudents(studentsData.map(student => ({
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            classId: student.class_id,
            photoUrl: student.photo_url,
            qrCode: student.qr_code,
            email: student.email,
            phone: student.phone,
            createdAt: new Date(student.created_at)
          })));
          setStaff(staffData.map(staff => ({
            id: staff.id,
            firstName: staff.first_name,
            lastName: staff.last_name,
            department: staff.department,
            position: staff.position,
            photoUrl: staff.photo_url,
            qrCode: staff.qr_code,
            email: staff.email,
            phone: staff.phone,
            createdAt: new Date(staff.created_at)
          })));
          setAttendanceRecords(attendanceData);
          
          // Check if any students or staff are missing QR codes and generate them
          const studentsNeedingQR = studentsData.filter(student => !student.qr_code);
          const staffNeedingQR = staffData.filter(staff => !staff.qr_code);
          
          if (studentsNeedingQR.length > 0 || staffNeedingQR.length > 0) {
            await generateMissingQRCodes(studentsNeedingQR, staffNeedingQR, classesData);
          }
        }
      } catch (supabaseError) {
        await addSampleData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      // Fallback to demo mode if anything fails
      await addSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateMissingQRCodes = async (studentsNeedingQR: any[], staffNeedingQR: any[], classesData: any[]) => {
    try {
      // Generate QR codes for students
      for (const student of studentsNeedingQR) {
        const studentName = `${student.first_name} ${student.last_name}`;
        const className = classesData.find(c => c.id === student.class_id)?.name || 'No Class';
        const qrCode = await generateQRCodeURL(student.id, 'student', studentName, className);
        await supabase!
          .from('students')
          .update({ qr_code: qrCode })
          .eq('id', student.id);
        
        // Update local state
        setStudents(prev => prev.map(s => 
          s.id === student.id ? { ...s, qrCode: qrCode } : s
        ));
      }
      
      // Generate QR codes for staff
      for (const staffMember of staffNeedingQR) {
        const staffName = `${staffMember.first_name} ${staffMember.last_name}`;
        const department = staffMember.department;
        const qrCode = await generateQRCodeURL(staffMember.id, 'staff', staffName, department);
        await supabase!
          .from('staff')
          .update({ qr_code: qrCode })
          .eq('id', staffMember.id);
        
        // Update local state
        setStaff(prev => prev.map(s => 
          s.id === staffMember.id ? { ...s, qrCode: qrCode } : s
        ));
      }
    } catch (error) {
      console.error('Error generating missing QR codes:', error);
    }
  };

  const addSampleData = async () => {
    try {
      
      // Add sample classes
      const sampleClasses = [
        { id: 'class1', name: 'Mathematics 101', description: 'Basic Mathematics', teacherId: 'teacher1', createdAt: new Date() },
        { id: 'class2', name: 'English Literature', description: 'Classic Literature Studies', teacherId: 'teacher2', createdAt: new Date() },
        { id: 'class3', name: 'Science Lab', description: 'Experimental Science', teacherId: 'teacher3', createdAt: new Date() },
        { id: 'staff-class', name: 'Staff', description: 'Staff Management', teacherId: 'admin1', createdAt: new Date() }
      ];

      setClasses(sampleClasses);
      
      // Add sample students with QR codes
      const sampleStudents: Student[] = [];
      
      const studentData = [
        { id: 'student1', firstName: 'John', lastName: 'Smith', classId: 'class1', className: 'Mathematics 101', email: 'john.smith@school.edu', phone: '(555) 123-4567' },
        { id: 'student2', firstName: 'Emma', lastName: 'Johnson', classId: 'class1', className: 'Mathematics 101', email: 'emma.johnson@school.edu', phone: '(555) 234-5678' },
        { id: 'student3', firstName: 'Michael', lastName: 'Brown', classId: 'class2', className: 'English Literature', email: 'michael.brown@school.edu', phone: '(555) 345-6789' },
        { id: 'student4', firstName: 'Sarah', lastName: 'Davis', classId: 'class2', className: 'English Literature', email: 'sarah.davis@school.edu', phone: '(555) 456-7890' },
        { id: 'student5', firstName: 'David', lastName: 'Wilson', classId: 'class3', className: 'Science Lab', email: 'david.wilson@school.edu', phone: '(555) 567-8901' },
        { id: 'student6', firstName: 'Lisa', lastName: 'Anderson', classId: 'class3', className: 'Science Lab', email: 'lisa.anderson@school.edu', phone: '(555) 678-9012' }
      ];
      
      for (const student of studentData) {
        try {
          const qrCode = await generateQRCodeURL(student.id, 'student', `${student.firstName} ${student.lastName}`, student.className);
          sampleStudents.push({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            classId: student.classId,
            photoUrl: null,
            qrCode,
            email: student.email,
            phone: student.phone,
            createdAt: new Date()
          });
        } catch (error) {
          console.error(`Error generating QR code for ${student.firstName} ${student.lastName}:`, error);
          // Add student without QR code if generation fails
          sampleStudents.push({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            classId: student.classId,
            photoUrl: null,
            qrCode: '',
            email: student.email,
            phone: student.phone,
            createdAt: new Date()
          });
        }
      }
      
      setStudents(sampleStudents);

      // Add sample staff with QR codes
      const sampleStaff: Staff[] = [];
      
      const staffData = [
        { id: 'staff1', firstName: 'Robert', lastName: 'Thompson', department: 'Mathematics', position: 'Teacher', email: 'robert.thompson@school.edu', phone: '(555) 111-2222' },
        { id: 'staff2', firstName: 'Jennifer', lastName: 'Garcia', department: 'English', position: 'Teacher', email: 'jennifer.garcia@school.edu', phone: '(555) 222-3333' },
        { id: 'staff3', firstName: 'William', lastName: 'Martinez', department: 'Science', position: 'Lab Coordinator', email: 'william.martinez@school.edu', phone: '(555) 333-4444' },
        { id: 'staff4', firstName: 'Mary', lastName: 'Rodriguez', department: 'Administration', position: 'Principal', email: 'mary.rodriguez@school.edu', phone: '(555) 444-5555' },
        { id: 'staff5', firstName: 'James', lastName: 'Lopez', department: 'Administration', position: 'Vice Principal', email: 'james.lopez@school.edu', phone: '(555) 555-6666' }
      ];
      
      for (const staff of staffData) {
        try {
          const qrCode = await generateQRCodeURL(staff.id, 'staff', `${staff.firstName} ${staff.lastName}`, staff.department);
          sampleStaff.push({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            department: staff.department,
            position: staff.position,
            photoUrl: null,
            qrCode,
            email: staff.email,
            phone: staff.phone,
            createdAt: new Date()
          });
        } catch (error) {
          console.error(`Error generating QR code for ${staff.firstName} ${staff.lastName}:`, error);
          // Add staff without QR code if generation fails
          sampleStaff.push({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            department: staff.department,
            position: staff.position,
            photoUrl: null,
            qrCode: '',
            email: staff.email,
            phone: staff.phone,
            createdAt: new Date()
          });
        }
      }
      
      setStaff(sampleStaff);
      
      // Add some sample attendance records
      const sampleAttendance: AttendanceRecord[] = [
        { id: 'att1', studentId: 'student1', staffId: null, classId: 'class1', department: null, status: 'present', customLabel: null, date: new Date(), timestamp: new Date(), type: 'student' },
        { id: 'att2', studentId: 'student2', staffId: null, classId: 'class1', department: null, status: 'present', customLabel: null, date: new Date(), timestamp: new Date(), type: 'student' },
        { id: 'att3', studentId: 'student3', staffId: null, classId: 'class2', department: null, status: 'absent', customLabel: null, date: new Date(), timestamp: new Date(), type: 'student' },
        { id: 'att4', studentId: 'student4', staffId: null, classId: 'class2', department: null, status: 'tardy', customLabel: null, date: new Date(), timestamp: new Date(), type: 'student' },
        { id: 'att5', studentId: 'student5', staffId: null, classId: 'class3', department: null, status: 'present', customLabel: null, date: new Date(), timestamp: new Date(), type: 'student' },
        { id: 'att6', staffId: 'staff1', studentId: null, classId: null, department: 'Mathematics', status: 'present', customLabel: null, date: new Date(), timestamp: new Date(), type: 'staff' },
        { id: 'att7', staffId: 'staff2', studentId: null, classId: null, department: 'English', status: 'present', customLabel: null, date: new Date(), timestamp: new Date(), type: 'staff' },
        { id: 'att8', staffId: 'staff3', studentId: null, classId: null, department: 'Science', status: 'excused', customLabel: 'Training', date: new Date(), timestamp: new Date(), type: 'staff' }
      ];
      
      setAttendanceRecords(sampleAttendance);
    } catch (error) {
      // Even if QR code generation fails, still set basic data
      
      const basicClasses = [
        { id: 'class1', name: 'Mathematics 101', description: 'Basic Mathematics', teacherId: 'teacher1', createdAt: new Date() },
        { id: 'class2', name: 'English Literature', description: 'Classic Literature Studies', teacherId: 'teacher2', createdAt: new Date() }
      ];
      
      const basicStudents = [
        { id: 'student1', firstName: 'John', lastName: 'Smith', classId: 'class1', photoUrl: null, qrCode: '', email: 'john.smith@school.edu', phone: '(555) 123-4567', createdAt: new Date() },
        { id: 'student2', firstName: 'Emma', lastName: 'Johnson', classId: 'class1', photoUrl: null, qrCode: '', email: 'emma.johnson@school.edu', phone: '(555) 234-5678', createdAt: new Date() }
      ];
      
      const basicStaff = [
        { id: 'staff1', firstName: 'Robert', lastName: 'Thompson', department: 'Mathematics', position: 'Teacher', photoUrl: null, qrCode: '', email: 'robert.thompson@school.edu', phone: '(555) 111-2222', createdAt: new Date() }
      ];
      
      setClasses(basicClasses);
      setStudents(basicStudents);
      setStaff(basicStaff);
      setAttendanceRecords([]);
      
    }
  };

  const addStudent = async (studentData: Omit<Student, 'id' | 'qrCode' | 'createdAt'>, photoFile?: File) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      console.log('Adding student:', studentData, 'with photo:', !!photoFile);
      const { data, error } = await supabase
        .from('students')
        .insert([{
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          class_id: studentData.classId || null,
          photo_url: null,
          qr_code: null,
          email: studentData.email || null,
          phone: studentData.phone || null
        }])
        .select()
        .single();

      if (error) throw error;

      let photoUrl = null;
      if (photoFile) {
        try {
        photoUrl = await uploadProfilePhoto(photoFile, data.id, 'student');
        } catch (photoError) {
          console.error('Photo upload failed, continuing without photo:', photoError);
          // Continue without photo rather than failing completely
          photoUrl = null;
        }
      }

      const studentName = `${data.first_name} ${data.last_name}`;
      const className = classes.find(c => c.id === data.class_id)?.name || 'No Class';
      const qrCode = await generateQRCodeURL(data.id, 'student', studentName, className);

      // Update with photo and QR code
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          photo_url: photoUrl,
          qr_code: qrCode
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      const newStudent: Student = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        classId: data.class_id,
        photoUrl,
        qrCode: qrCode,
        email: data.email,
        phone: data.phone,
        createdAt: new Date(data.created_at)
      };

      setStudents(prev => [...prev, newStudent]);
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (id: string, studentData: Partial<Student>, photoFile?: File) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      let photoUrl = studentData.photoUrl;
      
      if (photoFile) {
        try {
        // Delete old photo if exists
        const oldStudent = students.find(s => s.id === id);
        if (oldStudent?.photoUrl) {
          await deleteProfilePhoto(oldStudent.photoUrl);
        }
        photoUrl = await uploadProfilePhoto(photoFile, id, 'student');
        } catch (photoError) {
          console.error('Photo upload failed during update:', photoError);
          // Keep existing photo URL if upload fails
          photoUrl = studentData.photoUrl;
        }
      }

      const updateData: any = {};
      if (studentData.firstName) updateData.first_name = studentData.firstName;
      if (studentData.lastName) updateData.last_name = studentData.lastName;
      if (studentData.classId !== undefined) updateData.class_id = studentData.classId || null;
      if (photoUrl !== undefined) updateData.photo_url = photoUrl;
      if (studentData.email !== undefined) updateData.email = studentData.email || null;
      if (studentData.phone !== undefined) updateData.phone = studentData.phone || null;

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.map(student => 
        student.id === id ? { 
          ...student, 
          ...studentData,
          photoUrl: photoUrl || student.photoUrl
        } : student
      ));
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      // Delete photo if exists
      const student = students.find(s => s.id === id);
      if (student?.photoUrl) {
        await deleteProfilePhoto(student.photoUrl);
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.filter(student => student.id !== id));
      setAttendanceRecords(prev => prev.filter(record => record.studentId !== id));
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  const addStaff = async (staffData: Omit<Staff, 'id' | 'qrCode' | 'createdAt'>, photoFile?: File) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      console.log('Adding staff:', staffData, 'with photo:', !!photoFile);
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          first_name: staffData.firstName,
          last_name: staffData.lastName,
          department: staffData.department,
          position: staffData.position,
          photo_url: null,
          qr_code: null,
          email: staffData.email || null,
          phone: staffData.phone || null
        }])
        .select()
        .single();

      if (error) throw error;

      let photoUrl = null;
      if (photoFile) {
        try {
        photoUrl = await uploadProfilePhoto(photoFile, data.id, 'staff');
        } catch (photoError) {
          console.error('Photo upload failed, continuing without photo:', photoError);
          // Continue without photo rather than failing completely
          photoUrl = null;
        }
      }

      const staffName = `${data.first_name} ${data.last_name}`;
      const department = data.department;
      const qrCode = await generateQRCodeURL(data.id, 'staff', staffName, department);

      // Update with photo and QR code
      const { error: updateError } = await supabase
        .from('staff')
        .update({ 
          photo_url: photoUrl,
          qr_code: qrCode
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      const newStaff: Staff = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        department: data.department,
        position: data.position,
        photoUrl,
        qrCode: qrCode,
        email: data.email,
        phone: data.phone,
        createdAt: new Date(data.created_at)
      };

      setStaff(prev => [...prev, newStaff]);
    } catch (error) {
      console.error('Error adding staff:', error);
      throw error;
    }
  };

  const updateStaff = async (id: string, staffData: Partial<Staff>, photoFile?: File) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      let photoUrl = staffData.photoUrl;
      
      if (photoFile) {
        try {
        // Delete old photo if exists
        const oldStaff = staff.find(s => s.id === id);
        if (oldStaff?.photoUrl) {
          await deleteProfilePhoto(oldStaff.photoUrl);
        }
        photoUrl = await uploadProfilePhoto(photoFile, id, 'staff');
        } catch (photoError) {
          console.error('Photo upload failed during update:', photoError);
          // Keep existing photo URL if upload fails
          photoUrl = staffData.photoUrl;
        }
      }

      const updateData: any = {};
      if (staffData.firstName) updateData.first_name = staffData.firstName;
      if (staffData.lastName) updateData.last_name = staffData.lastName;
      if (staffData.department) updateData.department = staffData.department;
      if (staffData.position) updateData.position = staffData.position;
      if (photoUrl !== undefined) updateData.photo_url = photoUrl;
      if (staffData.email !== undefined) updateData.email = staffData.email || null;
      if (staffData.phone !== undefined) updateData.phone = staffData.phone || null;

      const { error } = await supabase
        .from('staff')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setStaff(prev => prev.map(staffMember => 
        staffMember.id === id ? { 
          ...staffMember, 
          ...staffData,
          photoUrl: photoUrl || staffMember.photoUrl
        } : staffMember
      ));
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      // Delete photo if exists
      const staffMember = staff.find(s => s.id === id);
      if (staffMember?.photoUrl) {
        await deleteProfilePhoto(staffMember.photoUrl);
      }

      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStaff(prev => prev.filter(staffMember => staffMember.id !== id));
      setAttendanceRecords(prev => prev.filter(record => record.staffId !== id));
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  };

  const addClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
    try {
      console.log('🏫 Adding class:', classData);
      
      if (!supabase) {
        console.error('❌ Supabase client not available');
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      console.log('📤 Sending request to Supabase...');
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          name: classData.name,
          description: classData.description,
          teacher_id: classData.teacherId
        }])
        .select()
        .single();

      console.log('📥 Supabase response:', { data, error });
      
      if (error) throw error;

      const newClass: Class = {
        id: data.id,
        name: data.name,
        description: data.description,
        teacherId: data.teacher_id,
        createdAt: new Date(data.created_at)
      };

      console.log('✅ New class created successfully:', newClass);
      setClasses(prev => [...prev, newClass]);
    } catch (error) {
      console.error('Error adding class:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to add class: ${errorMessage}\n\nPlease check the browser console for more details.`);
      throw error;
    }
  };

  const updateClass = async (id: string, classData: Partial<Class>) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      const updateData: any = {};
      if (classData.name) updateData.name = classData.name;
      if (classData.description) updateData.description = classData.description;
      if (classData.teacherId) updateData.teacher_id = classData.teacherId;

      const { error } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setClasses(prev => prev.map(cls => 
        cls.id === id ? { ...cls, ...classData } : cls
      ));
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please check your environment variables.');
      }
      
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClasses(prev => prev.filter(cls => cls.id !== id));
      setStudents(prev => prev.map(student => 
        student.classId === id ? { ...student, classId: '' } : student
      ));
      setAttendanceRecords(prev => prev.filter(record => record.classId !== id));
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  };

  const markAttendance = async (recordData: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      console.log('Marking attendance:', recordData);
      const recordDate = recordData.date.toISOString().split('T')[0];
      console.log('Record date:', recordDate);
      
      // Remove any existing attendance record for the same person on the same date
      console.log('Deleting existing records for:', {
        date: recordDate,
        type: recordData.type,
        personId: recordData.type === 'student' ? recordData.studentId : recordData.staffId
      });
      
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('date', recordDate)
        .eq('type', recordData.type)
        .eq(recordData.type === 'student' ? 'student_id' : 'staff_id', 
           recordData.type === 'student' ? recordData.studentId : recordData.staffId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Add the new attendance record
      const insertData = {
        student_id: recordData.studentId || null,
        staff_id: recordData.staffId || null,
        class_id: recordData.classId || null,
        department: recordData.department || null,
        status: recordData.status,
        custom_label: recordData.customLabel || null,
        date: recordDate,
        type: recordData.type
      };
      
      console.log('Inserting attendance record:', insertData);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      console.log('Successfully inserted attendance record:', data);

      const newRecord: AttendanceRecord = {
        id: data.id,
        studentId: data.student_id,
        staffId: data.staff_id,
        classId: data.class_id,
        department: data.department,
        status: data.status,
        customLabel: data.custom_label,
        date: new Date(data.date),
        timestamp: new Date(data.timestamp),
        type: data.type
      };

      // Update local state
      setAttendanceRecords(prev => {
        const filtered = prev.filter(record => {
          const recordDateStr = new Date(record.date).toISOString().split('T')[0];
          const isSameDate = recordDateStr === recordDate;
          const isSamePerson = recordData.studentId ? 
            record.studentId === recordData.studentId : 
            record.staffId === recordData.staffId;
          const isSameType = record.type === recordData.type;
          
          return !(isSameDate && isSamePerson && isSameType);
        });
        return [...filtered, newRecord];
      });
      
      console.log('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
      // Re-throw the error so UI can handle it
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      students,
      staff,
      classes,
      attendanceRecords,
      addStudent,
      updateStudent,
      deleteStudent,
      addStaff,
      updateStaff,
      deleteStaff,
      addClass,
      updateClass,
      deleteClass,
      markAttendance,
      loading,
      error,
    }}>
      {children}
    </AppContext.Provider>
  );
};