import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  User, 
  Building2,
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Vacations', href: '/vacations', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="w-64 bg-navy-900 shadow-xl border-r border-navy-800 h-screen">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-navy-800">
          <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold text-white">HR System</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-lg transform scale-105'
                    : 'text-blue-100 hover:bg-navy-800 hover:text-white hover:shadow-md'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info and logout */}
        <div className="px-4 py-4 border-t border-navy-800">
          <div className="flex items-center px-4 py-3 mb-3 bg-navy-800 rounded-xl">
            <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="font-semibold text-white text-sm">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-blue-200 text-xs">{user?.email}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-400 text-navy-900 capitalize mt-1">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-semibold text-blue-100 rounded-xl hover:bg-navy-800 hover:text-white transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}