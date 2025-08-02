import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { VacationRequest, VacationBalance } from '../../lib/api';
import { vacationApi } from '../../lib/api';
import { Plus, Calendar, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import VacationModal from './VacationModal';
import VacationApprovalModal from './VacationApprovalModal';

export default function Vacations() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsResponse, balanceResponse] = await Promise.all([
        vacationApi.getRequests(),
        vacationApi.getBalance()
      ]);
      
      setRequests(requestsResponse.data);
      setBalance(balanceResponse.data);
    } catch (error) {
      console.error('Error fetching vacation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'denied':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleCreateRequest = () => {
    setIsCreateModalOpen(true);
  };

  const handleApprovalAction = (request: VacationRequest) => {
    setSelectedRequest(request);
    setIsApprovalModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setIsApprovalModalOpen(false);
    setSelectedRequest(null);
  };

  const handleModalSave = () => {
    fetchData(); // Refresh data
    handleModalClose();
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacation Management</h1>
          <p className="text-gray-600">Manage vacation requests and balance</p>
        </div>
        <button
          onClick={handleCreateRequest}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Vacation
        </button>
      </div>

      {/* Vacation Balance */}
      {balance && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Vacation Balance</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{balance.total_days}</div>
              <div className="text-sm text-gray-500">Total Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{balance.used_days}</div>
              <div className="text-sm text-gray-500">Used Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{balance.remaining_days}</div>
              <div className="text-sm text-gray-500">Remaining Days</div>
            </div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(balance.used_days / balance.total_days) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
          <span className="text-sm text-gray-500">
            Showing {filteredRequests.length} of {requests.length} requests
          </span>
        </div>
      </div>

      {/* Vacation Requests */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {user?.role === 'admin' ? 'All Vacation Requests' : 'Your Vacation Requests'}
          </h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No vacation requests found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {user?.role === 'admin' && (
                        <span className="font-medium text-gray-900">
                          {request.first_name} {request.last_name}
                        </span>
                      )}
                      {request.department && (
                        <span className="text-sm text-gray-500">
                          {user?.role === 'admin' ? `• ${request.department}` : request.department}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {request.days_requested} {request.days_requested === 1 ? 'day' : 'days'}
                      </span>
                      <span className="text-sm text-gray-600 capitalize">
                        {request.type}
                      </span>
                    </div>
                    
                    {request.reason && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Reason:</strong> {request.reason}
                      </div>
                    )}
                    
                    {request.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Notes:</strong> {request.notes}
                      </div>
                    )}
                    
                    {request.approved_by_first_name && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Approved by:</strong> {request.approved_by_first_name} {request.approved_by_last_name}
                        {request.approved_at && (
                          <span className="ml-1">on {formatDate(request.approved_at)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                    </div>
                    
                    {user?.role === 'admin' && request.status === 'pending' && (
                      <button
                        onClick={() => handleApprovalAction(request)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Review
                      </button>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <VacationModal
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {isApprovalModalOpen && selectedRequest && (
        <VacationApprovalModal
          request={selectedRequest}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}