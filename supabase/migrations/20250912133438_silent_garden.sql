/*
  # User Profiles and Roles System - Fixed Version

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (user_role enum)
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
    - `handle_new_user()` - Automatically creates profile when user signs up
    - `handle_updated_at()` - Updates the updated_at timestamp
*/

-- Check if user_role type exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('staff', 'student', 'teacher', 'volunteer', 'administrator');
    END IF;
END $$;

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

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Administrators can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Administrators can insert profiles" ON user_profiles;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_department_idx ON user_profiles(department);
CREATE INDEX IF NOT EXISTS user_profiles_class_id_idx ON user_profiles(class_id);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;

-- Trigger for updated_at
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    'student'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- IMPORTANT: Replace 'your-email@example.com' with YOUR actual email address
-- Make the first user (you) an administrator
DO $$
BEGIN
  -- Update existing user to admin if they exist
  UPDATE user_profiles 
  SET role = 'administrator' 
  WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL
  
  -- If no rows were updated, the user doesn't exist yet
  -- They will be made admin when they sign up
  
  RAISE NOTICE 'Migration completed successfully. If you have an account with the specified email, it has been made an administrator.';
END $$;