// src/components/Layout/Header.tsx
import React from "react";

const AppHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      {/* 64px toolbar */}
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="text-sm text-gray-700 font-medium">ACE Attendance</div>
        {/* right-side actions can go here */}
      </div>
    </header>
  );
};

export default AppHeader;
