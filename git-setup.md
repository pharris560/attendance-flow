# Git Setup Instructions for AttendanceFlow

## Prerequisites
1. Create a new repository on GitHub named `attendance-flow` (or your preferred name)
2. Have Git installed on your local machine

## Step-by-Step Instructions

### 1. Download Your Project
Download all the project files from your current WebContainer environment to your local machine.

### 2. Open Terminal/Command Prompt
Navigate to your project folder where you extracted the files.

### 3. Run These Commands

```bash
# Initialize Git repository
git init

# Configure Git (replace with your info)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - AttendanceFlow smart attendance tracking system"

# Set main branch
git branch -M main

# Add remote origin (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### 4. Alternative: Use GitHub CLI (if installed)
```bash
# Login to GitHub
gh auth login

# Create repository and push
gh repo create attendance-flow --public --source=. --remote=origin --push
```

## Important Files to Include
Make sure these files are in your project directory:
- package.json
- src/ folder with all components
- index.html
- vite.config.ts
- tailwind.config.js
- netlify.toml
- README.md

## Environment Variables for Production
After deploying to Netlify, add these environment variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_APP_URL (your production domain)

## Next Steps After Pushing to GitHub
1. Go to Netlify.com
2. Connect your GitHub repository
3. Deploy with build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add your custom domain
5. Configure environment variables