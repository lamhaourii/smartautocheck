'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, FileText, Download, Clock, CheckCircle, AlertCircle, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('appointments')

  const mockAppointments = [
    { id: '1', date: '2024-01-15', time: '10:00 AM', status: 'confirmed', vehicle: 'Toyota Camry 2020' },
    { id: '2', date: '2024-01-20', time: '02:30 PM', status: 'pending', vehicle: 'Honda Civic 2019' }
  ]

  const mockCertificates = [
    { id: '1', number: 'CERT-2024-001', issueDate: '2024-01-10', expiryDate: '2025-01-10', vehicle: 'Toyota Camry 2020' },
    { id: '2', number: 'CERT-2023-089', issueDate: '2023-12-15', expiryDate: '2024-12-15', vehicle: 'Honda Civic 2019' }
  ]

  const mockInvoices = [
    { id: '1', number: 'INV-202401-001', amount: 50, date: '2024-01-10', status: 'paid' },
    { id: '2', number: 'INV-202312-089', amount: 80, date: '2023-12-15', status: 'paid' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">SmartAutoCheck</Link>
          <Link href="/" className="text-gray-600 hover:text-primary-600 inline-flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Home
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, John!</h1>
          <p className="text-gray-600">Manage your inspections and certificates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900">2</p>
              </div>
              <Calendar className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certificates</p>
                <p className="text-3xl font-bold text-gray-900">5</p>
              </div>
              <FileText className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
              </div>
              <CheckCircle className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Next Inspection</p>
                <p className="text-lg font-bold text-gray-900">Jan 15</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['appointments', 'certificates', 'invoices'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          {activeTab === 'appointments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Appointments</h2>
                <Link href="/booking" className="btn-primary">
                  New Appointment
                </Link>
              </div>

              <div className="space-y-4">
                {mockAppointments.map(apt => (
                  <div key={apt.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">{apt.vehicle}</h3>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          {apt.date} at {apt.time}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          apt.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {apt.status === 'confirmed' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary text-sm py-2 px-4">Reschedule</button>
                        <button className="text-red-600 hover:text-red-700 text-sm py-2 px-4">Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Certificates</h2>
              <div className="space-y-4">
                {mockCertificates.map(cert => (
                  <div key={cert.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">{cert.vehicle}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Certificate: {cert.number}
                          </div>
                          <div>Issue Date: {cert.issueDate}</div>
                          <div>Expiry Date: {cert.expiryDate}</div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-2">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valid
                        </span>
                      </div>
                      <button className="btn-primary inline-flex items-center text-sm py-2 px-4">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Invoices</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Invoice Number</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.map(inv => (
                      <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{inv.number}</td>
                        <td className="py-4 px-4 text-gray-600">{inv.date}</td>
                        <td className="py-4 px-4 font-semibold text-gray-900">${inv.amount}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-primary-600 hover:text-primary-700 inline-flex items-center">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Chat Button */}
      <button className="fixed bottom-8 right-8 bg-primary-600 text-white p-4 rounded-full shadow-2xl hover:bg-primary-700 transition-all hover:scale-110">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  )
}
