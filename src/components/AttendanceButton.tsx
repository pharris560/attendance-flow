import React from 'react';

interface AttendanceButtonProps {
  status: 'present' | 'absent' | 'tardy' | 'excused' | 'other';
  label: string;
  onClick: () => void;
  active?: boolean;
  loading?: boolean;
}

const AttendanceButton: React.FC<AttendanceButtonProps> = ({
  status,
  label,
  onClick,
  active = false,
  loading = false
}) => {
  const getButtonClasses = () => {
    const baseClasses = "px-2 lg:px-4 py-1 lg:py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs lg:text-sm";
    
    if (active) {
      // Active state - show assigned colors
      switch (status) {
        case 'present':
          return `${baseClasses} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 ring-2 ring-green-500 shadow-lg`;
        case 'absent':
          return `${baseClasses} bg-red-400 hover:bg-red-500 text-white focus:ring-red-400 ring-2 ring-red-400 shadow-lg`;
        case 'tardy':
          return `${baseClasses} bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 ring-2 ring-amber-500 shadow-lg`;
        case 'excused':
          return `${baseClasses} bg-sky-400 hover:bg-sky-500 text-white focus:ring-sky-400 ring-2 ring-sky-400 shadow-lg`;
        case 'other':
          return `${baseClasses} bg-orange-400 hover:bg-orange-500 text-white focus:ring-orange-400 ring-2 ring-orange-400 shadow-lg`;
        default:
          return `${baseClasses} bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500 shadow-lg`;
      }
    } else {
      // Default state - light gray with subtle hover effects
      return `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-300 hover:shadow-md`;
    }
  };

  return (
    <button
      className={getButtonClasses()}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          <span>{label}</span>
        </div>
      ) : (
        label
      )}
    </button>
  );
};

export default AttendanceButton;