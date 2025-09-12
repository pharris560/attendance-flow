import React from "react";
import { Menu, LogOut, User, Shield, GraduationCap, Users, Heart, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Props = { onMenuClick: () => void };

const AppHeader: React.FC<Props> = ({ onMenuClick }) => {
  const { user, userProfile, signOut } = useAuth();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrator': return <Shield className="w-4 h-4 text-red-600" />;
      case 'teacher': return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'staff': return <Users className="w-4 h-4 text-purple-600" />;
      case 'volunteer': return <Heart className="w-4 h-4 text-green-600" />;
      case 'student': return <User className="w-4 h-4 text-gray-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator': return 'text-red-600 bg-red-50';
      case 'teacher': return 'text-blue-600 bg-blue-50';
      case 'staff': return 'text-purple-600 bg-purple-50';
      case 'volunteer': return 'text-green-600 bg-green-50';
      case 'student': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
      
      {user && userProfile && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm">
              {getRoleIcon(userProfile.role)}
              <div className="hidden sm:block">
                <div className="font-medium text-gray-900">{userProfile.fullName}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
            <span className={`hidden md:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(userProfile.role)}`}>
              {userProfile.role}
            </span>
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
      
      {(!user || !userProfile) && (
        <div className="w-6 h-6" />
      )}
    </header>
  );
};

export default AppHeader;
