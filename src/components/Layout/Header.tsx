import React from "react";
import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Props = { onMenuClick: () => void };

const AppHeader: React.FC<Props> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="text-sm text-gray-700 font-medium">ACE Attendance</div>
      
      {user && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{user.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}
      
      {!user && (
        <div className="w-6 h-6" />
      )}
    </header>
  );
};

export default AppHeader;
