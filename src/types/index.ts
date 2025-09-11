export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classId: string;
  photoUrl?: string;
  qrCode: string;
  createdAt: Date;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  photoUrl?: string;
  qrCode: string;
  createdAt: Date;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  staffId?: string;
  classId: string;
  department?: string;
  status: 'present' | 'absent' | 'tardy' | 'excused' | 'other';
  customLabel?: string;
  date: Date;
  timestamp: Date;
  type: 'student' | 'staff';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}