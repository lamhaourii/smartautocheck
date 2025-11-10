'use client';

/**
 * Inspector Dashboard
 * 
 * Purpose: Real-time inspection workflow for inspectors
 * 
 * Features:
 * - Today's appointments list
 * - Digital inspection checklist (9 checkpoints)
 * - Photo upload for issues
 * - Real-time progress tracking
 * - Mark inspection complete
 * - WebSocket updates to customer
 * 
 * Checkpoints:
 * 1. Brakes
 * 2. Lights & Signals
 * 3. Tires & Wheels
 * 4. Engine & Transmission
 * 5. Suspension & Steering
 * 6. Exhaust System
 * 7. Body & Structure
 * 8. Interior & Safety Equipment
 * 9. Documents & Registration
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera, 
  FileText, 
  AlertCircle,
  Upload,
  Send,
} from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  vehicleReg: string;
  make: string;
  model: string;
  year: number;
  status: 'pending' | 'in_progress' | 'completed';
  checkedInAt?: string;
}

interface Checkpoint {
  id: string;
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  notes: string;
  photos: string[];
}

const CHECKPOINTS = [
  { id: 'brakes', name: 'Brakes', icon: '🛑' },
  { id: 'lights', name: 'Lights & Signals', icon: '💡' },
  { id: 'tires', name: 'Tires & Wheels', icon: '🛞' },
  { id: 'engine', name: 'Engine & Transmission', icon: '⚙️' },
  { id: 'suspension', name: 'Suspension & Steering', icon: '🔧' },
  { id: 'exhaust', name: 'Exhaust System', icon: '💨' },
  { id: 'body', name: 'Body & Structure', icon: '🚗' },
  { id: 'interior', name: 'Interior & Safety', icon: '🪑' },
  { id: 'documents', name: 'Documents & Registration', icon: '📄' },
];

export default function InspectorDashboard() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [checkpoints, setCheckpoints] = useState<Record<string, Checkpoint>>({});
  const [currentCheckpoint, setCurrentCheckpoint] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_INSPECTION_SERVICE_URL || 'http://localhost:3005', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to inspection service');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from inspection service');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  // Fetch today's appointments
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments/inspector/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  // Start inspection
  const startInspection = async (appointment: Appointment) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inspections/${appointment.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSelectedAppointment(appointment);
        
        // Initialize checkpoints
        const initialCheckpoints: Record<string, Checkpoint> = {};
        CHECKPOINTS.forEach(cp => {
          initialCheckpoints[cp.id] = {
            id: cp.id,
            name: cp.name,
            status: 'pending',
            notes: '',
            photos: [],
          };
        });
        setCheckpoints(initialCheckpoints);
        setCurrentCheckpoint(CHECKPOINTS[0].id);

        // Subscribe to real-time updates
        if (socket) {
          socket.emit('subscribe:appointment', appointment.id);
        }
      }
    } catch (error) {
      console.error('Failed to start inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Complete checkpoint
  const completeCheckpoint = async (checkpointId: string, status: 'pass' | 'fail' | 'warning') => {
    try {
      setLoading(true);

      // Upload photos if any
      const photoUrls: string[] = [];
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos', photo));

        const uploadResponse = await fetch('/api/inspections/upload-photos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoUrls.push(...uploadData.urls);
        }
      }

      // Mark checkpoint complete
      const response = await fetch(
        `/api/inspections/${selectedAppointment?.id}/checkpoints/${checkpointId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            notes,
            photos: photoUrls,
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setCheckpoints(prev => ({
          ...prev,
          [checkpointId]: {
            ...prev[checkpointId],
            status,
            notes,
            photos: photoUrls,
          },
        }));

        // Clear form
        setNotes('');
        setPhotos([]);

        // Move to next checkpoint
        const currentIndex = CHECKPOINTS.findIndex(cp => cp.id === checkpointId);
        if (currentIndex < CHECKPOINTS.length - 1) {
          setCurrentCheckpoint(CHECKPOINTS[currentIndex + 1].id);
        }

        // WebSocket broadcast handled by backend
      }
    } catch (error) {
      console.error('Failed to complete checkpoint:', error);
    } finally {
      setLoading(false);
    }
  };

  // Complete entire inspection
  const completeInspection = async () => {
    try {
      setLoading(true);

      // Calculate result (pass if all checkpoints pass or warning)
      const allCheckpoints = Object.values(checkpoints);
      const failedCheckpoints = allCheckpoints.filter(cp => cp.status === 'fail');
      const result = failedCheckpoints.length === 0 ? 'pass' : 'fail';

      const response = await fetch(`/api/inspections/${selectedAppointment?.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result,
          checkpoints: Object.values(checkpoints),
        }),
      });

      if (response.ok) {
        alert(`Inspection completed! Result: ${result.toUpperCase()}`);
        
        // Unsubscribe from updates
        if (socket) {
          socket.emit('unsubscribe:appointment', selectedAppointment?.id);
        }

        // Reset state
        setSelectedAppointment(null);
        setCheckpoints({});
        setCurrentCheckpoint(null);

        // Refresh appointments
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to complete inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  // Check if all checkpoints are completed
  const allCheckpointsCompleted = Object.values(checkpoints).every(
    cp => cp.status !== 'pending'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inspector Dashboard</h1>
          <p className="text-gray-600 mt-2">Today's appointments and inspection workflow</p>
        </div>

        {!selectedAppointment ? (
          /* Appointments List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.vehicleReg}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {appointment.make} {appointment.model} ({appointment.year})
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {appointment.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {appointment.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    {appointment.customerName}
                  </div>
                </div>

                {appointment.status === 'pending' && appointment.checkedInAt && (
                  <button
                    onClick={() => startInspection(appointment)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Start Inspection
                  </button>
                )}

                {!appointment.checkedInAt && (
                  <div className="text-center text-sm text-gray-500">
                    Waiting for customer check-in
                  </div>
                )}
              </div>
            ))}

            {appointments.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No appointments for today
              </div>
            )}
          </div>
        ) : (
          /* Inspection Workflow */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Checkpoint List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Inspection Checkpoints</h2>
              <div className="space-y-2">
                {CHECKPOINTS.map((checkpoint) => {
                  const status = checkpoints[checkpoint.id]?.status || 'pending';
                  return (
                    <button
                      key={checkpoint.id}
                      onClick={() => setCurrentCheckpoint(checkpoint.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        currentCheckpoint === checkpoint.id
                          ? 'bg-blue-50 border-2 border-blue-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center">
                        <span className="text-2xl mr-3">{checkpoint.icon}</span>
                        <span className="font-medium text-sm">{checkpoint.name}</span>
                      </span>
                      {status === 'pass' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {status === 'fail' && <XCircle className="w-5 h-5 text-red-600" />}
                      {status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                      {status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                    </button>
                  );
                })}
              </div>

              {allCheckpointsCompleted && (
                <button
                  onClick={completeInspection}
                  disabled={loading}
                  className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  Complete Inspection
                </button>
              )}
            </div>

            {/* Right: Current Checkpoint Form */}
            {currentCheckpoint && (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">
                    {CHECKPOINTS.find(cp => cp.id === currentCheckpoint)?.name}
                  </h2>
                  <p className="text-gray-600">
                    Vehicle: {selectedAppointment.vehicleReg} ({selectedAppointment.make} {selectedAppointment.model})
                  </p>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspector Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter observations, measurements, or issues..."
                  />
                </div>

                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Camera className="w-5 h-5" />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        multiple
                        className="hidden"
                      />
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="w-5 h-5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        multiple
                        className="hidden"
                      />
                    </label>
                  </div>
                  {photos.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {photos.length} photo(s) selected
                    </p>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => completeCheckpoint(currentCheckpoint, 'pass')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Pass
                  </button>
                  <button
                    onClick={() => completeCheckpoint(currentCheckpoint, 'warning')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Warning
                  </button>
                  <button
                    onClick={() => completeCheckpoint(currentCheckpoint, 'fail')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Fail
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
