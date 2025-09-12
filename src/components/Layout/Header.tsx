import React from "react";
import { Menu } from "lucide-react";

type Props = { onMenuClick: () => void };

const AppHeader: React.FC<Props> = ({ onMenuClick }) => {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-2 md:px-4">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="text-sm text-gray-700 font-medium">ACE Attendance</div>
      <div className="w-6 h-6" />
    </header>
  );
};

export default AppHeader;
