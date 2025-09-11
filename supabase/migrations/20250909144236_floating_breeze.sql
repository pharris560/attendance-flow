@@ .. @@
 -- Create new policies that allow public access
 CREATE POLICY "Public can manage students"
   ON students
   FOR ALL
-  TO public
+  TO anon
   USING (true)
   WITH CHECK (true);
 
 CREATE POLICY "Public can manage staff"
   ON staff
   FOR ALL
-  TO public
+  TO anon
   USING (true)
   WITH CHECK (true);
 
 CREATE POLICY "Public can manage classes"
   ON classes
   FOR ALL
-  TO public
+  TO anon
   USING (true)
   WITH CHECK (true);
 
 CREATE POLICY "Public can manage attendance records"
   ON attendance_records
   FOR ALL
-  TO public
+  TO anon
   USING (true)
   WITH CHECK (true);