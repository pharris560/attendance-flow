/*
  # Add User Roles System

  1. New Tables
    - `user_profiles` - Extended user information with roles
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `role` (enum: staff, student, teacher, volunteer, administrator)
      - `email` (text, from auth.users)
      - `phone` (text, optional)
      - `department` (text, optional for staff/teachers)
      - `position` (text, optional for staff/teachers)
      - `class_id` (uuid, optional for students)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Users can read/update their own profile
    - Administrators can manage all profiles

  3. Functions
    - Auto-create profile on user signup
    - Update profile trigger
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('staff', 'student', 'teacher', 'volunteer', 'administrator');

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  email text NOT NULL,
  phone text,
  department text,
  position text,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Administrators can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

CREATE POLICY "Administrators can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

CREATE POLICY "Administrators can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    'student'  -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle profile updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_department_idx ON user_profiles(department);
CREATE INDEX IF NOT EXISTS user_profiles_class_id_idx ON user_profiles(class_id);

-- Insert a default administrator (you can update this with your email)
-- This will only work if a user with this email exists in auth.users
INSERT INTO user_profiles (id, full_name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', 'Administrator'),
  email,
  'administrator'
FROM auth.users 
WHERE email = 'admin@attendanceai.app'  -- Change this to your admin email
ON CONFLICT (id) DO UPDATE SET role = 'administrator';