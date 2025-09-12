# ACE Attendance - Smart Attendance Tracking System

A modern, comprehensive SaaS attendance management system built with React, TypeScript, and Supabase. This system provides QR code-based attendance tracking for both students and staff with real-time analytics, reporting, and multi-user authentication.

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **Multi-tenant SaaS**: Each user gets their own data workspace
- **Student Management**: Add, edit, and organize students by classes with contact information
- **Staff Management**: Manage staff members with departments, positions, and contact details
- **QR Code Integration**: Generate and scan QR codes for quick attendance marking
- **Real-time Attendance**: Mark attendance with multiple status options (Present, Absent, Tardy, Excused, Other)
- **Comprehensive Reports**: Generate detailed attendance reports and analytics
- **CSV Import**: Bulk import students and staff from CSV files with email and phone support
- **Photo Support**: Upload profile photos for students and staff
- **ID Card Generation**: Download professional ID cards with QR codes
- **Photo Cropping**: Built-in photo cropping tool for profile pictures
- **Email & Phone Support**: Full contact management for students and staff
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Database Integration**: Full Supabase integration with demo mode fallback

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Authentication**: Supabase Auth with email/password
- **Charts**: Recharts
- **QR Codes**: QR Scanner, QRCode.js
- **PDF Export**: jsPDF
- **Image Processing**: html2canvas for ID card generation
- **Build Tool**: Vite

## Live Demo

Visit the live application at: [https://attendanceai.app](https://attendanceai.app)

**Production Features:**
- **Custom domain**: `attendanceai.app`
- Database: Supabase with real-time sync
- QR codes: Generated with production URLs

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ace-attendance.git
   cd ace-attendance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (for database connection):
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=https://attendanceai.app
   
   **Note**: The app will run in demo mode if these variables are not set.

4. Start the development server:
   ```bash
   npm run dev
   ```

## First Time Setup

1. **Create an account** on the login page
2. **Add your first class** in the Classes section
3. **Import students** via CSV or add manually
4. **Generate QR codes** for attendance tracking
5. **Start taking attendance** with the QR scanner or manual entry
6. **View reports** and analytics in the Reports section

### Database Setup (Optional)

The app works in two modes:
- **Demo Mode**: Uses sample data (default if no environment variables)
- **Database Mode**: Connects to Supabase for persistent data

#### For Database Mode:

1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations` folder
3. Create a storage bucket named `profile-photos` for photo uploads
4. Enable email authentication in Supabase Auth settings
5. Set environment variables (see Installation step 3)

#### Database Schema:

The system uses these main tables:
- `students` - Student information with class assignments
- `staff` - Staff members with departments and positions  
- `classes` - Class/course definitions
- `auth.users` - User accounts and authentication (managed by Supabase)
- `attendance_records` - All attendance entries with timestamps

## Deployment

### Netlify (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Manual Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `VITE_APP_URL` | Your production domain (optional) |

## Usage

### Taking Attendance

**First, create an account:**
1. Visit the login page
2. Click "Sign Up" and create your account
3. Sign in to access the full application

1. Navigate to the Classes page
2. Click on a class to enter attendance mode
3. Select the date and mark attendance for each student/staff member
4. Use different status options: Present, Absent, Tardy, Excused, or Other (with custom labels)
4. Use QR Scanner for quick attendance marking

### Managing Students/Staff

1. Use the Students or Staff pages to add new members
2. Import bulk data using CSV files
3. Upload profile photos for better identification
4. Download ID cards with QR codes
5. Add contact information (email/phone)

### Generating Reports

1. Go to the Reports page
2. Select date ranges and filters
3. Export reports as PDF or CSV

### QR Code Scanning

1. Generate QR codes from the QR Codes page
2. Use the QR Scanner to mark attendance automatically
3. QR codes contain attendance URLs that work on any device
4. Manual entry option available as backup

## Project Structure

- `/src/pages/Login.tsx` - Authentication and user registration
- `/src/components` - Reusable UI components
- `/src/pages` - Main application pages
- `/src/contexts` - React context for state management
- `/src/lib` - Supabase client and utilities
- `/src/types` - TypeScript type definitions
- `/src/utils` - Helper functions and utilities
- `/supabase/migrations` - Database schema migrations

## Authentication Flow

1. **User Registration** - Create account with email/password
2. **Email Verification** - Supabase handles email confirmation
3. **Secure Sessions** - Persistent login across browser sessions
4. **Protected Routes** - All app features require authentication
5. **User Isolation** - Each user's data is completely separate

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support regarding ACE Attendance, please open an issue on GitHub or contact the development team.