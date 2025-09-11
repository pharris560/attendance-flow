/*
# Fix RLS Policy Violations

This script updates the RLS policies to allow public access since the app doesn't use authentication.

## Instructions:
1. Go to your Supabase Dashboard: https://kzetbefeojjfwlilconv.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this entire script
5. Click "Run" to execute

This will update the policies to allow public access for all tables.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage students" ON students;
DROP POLICY IF EXISTS "Users can manage staff" ON staff;
DROP POLICY IF EXISTS "Users can manage classes" ON classes;
DROP POLICY IF EXISTS "Users can manage attendance records" ON attendance_records;

-- Create new policies that allow public access
CREATE POLICY "Public can manage students"
  ON students
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can manage staff"
  ON staff
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can manage classes"
  ON classes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can manage attendance records"
  ON attendance_records
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);