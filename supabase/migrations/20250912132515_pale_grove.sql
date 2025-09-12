@@ .. @@
 */

--- Create user role enum
-CREATE TYPE user_role AS ENUM ('staff', 'student', 'teacher', 'volunteer', 'administrator');
+-- Create user role enum (only if it doesn't exist)
+DO $$ BEGIN
+    CREATE TYPE user_role AS ENUM ('staff', 'student', 'teacher', 'volunteer', 'administrator');
+EXCEPTION
+    WHEN duplicate_object THEN null;
+END $$;

 -- Create user_profiles table