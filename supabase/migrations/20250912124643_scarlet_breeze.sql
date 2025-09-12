@@ .. @@
 -- Function to handle new user signup
 create or replace function public.handle_new_user()
 returns trigger as $$
 begin
+  -- Add detailed logging
+  raise log 'Creating user profile for user: %', new.id;
+  
   insert into public.user_profiles (id, full_name, email, role)
   values (
     new.id,
-    new.raw_user_meta_data->>'full_name',
+    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
     new.email,
     'student'
   );
+  
+  raise log 'User profile created successfully for: %', new.email;
   return new;
+exception
+  when others then
+    raise log 'Error creating user profile: %', SQLERRM;
+    -- Don't fail the signup if profile creation fails
+    return new;
 end;
 $$ language plpgsql security definer;