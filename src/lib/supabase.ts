import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase configuration:', { 
  url: supabaseUrl ? 'Set' : 'Missing', 
  key: supabaseAnonKey ? 'Set' : 'Missing' 
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to upload profile photos
export const uploadProfilePhoto = async (file: File, userId: string, type: 'student' | 'staff'): Promise<string> => {
  try {
    console.log('Starting photo upload for:', { userId, type, fileName: file.name });
    
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${userId}_${Date.now()}.${fileExt}`;
  const filePath = `${type}s/${fileName}`;

    console.log('Uploading to path:', filePath);
    
  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, file);

  if (uploadError) {
      console.error('Upload error:', uploadError);
      // If bucket doesn't exist or has permission issues, try to create it
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('permission')) {
        console.log('Attempting to create storage bucket...');
        const { error: bucketError } = await supabase.storage.createBucket('profile-photos', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 1024 * 1024 * 5 // 5MB limit
        });
        
        if (bucketError && !bucketError.message.includes('already exists')) {
          console.error('Bucket creation error:', bucketError);
          throw new Error(`Storage setup failed: ${bucketError.message}`);
        }
        
        // Try upload again after bucket creation
        const { error: retryError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, file);
          
        if (retryError) {
          throw new Error(`Photo upload failed: ${retryError.message}`);
        }
      } else {
    throw uploadError;
      }
  }

    console.log('Upload successful, getting public URL...');
  const { data } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

    console.log('Public URL generated:', data.publicUrl);
  return data.publicUrl;
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
};

// Helper function to delete profile photos
export const deleteProfilePhoto = async (photoUrl: string): Promise<void> => {
  if (!photoUrl) return;
  
  // Extract file path from URL
  const urlParts = photoUrl.split('/');
  const bucketIndex = urlParts.findIndex(part => part === 'profile-photos');
  if (bucketIndex === -1) return;
  
  const filePath = urlParts.slice(bucketIndex + 1).join('/');
  
  await supabase.storage
    .from('profile-photos')
    .remove([filePath]);
};