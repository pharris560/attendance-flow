export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classId: string | null;
  photoUrl?: string | null;
  qrCode: string;
  createdAt: Date;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  photoUrl?: string | null;
  qrCode: string;
  createdAt: Date;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  teacherId: string | null;
  assistantTeacherId?: string | null;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  studentId: string | null;
  staffId?: string | null;
  classId: string | null;
  department?: string | null;
  status: 'present' | 'absent' | 'tardy' | 'excused' | 'other';
  customLabel?: string | null;
  date: Date;
  timestamp: Date;
  type: 'student' | 'staff';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}