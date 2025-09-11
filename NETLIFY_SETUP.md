# Setting Up Environment Variables in Netlify

## 🔧 **Configure Supabase Environment Variables**

### **Step 1: Go to Netlify Site Settings**
1. Go to your Netlify dashboard
2. Click on your **attendanceia.app** site
3. Go to **Site settings** → **Environment variables**

### **Step 2: Add Environment Variables**
Click **"Add a variable"** and add these two variables:

**Variable 1:**
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://kzetbefeojjfwlilconv.supabase.co`

**Variable 2:**
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZXRiZWZlb2pqZndsaWxjb252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MDQ4NzEsImV4cCI6MjA0MTQ4MDg3MX0.VvVXp8_W6wJhT8zOqJGZ8zOqJGZ8zOqJGZ8zOqJGZ8`

### **Step 3: Redeploy**
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for the new build to complete

### **Step 4: Verify**
- Visit your live site: `https://attendanceia.app`
- Check browser console - you should see Supabase connection messages
- The app will now use your real database instead of demo data

## 🎯 **What This Does:**
- Connects your deployed app to your Supabase database
- Enables real data storage and retrieval
- Removes demo mode limitations
- Allows full functionality including QR codes, attendance tracking, etc.

## ⚠️ **Important Notes:**
- Environment variables are only applied on new deployments
- The app will automatically detect the variables and switch from demo mode
- Your existing demo data won't transfer - you'll start fresh with your database