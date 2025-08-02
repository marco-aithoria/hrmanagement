import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Building2, User, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entraLoading, setEntraLoading] = useState(false);
  
  const { login, loginWithEntraId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEntraIdLogin = async () => {
    setError('');
    setEntraLoading(true);

    try {
      await loginWithEntraId();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEntraLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-secondary rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            HR Management System
          </h2>
          <p className="mt-2 text-lg text-blue-100">
            Welcome back! Please sign in to your account
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl p-8 border border-white/20">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Entra ID Login Button */}
          <div className="mb-6">
            <button
              onClick={handleEntraIdLogin}
              disabled={entraLoading || loading}
              className="w-full flex items-center justify-center px-4 py-4 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {entraLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  Signing in with Microsoft...
                </div>
              ) : (
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3" />
                  Sign in with Microsoft (Entra ID)
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Traditional Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-4 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter your email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-4 pr-12 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors hover:text-blue-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || entraLoading}
                className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in to your account'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Demo Credentials</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Email:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">admin@company.com</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Password:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">admin123</code>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Or use the Microsoft Entra ID button above for SSO authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}