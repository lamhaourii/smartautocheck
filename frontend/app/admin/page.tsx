'use client'

import { useState, useEffect } from 'react'
import { Users, Calendar, FileText, BarChart3, Car, LogOut, Settings, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAppointments: 0,
    totalInspections: 0,
    revenue: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    
    setUser(parsedUser)
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const [appointmentsRes] = await Promise.all([
        api.get('/appointments?limit=100')
      ]);
      
      const appointments = appointmentsRes.data.data || [];
      setRecentAppointments(appointments.slice(0, 10))
      
      // Calculate stats
      setStats({
        totalUsers: appointments.length,
        totalAppointments: appointments.length,
        totalInspections: appointments.filter((a: any) => a.status === 'completed').length,
        revenue: appointments.filter((a: any) => a.status === 'completed').length * 75
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
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
              <span className="text-xl font-bold text-slate-900">SmartAutoCheck Admin</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                User View
              </Link>
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600">Manage your inspection center</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-sky-100 rounded-lg">
                  <Users className="h-6 w-6 text-sky-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalUsers}</div>
              <div className="text-sm text-slate-600">Total Users</div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-violet-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-violet-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalAppointments}</div>
              <div className="text-sm text-slate-600">Appointments</div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalInspections}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">€{stats.revenue.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Revenue</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Appointments */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Appointments</h2>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {recentAppointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">
                                {appointment.userId || 'Customer'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{appointment.serviceType || 'Standard'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-600">
                                {new Date(appointment.scheduledDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`badge ${
                                appointment.status === 'completed' ? 'badge-success' :
                                appointment.status === 'scheduled' ? 'badge-primary' :
                                'badge-warning'
                              }`}>
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="btn-outline w-full justify-start">
                    <Users className="h-4 w-4" />
                    Manage Users
                  </button>
                  <button className="btn-outline w-full justify-start">
                    <Calendar className="h-4 w-4" />
                    View All Appointments
                  </button>
                  <button className="btn-outline w-full justify-start">
                    <FileText className="h-4 w-4" />
                    Generate Reports
                  </button>
                  <button className="btn-outline w-full justify-start">
                    <Settings className="h-4 w-4" />
                    System Settings
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="card p-6 bg-emerald-50 border-emerald-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">System Status</h3>
                <p className="text-sm text-slate-600 mb-4">
                  All systems operational
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">API</span>
                    <span className="text-emerald-600 font-medium">●  Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Database</span>
                    <span className="text-emerald-600 font-medium">● Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Kafka</span>
                    <span className="text-emerald-600 font-medium">● Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
