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
    const baseClasses = "px-2 lg:px-4 py-1 lg:py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs lg:text-sm min-w-[60px] lg:min-w-[80px]";
    
    if (active) {
      // Active state - show assigned colors
      switch (status) {
        case 'present':
          return `${baseClasses} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 ring-2 ring-green-300 shadow-lg scale-105`;
        case 'absent':
          return `${baseClasses} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 ring-2 ring-red-300 shadow-lg scale-105`;
        case 'tardy':
          return `${baseClasses} bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 ring-2 ring-amber-300 shadow-lg scale-105`;
        case 'excused':
          return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 ring-2 ring-blue-300 shadow-lg scale-105`;
        case 'other':
          return `${baseClasses} bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500 ring-2 ring-orange-300 shadow-lg scale-105`;
        default:
          return `${baseClasses} bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500 ring-2 ring-gray-300 shadow-lg scale-105`;
      }
    } else {
      // Default state - light gray with subtle hover effects
      switch (status) {
        case 'present':
          return `${baseClasses} bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 focus:ring-green-300 hover:shadow-md border border-gray-300 hover:border-green-300`;
        case 'absent':
          return `${baseClasses} bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 focus:ring-red-300 hover:shadow-md border border-gray-300 hover:border-red-300`;
        case 'tardy':
          return `${baseClasses} bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-700 focus:ring-amber-300 hover:shadow-md border border-gray-300 hover:border-amber-300`;
        case 'excused':
          return `${baseClasses} bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 focus:ring-blue-300 hover:shadow-md border border-gray-300 hover:border-blue-300`;
        case 'other':
          return `${baseClasses} bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 focus:ring-orange-300 hover:shadow-md border border-gray-300 hover:border-orange-300`;
        default:
          return `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300 hover:shadow-md border border-gray-300`;
      }
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