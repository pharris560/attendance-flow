/*
  # Create user profiles table with roles

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (enum: staff, student, teacher, volunteer, administrator)
      - `email` (text)
      - `phone` (text, optional)
      - `department` (text, optional)
      - `position` (text, optional)
      - `class_id` (uuid, optional, references classes)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for users to read/update their own data
    - Add policies for administrators to manage all profiles

  3. Functions
    - Auto-create user profile when user signs up
    - Handle updated_at timestamp automatically
*/

-- Create user role enum
CREATE TYPE user_role AS ENUM ('staff', 'student', 'teacher', 'volunteer', 'administrator');

-- Create user_profiles table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_department_idx ON user_profiles(department);
CREATE INDEX IF NOT EXISTS user_profiles_class_id_idx ON user_profiles(class_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Get email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Get name from user metadata or use email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1)
  );
  
  -- Insert user profile
  INSERT INTO user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    user_name,
    user_email,
    'student'::user_role
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create a default administrator (replace with your email)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if there's already an admin
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'administrator') THEN
    -- Look for a user with admin email (replace with your actual email)
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@attendanceai.app'  -- CHANGE THIS TO YOUR EMAIL
    LIMIT 1;
    
    -- If admin user exists, update their role
    IF admin_user_id IS NOT NULL THEN
      UPDATE user_profiles 
      SET role = 'administrator'::user_role 
      WHERE id = admin_user_id;
      
      RAISE NOTICE 'Updated user % to administrator role', admin_user_id;
    END IF;
  END IF;
END $$;