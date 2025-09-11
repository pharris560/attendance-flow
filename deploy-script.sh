#!/bin/bash

# AttendanceFlow Deployment Script
# Run this script in your local project directory after downloading from WebContainer

echo "🚀 Setting up AttendanceFlow for GitHub deployment..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "Visit: https://git-scm.com/downloads"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Get user info for Git config
echo "⚙️  Configuring Git..."
read -p "Enter your name: " user_name
read -p "Enter your email: " user_email
read -p "Enter your GitHub username: " github_username
read -p "Enter your repository name (default: attendance-flow): " repo_name

# Set default repo name if empty
if [ -z "$repo_name" ]; then
    repo_name="attendance-flow"
fi

# Configure Git
git config user.name "$user_name"
git config user.email "$user_email"

# Add all files
echo "📦 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit - AttendanceFlow smart attendance tracking system

Features:
- Student and staff management
- QR code generation and scanning
- Real-time attendance tracking
- Comprehensive reporting
- CSV import/export
- Photo upload support
- Responsive design"

# Set main branch
git branch -M main

# Add remote origin
echo "🔗 Adding GitHub remote..."
git remote add origin "https://github.com/$github_username/$repo_name.git"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo "✅ Successfully pushed to GitHub!"
echo "🌐 Repository URL: https://github.com/$github_username/$repo_name"
echo ""
echo "Next steps:"
echo "1. Go to Netlify.com and connect this repository"
echo "2. Set build command: npm run build"
echo "3. Set publish directory: dist"
echo "4. Add environment variables for Supabase"
echo "5. Configure your custom domain"