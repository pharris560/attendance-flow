# ACE Attendance - Smart Attendance Tracking System

A modern, comprehensive attendance management system built with React, TypeScript, and Supabase.

## Features

- **Student Management**: Add, edit, and organize students by classes
- **Staff Management**: Manage staff members with departments and positions
- **QR Code Integration**: Generate and scan QR codes for quick attendance marking
- **Real-time Attendance**: Mark attendance with multiple status options (Present, Absent, Tardy, Excused, Other)
- **Comprehensive Reports**: Generate detailed attendance reports and analytics
- **CSV Import**: Bulk import students and staff from CSV files
- **Photo Support**: Upload profile photos for students and staff
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Charts**: Recharts
- **QR Codes**: QR Scanner, QRCode.js
- **PDF Export**: jsPDF
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pharris560/ace-attendance.git
   cd ace-attendance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations` folder
3. Set up Row Level Security (RLS) policies as needed
4. Create a storage bucket named `profile-photos` for photo uploads

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

## Usage

### Taking Attendance

1. Navigate to the Classes page
2. Click on a class to enter attendance mode
3. Select the date and mark attendance for each student
4. Use QR Scanner for quick attendance marking

### Managing Students/Staff

1. Use the Students or Staff pages to add new members
2. Import bulk data using CSV files
3. Upload profile photos for better identification

### Generating Reports

1. Go to the Reports page
2. Select date ranges and filters
3. Export reports as PDF or CSV

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support regarding ACE Attendance, please open an issue on GitHub or contact the development team.