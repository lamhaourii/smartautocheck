'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Car, FileText, CheckCircle, LogOut, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function InspectorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [completed, setCompleted] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'inspector') {
      router.push('/dashboard')
      return
    }
    
    setUser(parsedUser)
    fetchInspectorData()
  }, [])

  const fetchInspectorData = async () => {
    try {
      const response = await api.get('/inspections/assigned')
      const inspections = response.data.data || []
      
      setAssignments(inspections.filter((i: any) => i.status === 'pending' || i.status === 'in_progress'))
      setCompleted(inspections.filter((i: any) => i.status === 'completed'))
    } catch (error) {
      console.error('Error fetching inspector data:', error)
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
              <span className="text-xl font-bold text-slate-900">SmartAutoCheck Inspector</span>
            </Link>
            <div className="flex items-center gap-4">
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Inspector Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.name}!</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-violet-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-violet-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{assignments.length}</span>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Pending Inspections</h3>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{completed.length}</span>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Completed Today</h3>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-sky-100 rounded-lg">
                  <FileText className="h-6 w-6 text-sky-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{completed.length}</span>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Total Completed</h3>
            </div>
          </div>

          {/* Assignments */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Today's Inspections</h2>
            
            {assignments.length === 0 ? (
              <div className="card p-12 text-center">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending inspections</h3>
                <p className="text-slate-600">You're all caught up! Check back later for new assignments.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {assignments.map((inspection) => (
                  <div key={inspection.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          Inspection #{inspection.id?.slice(0, 8)}
                        </h3>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(inspection.scheduledDate).toLocaleDateString()}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(inspection.scheduledDate).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {inspection.vehicleInfo?.registrationNumber}
                          </p>
                        </div>
                      </div>
                      <span className="badge badge-primary">Pending</span>
                    </div>
                    <button className="btn-primary w-full">
                      <Eye className="h-4 w-4" />
                      Start Inspection
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Completions */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Recently Completed</h2>
            
            {completed.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No completed inspections</h3>
                <p className="text-slate-600">Completed inspections will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completed.map((inspection) => (
                  <div key={inspection.id} className="card p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Inspection #{inspection.id?.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Completed: {new Date(inspection.completedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        Vehicle: {inspection.vehicleInfo?.registrationNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge badge-success">Completed</span>
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
        </div>
      </div>
    </div>
  )
}
