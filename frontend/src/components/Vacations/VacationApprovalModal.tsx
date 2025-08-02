import React, { useState } from 'react';
import type { VacationRequest } from '../../lib/api';
import { vacationApi } from '../../lib/api';
import { X, CheckCircle, XCircle, Calendar, User } from 'lucide-react';

interface VacationApprovalModalProps {
  request: VacationRequest;
  onClose: () => void;
  onSave: () => void;
}

export default function VacationApprovalModal({ request, onClose, onSave }: VacationApprovalModalProps) {
  const [status, setStatus] = useState<'approved' | 'denied'>('approved');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (selectedStatus: 'approved' | 'denied') => {
    setError('');
    setLoading(true);

    try {
      await vacationApi.updateStatus(request.id, {
        status: selectedStatus,
        notes: notes.trim() || undefined
      });
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update vacation request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Review Vacation Request
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Request Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">
                {request.first_name} {request.last_name}
              </span>
              {request.department && (
                <span className="text-sm text-gray-500">• {request.department}</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div className="text-sm text-gray-700">
                <div>{formatDate(request.start_date)}</div>
                <div>to {formatDate(request.end_date)}</div>
                <div className="font-medium mt-1">
                  {request.days_requested} {request.days_requested === 1 ? 'day' : 'days'} • {request.type}
                </div>
              </div>
            </div>

            {request.reason && (
              <div>
                <div className="text-sm font-medium text-gray-700">Reason:</div>
                <div className="text-sm text-gray-600 mt-1">{request.reason}</div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Submitted on {formatDate(request.created_at)}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Add any comments about this decision..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            <button
              onClick={() => handleSubmit('denied')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Deny
            </button>
            
            <button
              onClick={() => handleSubmit('approved')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}