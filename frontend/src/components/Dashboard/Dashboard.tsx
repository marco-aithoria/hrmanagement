import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Employee, VacationRequest, VacationStats } from '../../lib/api';
import { employeeApi, vacationApi } from '../../lib/api';
import { Users, Calendar, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  pendingVacations: number;
  approvedVacations: number;
  deniedVacations: number;
  totalDaysRequested: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingVacations: 0,
    approvedVacations: 0,
    deniedVacations: 0,
    totalDaysRequested: 0
  });
  const [recentVacationRequests, setRecentVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [employeesResponse, vacationRequests] = await Promise.all([
        employeeApi.getAll(),
        vacationApi.getRequests()
      ]);

      let vacationStats: VacationStats = {
        pending: 0,
        approved: 0,
        denied: 0,
        totalDaysRequested: 0
      };

      // If user is admin, get vacation stats
      if (user?.role === 'admin') {
        const statsResponse = await vacationApi.getStats();
        vacationStats = statsResponse.data;
      }

      setStats({
        totalEmployees: employeesResponse.data.length,
        pendingVacations: vacationStats.pending,
        approvedVacations: vacationStats.approved,
        deniedVacations: vacationStats.denied,
        totalDaysRequested: vacationStats.totalDaysRequested
      });

      // Get recent vacation requests (last 5)
      const sortedRequests = vacationRequests.data
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setRecentVacationRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'denied':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      gradient: 'bg-gradient-primary',
      visible: user?.role === 'admin'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingVacations,
      icon: Clock,
      gradient: 'bg-orange-500',
      visible: user?.role === 'admin'
    },
    {
      title: 'Approved Requests',
      value: stats.approvedVacations,
      icon: CheckCircle,
      gradient: 'bg-gradient-secondary',
      visible: true
    },
    {
      title: 'Total Days Requested',
      value: stats.totalDaysRequested,
      icon: TrendingUp,
      gradient: 'bg-navy-900',
      visible: user?.role === 'admin'
    }
  ].filter(card => card.visible);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of HR system activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${stat.gradient} p-4 rounded-xl shadow-lg`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 flex-1">
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Vacation Requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Vacation Requests</h2>
          <div className="h-1 w-20 bg-gradient-primary rounded-full"></div>
        </div>
        {recentVacationRequests.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No recent vacation requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentVacationRequests.map((request) => (
              <div key={request.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {request.first_name.charAt(0)}{request.last_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {request.first_name} {request.last_name}
                        </div>
                        {request.department && (
                          <div className="text-sm text-gray-600">
                            {request.department}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      <span className="font-medium">{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                      <span className="ml-2 text-gray-500">({request.days_requested} days)</span>
                    </div>
                    {request.reason && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        "{request.reason}"
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`badge ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => window.location.href = '/vacations'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4 text-left">
                <div className="font-medium text-gray-900">Request Vacation</div>
                <div className="text-sm text-gray-500">Submit a new vacation request</div>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/profile'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4 text-left">
                <div className="font-medium text-gray-900">View Profile</div>
                <div className="text-sm text-gray-500">Update your information</div>
              </div>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => window.location.href = '/employees'}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4 text-left">
                  <div className="font-medium text-gray-900">Manage Employees</div>
                  <div className="text-sm text-gray-500">Add or edit employee data</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}