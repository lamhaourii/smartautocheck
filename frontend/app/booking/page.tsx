'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Car, Upload, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/toast'

export default function BookingPage() {
  const router = useRouter()
  const { toasts, removeToast, success, error: showError, warning } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [formData, setFormData] = useState({
    serviceType: 'standard',
    date: '',
    time: '',
    vehicleReg: '',
    make: '',
    model: '',
    year: '',
    notes: ''
  })

  const services = [
    { id: 'standard', name: 'Standard Inspection', price: 45, duration: '30 min', features: ['Basic safety check', 'Digital certificate', 'Same-day results'] },
    { id: 'complete', name: 'Complete Inspection', price: 75, duration: '45 min', features: ['Full diagnostic', 'Detailed report', 'Priority support', '6-month warranty'] },
    { id: 'premium', name: 'Premium Inspection', price: 120, duration: '60 min', features: ['Everything in Complete', 'Video tour', 'Pickup & delivery'] }
  ]

  useEffect(() => {
    if (step === 2 && formData.date) {
      fetchAvailableSlots()
    }
  }, [formData.date, step])

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const response = await api.get(`/appointments/available?date=${formData.date}`)
      setAvailableSlots(response.data.slots || [])
      if (response.data.slots && response.data.slots.length === 0) {
        warning('No available slots for this date. Please select another date.')
      }
    } catch (err) {
      console.error('Error fetching slots:', err)
      setAvailableSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'])
      warning('Could not load available slots. Showing default times.')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleNext = () => {
    setError('')
    
    if (step === 1 && !formData.serviceType) {
      setError('Please select a service')
      showError('Please select a service to continue')
      return
    }
    if (step === 2 && (!formData.date || !formData.time)) {
      setError('Please select date and time')
      showError('Please select both date and time to continue')
      return
    }
    if (step === 3 && (!formData.vehicleReg || !formData.make || !formData.model || !formData.year)) {
      setError('Please fill in all vehicle details')
      showError('Please complete all required vehicle information')
      return
    }
    
    if (step < 4) {
      setStep(step + 1)
      success('Step completed!')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const appointmentData = {
        serviceType: formData.serviceType,
        scheduledDate: `${formData.date}T${formData.time}:00`,
        vehicleInfo: {
          registrationNumber: formData.vehicleReg,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year)
        },
        notes: formData.notes
      }

      const response = await api.post('/appointments', appointmentData)
      
      success('Booking created successfully!')
      setTimeout(() => {
        router.push(`/dashboard?booking=success&id=${response.data.data.id}`)
      }, 1000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create booking. Please try again.'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.serviceType)

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16 px-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-sky-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">SmartAutoCheck</span>
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium">
              Cancel
            </Link>
          </div>
        </div>
      </nav>

      {/* Progress Steps */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="container-custom px-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, title: 'Service' },
              { num: 2, title: 'Schedule' },
              { num: 3, title: 'Vehicle' },
              { num: 4, title: 'Confirm' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.num ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    step >= s.num ? 'text-slate-900' : 'text-slate-500'
                  }`}>{s.title}</span>
                </div>
                {idx < 3 && (
                  <div className={`h-0.5 flex-1 -mt-8 ${
                    step > s.num ? 'bg-sky-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-4">
        <div className="container-custom max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose Your Service</h2>
              <p className="text-slate-600 mb-8">Select the inspection package that fits your needs</p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setFormData({ ...formData, serviceType: service.id })}
                    className={`card p-6 text-left transition-all ${
                      formData.serviceType === service.id
                        ? 'ring-2 ring-sky-600 border-sky-600'
                        : 'hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-900">{service.name}</h3>
                      {formData.serviceType === service.id && (
                        <CheckCircle className="h-6 w-6 text-sky-600" />
                      )}
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">€{service.price}</div>
                    <div className="text-sm text-slate-600 mb-4">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {service.duration}
                    </div>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Pick a Time</h2>
              <p className="text-slate-600 mb-8">Choose your preferred date and time slot</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>
                
                {formData.date && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Available Time Slots
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-600 border-t-transparent" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-slate-600 py-4">No slots available for this date</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setFormData({ ...formData, time: slot })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                              formData.time === slot
                                ? 'bg-sky-600 text-white shadow-md'
                                : 'bg-white border border-slate-300 text-slate-700 hover:border-sky-600'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Information */}
          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Vehicle Details</h2>
              <p className="text-slate-600 mb-8">Tell us about your vehicle</p>
              
              <div className="card p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleReg}
                      onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase() })}
                      placeholder="ABC-1234"
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Make *
                    </label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      placeholder="Toyota"
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Camry"
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="input-field"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any specific concerns or requirements..."
                      rows={4}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && selectedService && (
            <div className="animate-slide-up">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Review Your Booking</h2>
              <p className="text-slate-600 mb-8">Please confirm all details are correct</p>
              
              <div className="card p-8 mb-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Service</h3>
                    <p className="text-lg font-semibold text-slate-900">{selectedService.name}</p>
                    <p className="text-2xl font-bold text-sky-600">€{selectedService.price}</p>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Appointment</h3>
                    <p className="text-lg text-slate-900">
                      {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-lg text-slate-900">at {formData.time}</p>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Vehicle</h3>
                    <p className="text-lg text-slate-900">
                      {formData.vehicleReg} - {formData.year} {formData.make} {formData.model}
                    </p>
                  </div>

                  {formData.notes && (
                    <div className="border-t border-slate-200 pt-6">
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Notes</h3>
                      <p className="text-slate-700">{formData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <p className="text-sm text-sky-900">
                  <strong>Note:</strong> You'll receive a confirmation email with your appointment details. Payment will be processed after the inspection is complete.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
            )}
            
            <div className="ml-auto">
              {step < 4 ? (
                <button onClick={handleNext} className="btn-primary">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Confirm Booking
                      <CheckCircle className="h-5 w-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
