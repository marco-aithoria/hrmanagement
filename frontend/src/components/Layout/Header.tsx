import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-100">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {getGreeting()}, {user?.first_name || 'User'}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Welcome to your HR Management System
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-gray-600">
                {user?.department} • {user?.position}
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}