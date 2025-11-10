'use client';

/**
 * Admin Monitoring Panel
 * 
 * Purpose: System health monitoring and control
 * 
 * Features:
 * - Real-time metrics dashboard
 * - Circuit breaker status and controls
 * - Service health checks
 * - Today's statistics
 * - Appointment management
 * - Rate limit monitoring
 * - Quick links to observability tools
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface SystemMetrics {
  circuitBreakers: Record<string, any>;
  services: Record<string, any>;
  rateLimits: Record<string, any>;
}

interface DailyStats {
  totalAppointments: number;
  completedInspections: number;
  pendingPayments: number;
  revenue: number;
  averageInspectionTime: number;
}

export default function AdminPanel() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchMetrics();
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCircuitBreakerControl = async (service: string, action: 'open' | 'close') => {
    try {
      const response = await fetch(`/api/admin/circuit-breakers/${service}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchMetrics(); // Refresh
        alert(`Circuit breaker ${action}ed for ${service}`);
      }
    } catch (error) {
      console.error('Failed to control circuit breaker:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              System monitoring and control panel
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</p>
            <button
              onClick={() => {
                fetchMetrics();
                fetchStats();
              }}
              className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedInspections}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payment</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue Today</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.revenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Time (min)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageInspectionTime}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Circuit Breakers */}
          {metrics?.circuitBreakers && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                Circuit Breakers
              </h2>
              <div className="space-y-4">
                {Object.entries(metrics.circuitBreakers).map(([service, data]: [string, any]) => (
                  <div key={service} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{service}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          data.state === 'CLOSED'
                            ? 'bg-green-100 text-green-800'
                            : data.state === 'OPEN'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {data.state}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                      <div>
                        <p className="text-xs">Success Rate</p>
                        <p className="font-medium text-gray-900">{data.health?.successRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs">Error Rate</p>
                        <p className="font-medium text-gray-900">{data.health?.errorRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs">Avg Latency</p>
                        <p className="font-medium text-gray-900">{data.stats?.latencyMean ? data.stats.latencyMean.toFixed(0) : 'N/A'}ms</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {data.state !== 'OPEN' && (
                        <button
                          onClick={() => handleCircuitBreakerControl(service, 'open')}
                          className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Open Circuit
                        </button>
                      )}
                      {data.state !== 'CLOSED' && (
                        <button
                          onClick={() => handleCircuitBreakerControl(service, 'close')}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Close Circuit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Health */}
          {metrics?.services && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" />
                Service Health
              </h2>
              <div className="space-y-3">
                {Object.entries(metrics.services).map(([service, data]: [string, any]) => (
                  <div key={service} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {data.healthy ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">{service}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {data.instances} {data.instances === 1 ? 'instance' : 'instances'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Observability Tools */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Observability Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="http://localhost:16686"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">Jaeger UI</p>
                <p className="text-sm text-gray-600">Distributed Tracing</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>

            <a
              href="http://localhost:8500"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">Consul UI</p>
                <p className="text-sm text-gray-600">Service Discovery</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>

            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">Kafka UI</p>
                <p className="text-sm text-gray-600">Event Streaming</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium">Architecture</p>
              <p>7 Microservices + 5 Infrastructure Components</p>
            </div>
            <div>
              <p className="font-medium">Patterns Implemented</p>
              <p>Circuit Breaker, Service Discovery, Distributed Tracing, Rate Limiting</p>
            </div>
            <div>
              <p className="font-medium">Scalability</p>
              <p>Horizontal scaling enabled via Consul & Nginx</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
