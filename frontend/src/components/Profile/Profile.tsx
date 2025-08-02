import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Employee, VacationBalance } from '../../lib/api';
import { employeeApi, vacationApi } from '../../lib/api';
import { User, Mail, Phone, MapPin, Calendar, Building, Briefcase, Award } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (user?.id) {
        // Get all employees and find the current user's employee record
        const employeesResponse = await employeeApi.getAll();
        const currentEmployee = employeesResponse.data.find(emp => emp.user_id === user.id);
        
        if (currentEmployee) {
          setEmployee(currentEmployee);
        }

        // Get vacation balance
        const balanceResponse = await vacationApi.getBalance();
        setBalance(balanceResponse.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  };

  const calculateYearsOfService = (hireDate?: string) => {
    if (!hireDate) return 'N/A';
    const hire = new Date(hireDate);
    const now = new Date();
    const years = now.getFullYear() - hire.getFullYear();
    const months = now.getMonth() - hire.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < hire.getDate())) {
      return years - 1 + ' years';
    }
    return years + ' years';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">View your personal and employment information</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h3>
                <p className="text-sm text-gray-500">{employee?.position}</p>
                <p className="text-sm text-gray-500">{employee?.department}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 space-y-3">
              {employee?.hire_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{calculateYearsOfService(employee.hire_date)} of service</span>
                </div>
              )}
              {balance && (
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="h-4 w-4 mr-2" />
                  <span>{balance.remaining_days} vacation days remaining</span>
                </div>
              )}
            </div>
          </div>

          {/* Vacation Balance Card */}
          {balance && (
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vacation Balance</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Days</span>
                  <span className="text-sm font-medium">{balance.total_days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Used Days</span>
                  <span className="text-sm font-medium">{balance.used_days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remaining Days</span>
                  <span className="text-sm font-medium text-green-600">{balance.remaining_days}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(balance.used_days / balance.total_days) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{user?.email}</span>
                    </div>
                    {employee?.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 text-gray-900">{employee.phone}</span>
                      </div>
                    )}
                    {employee?.address && (
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-gray-600">Address:</span>
                          <div className="ml-2 text-gray-900">{employee.address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Employment Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Department:</span>
                      <span className="ml-2 text-gray-900">{employee?.department || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Position:</span>
                      <span className="ml-2 text-gray-900">{employee?.position || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Hire Date:</span>
                      <span className="ml-2 text-gray-900">{formatDate(employee?.hire_date)}</span>
                    </div>
                    {employee?.salary && user?.role === 'admin' && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600">Salary:</span>
                        <span className="ml-2 text-gray-900">{formatSalary(employee.salary)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Manager Information */}
              {employee?.manager_first_name && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Reporting Structure</h4>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-600">Reports to:</span>
                    <span className="ml-2 text-gray-900">
                      {employee.manager_first_name} {employee.manager_last_name}
                    </span>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Account Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee?.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee?.status || 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Member since:</span>
                    <span className="ml-2 text-gray-900">{formatDate(employee?.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}