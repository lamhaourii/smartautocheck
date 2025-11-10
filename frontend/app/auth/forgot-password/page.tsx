'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Car, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Link href="/auth/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card"
        >
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl">
              <Car className="h-10 w-10 text-white" />
            </div>
          </div>

          {!success ? (
            <>
              <h1 className="text-3xl font-black text-center text-gray-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-center text-gray-600 mb-8">
                No worries! Enter your email and we'll send you reset instructions.
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-4">
                Check Your Email!
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We've sent password reset instructions to <strong className="text-gray-900">{email}</strong>.
                <br />
                <br />
                Click the link in the email to reset your password. The link expires in 1 hour.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  try again
                </button>
              </p>
              <Link href="/auth/login" className="btn-secondary inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
