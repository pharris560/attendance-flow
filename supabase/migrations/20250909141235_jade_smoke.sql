/*
  # Create attendance tracking schema

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `class_id` (uuid, foreign key)
      - `photo_url` (text, optional)
      - `qr_code` (text)
      - `created_at` (timestamp)
    - `staff`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `department` (text)
      - `position` (text)
      - `photo_url` (text, optional)
      - `qr_code` (text)
      - `created_at` (timestamp)
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `teacher_id` (text)
      - `created_at` (timestamp)
    - `attendance_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, optional, foreign key)
      - `staff_id` (uuid, optional, foreign key)
      - `class_id` (uuid, optional, foreign key)
      - `department` (text, optional)
      - `status` (text)
      - `custom_label` (text, optional)
      - `date` (date)
      - `timestamp` (timestamptz)
      - `type` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add storage bucket for profile photos with public access
</sql>

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  photo_url text,
  qr_code text,
  created_at timestamptz DEFAULT now()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  photo_url text,
  qr_code text,
  created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  department text,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'excused', 'other')),
  custom_label text,
  date date NOT NULL,
  timestamp timestamptz DEFAULT now(),
  type text NOT NULL CHECK (type IN ('student', 'staff'))
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for students
CREATE POLICY "Users can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for staff
CREATE POLICY "Users can manage staff"
  ON staff
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for classes
CREATE POLICY "Users can manage classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for attendance_records
CREATE POLICY "Users can manage attendance records"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for profile photos
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can update profile photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can delete profile photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-photos');