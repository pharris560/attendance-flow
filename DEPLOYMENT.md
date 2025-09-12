# Deployment Guide

## Quick Deploy to Netlify

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub** (see instructions below)
2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add:
     - `VITE_SUPABASE_URL`: `https://kzetbefeojjfwlilconv.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZXRiZWZlb2pqZndsaWxjb252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MDQ4NzEsImV4cCI6MjA0MTQ4MDg3MX0.VvVXp8_W6wJhT8zOqJGZ8zOqJGZ8zOqJGZ8zOqJGZ8`

4. **Deploy:** Netlify will automatically build and deploy

### Option 2: Manual Deploy

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Drag the `dist` folder to [netlify.com/drop](https://netlify.com/drop)
   - Or use Netlify CLI: `netlify deploy --prod --dir=dist`

## Environment Variables

### Required for Database Connection:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional:
- `VITE_APP_URL` - Your production domain (for QR code generation)

## Verification

After deployment, check:
1. Open browser developer tools
2. Look for console messages:
   - `✅ Supabase connection successful!` = Database connected
   - `🔄 App will run in DEMO MODE` = Using sample data

## Troubleshooting

### Still in Demo Mode?
- Verify environment variables are set correctly
- Trigger a new deployment after adding variables
- Check browser console for connection errors

### Build Errors?
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run typecheck`
- Verify Node.js version is 18+