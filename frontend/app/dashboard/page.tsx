'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Car, FileText, Download, Eye, LogOut, User, Bell, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    setUser(JSON.parse(userData))
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, certificatesRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/certificates')
      ])
      
      setAppointments(appointmentsRes.data.data || [])
      setCertificates(certificatesRes.data.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'badge-success'
      case 'scheduled': return 'badge-primary'
      case 'cancelled': return 'badge-error'
      case 'pending': return 'badge-warning'
      default: return 'badge-neutral'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16 px-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-sky-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">SmartAutoCheck</span>
            </Link>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-slate-600" />
              </button>
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-8 px-4">
        <div className="container-custom max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-slate-600">Manage your vehicle inspections and certificates</p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-sky-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-sky-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{appointments.length}</span>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Total Appointments</h3>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{certificates.length}</span>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Certificates</h3>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-violet-100 rounded-lg">
                  <Clock className="h-6 w-6 text-violet-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {appointments.filter(a => a.status === 'scheduled').length}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Upcoming</h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Appointments */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">My Appointments</h2>
                  <Link href="/booking" className="btn-primary btn-small">
                    Book New
                  </Link>
                </div>

                {appointments.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No appointments yet</h3>
                    <p className="text-slate-600 mb-6">Book your first vehicle inspection to get started</p>
                    <Link href="/booking" className="btn-primary">
                      Book Inspection
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="card p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {appointment.serviceType || 'Standard Inspection'}
                              </h3>
                              <span className={`badge ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-slate-600">
                              <p className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {new Date(appointment.scheduledDate).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {appointment.vehicleInfo && (
                                <p className="flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  {appointment.vehicleInfo.registrationNumber} - {appointment.vehicleInfo.make} {appointment.vehicleInfo.model}
                                </p>
                              )}
                            </div>
                          </div>
                          <button className="btn-ghost btn-small">
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificates */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">My Certificates</h2>
                
                {certificates.length === 0 ? (
                  <div className="card p-12 text-center">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No certificates yet</h3>
                    <p className="text-slate-600">Certificates will appear here after your inspections are complete</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="card p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-100 rounded-lg">
                            <FileText className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{cert.certificateNumber}</h3>
                            <p className="text-sm text-slate-600">
                              Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-slate-600">
                              Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-ghost btn-small">
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button className="btn-primary btn-small">
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Profile</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-medium text-slate-900">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-medium text-slate-900">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <button className="btn-outline w-full mt-4">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>

              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/booking" className="btn-outline w-full justify-start">
                    <Calendar className="h-4 w-4" />
                    Book Inspection
                  </Link>
                  <button className="btn-outline w-full justify-start">
                    <FileText className="h-4 w-4" />
                    View Certificates
                  </button>
                  <button className="btn-outline w-full justify-start">
                    <User className="h-4 w-4" />
                    Update Profile
                  </button>
                </div>
              </div>

              {/* Help */}
              <div className="card p-6 bg-sky-50 border-sky-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Need Help?</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Our support team is here to assist you with any questions.
                </p>
                <button className="btn-primary w-full">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
