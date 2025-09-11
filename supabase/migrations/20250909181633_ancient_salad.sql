/*
# Fix Storage RLS Policies for Anonymous Users

This migration updates the storage policies to allow anonymous users to upload, update, and delete profile photos.
The existing policies only allowed authenticated users, but the app uses anonymous access.

## Changes:
1. Drop existing storage policies that require authentication
2. Create new policies that allow anonymous (anon) users to manage profile photos
*/

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile photos" ON storage.objects;

-- Create new policies for anonymous users
CREATE POLICY "Anonymous users can upload profile photos"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Anonymous users can update profile photos"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Anonymous users can delete profile photos"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'profile-photos');