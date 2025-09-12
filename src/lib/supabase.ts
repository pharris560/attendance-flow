import { createClient } from '@supabase/supabase-js';

// Environment variable checks (reduced logging for performance)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = supabaseUrl && supabaseKey 
  ? (() => {
      try {
        const client = createClient(supabaseUrl, supabaseKey);
        return client;
      } catch (error) {
        console.error('❌ Error creating Supabase client:', error);
        return null;
      }
    })()
  : (() => {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Supabase not configured - running in demo mode');
      }
      return null;
    })();

// Test connection if client exists
if (supabase) {
  (async () => {
    try {
      // Test auth connection
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        if (import.meta.env.DEV) {
          console.error('❌ Supabase auth test failed:', authError);
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('✅ Supabase connected');
        }
      }
      
      // Test user_profiles table specifically
      const { data: profilesData, error: profilesError } = await supabase.from('user_profiles').select('*').limit(1);
      if (profilesError) {
        if (import.meta.env.DEV) {
          console.error('❌ user_profiles table test failed:', profilesError);
        }
      }
      
      // Test database connection
      const { data: classesData, error: classesError } = await supabase.from('classes').select('*').limit(1);
      if (classesError) {
        if (import.meta.env.DEV) {
          console.error('❌ Database connection failed:', classesError);
        }
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('❌ Supabase connection error:', err);
      }
    }
  })();
}

// Helper function to upload profile photos
export const uploadProfilePhoto = async (file: File, userId: string, type: 'student' | 'staff'): Promise<string> => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file);

    if (uploadError) {
      // If bucket doesn't exist or has permission issues, try to create it
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('permission')) {
        const { error: bucketError } = await supabase.storage.createBucket('profile-photos', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 1024 * 1024 * 5 // 5MB limit
        });
        
        if (bucketError && !bucketError.message.includes('already exists')) {
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

    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
};

// Helper function to delete profile photos
export const deleteProfilePhoto = async (photoUrl: string): Promise<void> => {
  if (!photoUrl || !supabase) return;
  
  // Extract file path from URL
  const urlParts = photoUrl.split('/');
  const bucketIndex = urlParts.findIndex(part => part === 'profile-photos');
  if (bucketIndex === -1) return;
  
  const filePath = urlParts.slice(bucketIndex + 1).join('/');
  
  await supabase.storage
    .from('profile-photos')
    .remove([filePath]);
};