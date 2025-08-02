import axios from 'axios';

// Configure axios
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

// Employee types
export interface Employee {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  position?: string;
  hire_date?: string;
  phone?: string;
  address?: string;
  salary?: number;
  manager_id?: number;
  status: string;
  manager_first_name?: string;
  manager_last_name?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

// Vacation types
export interface VacationRequest {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  type: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  first_name: string;
  last_name: string;
  department?: string;
  approved_by_first_name?: string;
  approved_by_last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VacationBalance {
  id: number;
  employee_id: number;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
}

export interface VacationStats {
  pending: number;
  approved: number;
  denied: number;
  totalDaysRequested: number;
}

// Employee API
export const employeeApi = {
  getAll: () => axios.get<Employee[]>('/employees'),
  getById: (id: number) => axios.get<Employee>(`/employees/${id}`),
  create: (data: Partial<Employee>) => axios.post('/employees', data),
  update: (id: number, data: Partial<Employee>) => axios.put(`/employees/${id}`, data),
  delete: (id: number) => axios.delete(`/employees/${id}`)
};

// Vacation API
export const vacationApi = {
  getRequests: () => axios.get<VacationRequest[]>('/vacations'),
  getBalance: () => axios.get<VacationBalance>('/vacations/balance'),
  getStats: () => axios.get<VacationStats>('/vacations/stats'),
  createRequest: (data: {
    start_date: string;
    end_date: string;
    type?: string;
    reason?: string;
  }) => axios.post('/vacations', data),
  updateStatus: (id: number, data: {
    status: 'approved' | 'denied';
    notes?: string;
  }) => axios.put(`/vacations/${id}/status`, data)
};

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    axios.post('/auth/login', { email, password }),
  logout: () => axios.post('/auth/logout'),
  getMe: () => axios.get('/auth/me'),
  register: (data: { email: string; password: string; role?: string }) => 
    axios.post('/auth/register', data)
};