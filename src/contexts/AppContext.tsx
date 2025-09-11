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

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading data from Supabase...');
      
      // Load classes first (needed for students foreign key)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: true });

      if (classesError) {
        console.error('Error loading classes:', classesError);
        throw classesError;
      }

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: true });

      if (studentsError) {
        console.error('Error loading students:', studentsError);
        throw studentsError;
      }

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: true });

      if (staffError) {
        console.error('Error loading staff:', staffError);
        throw staffError;
      }

      // Load attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .order('timestamp', { ascending: false });

      if (attendanceError) {
        console.error('Error loading attendance records:', attendanceError);
        throw attendanceError;
      }

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
          createdAt: new Date(staff.created_at)
        })));
        setAttendanceRecords(attendanceData);
      }
      
      // Check if any students or staff are missing QR codes and generate them
      const studentsNeedingQR = studentsData.filter(student => !student.qr_code);
      const staffNeedingQR = staffData.filter(staff => !staff.qr_code);
      
      // Force regenerate ALL QR codes to ensure they have the correct format
      console.log('Force regenerating QR codes for all users to ensure correct format');
      await generateMissingQRCodes(studentsData, staffData, classesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMissingQRCodes = async (studentsNeedingQR: any[], staffNeedingQR: any[], classesData: any[]) => {
    try {
      // Generate QR codes for students
      for (const student of studentsNeedingQR) {
        console.log('Generating QR code for student:', student.id);
        const studentName = `${student.first_name} ${student.last_name}`;
        const className = classesData.find(c => c.id === student.class_id)?.name || 'No Class';
        const qrCode = await generateQRCodeURL(student.id, 'student', studentName, className);
        console.log('Generated QR code for student:', student.id, qrCode ? 'Success' : 'Failed');
        await supabase
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
        console.log('Generating QR code for staff:', staffMember.id);
        const staffName = `${staffMember.first_name} ${staffMember.last_name}`;
        const department = staffMember.department;
        const qrCode = await generateQRCodeURL(staffMember.id, 'staff', staffName, department);
        console.log('Generated QR code for staff:', staffMember.id, qrCode ? 'Success' : 'Failed');
        await supabase
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
        { name: 'Mathematics 101', description: 'Basic Mathematics', teacherId: 'teacher1' },
        { name: 'English Literature', description: 'Classic Literature Studies', teacherId: 'teacher2' },
        { name: 'Science Lab', description: 'Experimental Science', teacherId: 'teacher3' }
      ];

      const classPromises = sampleClasses.map(cls => addClass(cls));
      await Promise.all(classPromises);

      // Wait a bit for classes to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload classes to get IDs
      const { data: newClassesData } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: true });

      if (newClassesData && newClassesData.length > 0) {
        // Add sample students
        const sampleStudents = [
          { firstName: 'John', lastName: 'Smith', classId: newClassesData[0].id },
          { firstName: 'Emma', lastName: 'Johnson', classId: newClassesData[0].id },
          { firstName: 'Michael', lastName: 'Brown', classId: newClassesData[1].id },
          { firstName: 'Sarah', lastName: 'Davis', classId: newClassesData[1].id },
          { firstName: 'David', lastName: 'Wilson', classId: newClassesData[2].id },
          { firstName: 'Lisa', lastName: 'Anderson', classId: newClassesData[2].id }
        ];

        const studentPromises = sampleStudents.map(student => addStudent(student));
        await Promise.all(studentPromises);

        // Add sample staff
        const sampleStaff = [
          { firstName: 'Robert', lastName: 'Thompson', department: 'Mathematics', position: 'Teacher' },
          { firstName: 'Jennifer', lastName: 'Garcia', department: 'English', position: 'Teacher' },
          { firstName: 'William', lastName: 'Martinez', department: 'Science', position: 'Lab Coordinator' },
          { firstName: 'Mary', lastName: 'Rodriguez', department: 'Administration', position: 'Principal' },
          { firstName: 'James', lastName: 'Lopez', department: 'Administration', position: 'Vice Principal' }
        ];

        const staffPromises = sampleStaff.map(staff => addStaff(staff));
        await Promise.all(staffPromises);
      }

      // Reload all data after adding samples
      await loadData();
    } catch (error) {
      console.error('Error adding sample data:', error);
    }
  };

  const addStudent = async (studentData: Omit<Student, 'id' | 'qrCode' | 'createdAt'>, photoFile?: File) => {
    try {
      console.log('Adding student:', studentData, 'with photo:', !!photoFile);
      const { data, error } = await supabase
        .from('students')
        .insert([{
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          class_id: studentData.classId || null,
          photo_url: null,
          qr_code: null
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
      console.log('Adding staff:', staffData, 'with photo:', !!photoFile);
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          first_name: staffData.firstName,
          last_name: staffData.lastName,
          department: staffData.department,
          position: staffData.position,
          photo_url: null,
          qr_code: null
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
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          name: classData.name,
          description: classData.description,
          teacher_id: classData.teacherId
        }])
        .select()
        .single();

      if (error) throw error;

      const newClass: Class = {
        id: data.id,
        name: data.name,
        description: data.description,
        teacherId: data.teacher_id,
        createdAt: new Date(data.created_at)
      };

      setClasses(prev => [...prev, newClass]);
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  };

  const updateClass = async (id: string, classData: Partial<Class>) => {
    try {
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
    }}>
      {children}
    </AppContext.Provider>
  );
};