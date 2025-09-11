# Fresh Deployment Guide for ACE Attendance

## 🚀 **Complete Fresh Deployment Steps**

### **Option 1: Download and Re-upload to Netlify**

1. **Download Current Project:**
   - Download all files from this WebContainer
   - Ensure you have the latest version with all features

2. **Build Locally (if you have Node.js):**
   ```bash
   npm install
   npm run build
   ```

3. **Manual Deploy to Netlify:**
   - Go to Netlify Dashboard
   - Drag and drop the `dist` folder to deploy
   - Or use "Deploy manually" option

### **Option 2: Connect to Fresh GitHub Repository**

1. **Create New GitHub Repository:**
   - Create a new repo called `ace-attendance-v2`
   - Upload all current files

2. **Connect to Netlify:**
   - Disconnect current GitHub connection
   - Connect to new repository
   - Set build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

### **Option 3: Force Complete Rebuild**

1. **In Netlify Dashboard:**
   - Site settings → Build & deploy
   - Environment variables (verify these exist):
     - `VITE_SUPABASE_URL`: `https://kzetbefeojjfwlilconv.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZXRiZWZlb2pqZndsaWxjb252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MDQ4NzEsImV4cCI6MjA0MTQ4MDg3MX0.VvVXp8_W6wJhT8zOqJGZ8zOqJGZ8zOqJGZ8zOqJGZ8`

2. **Delete and Recreate Site:**
   - Delete current Netlify site
   - Create new site with same domain
   - Upload fresh code

## 🎯 **What You Should See After Fresh Deployment:**

- ✅ **Download ID Card** buttons on student/staff cards
- ✅ **Photo cropping** functionality when adding photos
- ✅ **Enhanced QR codes** with proper attendance URLs
- ✅ **Staff attendance** management in Classes
- ✅ **CSV import** with preview
- ✅ **Real Supabase** database connection (not demo mode)

## 🔍 **Verification Steps:**

1. **Check Students Page:**
   - Should see "Download ID Card" buttons
   - Photo upload with cropping
   - CSV import option

2. **Check Staff Page:**
   - Same ID card functionality
   - Department/position fields

3. **Check Classes Page:**
   - Staff class should show staff members
   - Attendance marking for both students and staff

4. **Check Browser Console:**
   - Should see Supabase connection messages
   - No demo mode warnings

## 🚨 **If Still Not Working:**

The issue is likely that Netlify is connected to an outdated code repository. The fresh deployment approach should resolve this completely.