import { createClient } from '@supabase/supabase-js';

// Comprehensive environment variable debugging
console.log('🔧 ACE Attendance Environment Debug:');
console.log('='.repeat(50));
console.log('Current URL:', window.location.href);
console.log('Domain:', window.location.hostname);
console.log('Build mode:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);
console.log('Dev mode:', import.meta.env.DEV);
console.log('Prod mode:', import.meta.env.PROD);
console.log('SSR mode:', import.meta.env.SSR);

// Log all available environment variables
console.log('\n📋 All Available Environment Variables:');
const allEnvVars = Object.keys(import.meta.env);
console.log('Total env vars found:', allEnvVars.length);
allEnvVars.forEach(key => {
  const value = import.meta.env[key];
  if (key.includes('SUPABASE')) {
    console.log(`${key}:`, value ? `✅ SET (${value.length} chars)` : '❌ MISSING');
    if (value) {
      console.log(`  → Starts with: ${value.substring(0, 20)}...`);
      console.log(`  → Ends with: ...${value.substring(value.length - 10)}`);
    }
  } else {
    console.log(`${key}:`, value);
  }
});

// Specific checks for our variables
console.log('\n🎯 Specific Variable Checks:');
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL check:');
console.log('  Raw value:', supabaseUrl);
console.log('  Type:', typeof supabaseUrl);
console.log('  Length:', supabaseUrl?.length || 0);
console.log('  Truthy:', !!supabaseUrl);

console.log('VITE_SUPABASE_ANON_KEY check:');
console.log('  Raw value type:', typeof supabaseKey);
console.log('  Length:', supabaseKey?.length || 0);
console.log('  Truthy:', !!supabaseKey);
console.log('  Starts with eyJ:', supabaseKey?.startsWith('eyJ') || false);

// Check if variables are exactly what we expect
const expectedUrl = 'https://kzetbefeojjfwlilconv.supabase.co';
const expectedKeyStart = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

console.log('\n✅ Expected vs Actual:');
console.log('URL matches expected:', supabaseUrl === expectedUrl);
console.log('Key starts correctly:', supabaseKey?.startsWith(expectedKeyStart) || false);

if (supabaseUrl !== expectedUrl) {
  console.log('Expected URL:', expectedUrl);
  console.log('Actual URL:', supabaseUrl);
}

// Try to create Supabase client
console.log('\n🔌 Supabase Client Creation:');
export const supabase = supabaseUrl && supabaseKey 
  ? (() => {
      console.log('✅ Creating Supabase client...');
      try {
        const client = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client created successfully');
        return client;
      } catch (error) {
        console.error('❌ Error creating Supabase client:', error);
        return null;
      }
    })()
  : (() => {
      console.error('❌ Cannot create Supabase client - missing variables');
      console.error('Missing:', {
        url: !supabaseUrl,
        key: !supabaseKey
      });
      return null;
    })();

// Test connection if client exists
if (supabase) {
  console.log('\n🧪 Testing Supabase Connection...');
  (async () => {
    try {
      const { count, error } = await supabase.from('classes').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('❌ Connection test failed:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('✅ Connection successful! Classes table accessible');
        console.log('Classes count:', count);
      }
    } catch (err: unknown) {
      console.error('❌ Connection test threw error:', err);
    }
  })();
} else {
  console.error('❌ No Supabase client to test');
}

console.log('='.repeat(50));

// Helper function to upload profile photos
export const uploadProfilePhoto = async (file: File, userId: string, type: 'student' | 'staff'): Promise<string> => {
  try {
    console.log('Starting photo upload for:', { userId, type, fileName: file.name });
    
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    
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