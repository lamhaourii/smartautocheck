'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Car, Upload, Check, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [formData, setFormData] = useState({
    serviceType: '',
    date: '',
    time: '',
    vehicleReg: '',
    make: '',
    model: '',
    year: '',
    document: null as File | null
  })

  const steps = [
    { num: 1, title: 'Service', icon: Car },
    { num: 2, title: 'Schedule', icon: Calendar },
    { num: 3, title: 'Vehicle Info', icon: Car },
    { num: 4, title: 'Documents', icon: Upload },
    { num: 5, title: 'Payment', icon: CreditCard }
  ]

  const services = [
    { id: 'standard', name: 'Standard Inspection', price: 50, duration: '30 min' },
    { id: 'premium', name: 'Premium Inspection', price: 80, duration: '45 min' },
    { id: 'express', name: 'Express Inspection', price: 100, duration: '20 min' }
  ]

  const timeSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM',
    '10:30 AM', '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
    '04:30 PM', '05:00 PM', '05:30 PM'
  ]

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    // Move to payment step
    setStep(5)
  }

  // Load PayPal SDK
  useEffect(() => {
    if (step === 5 && !paypalLoaded) {
      const script = document.createElement('script')
      script.src = 'https://www.paypal.com/sdk/js?client-id=AeFunx4cWx2zm6aqtLmd7Zm4G4zGZ2BVLsRh83jGxqOPzPss6fMS2PRilid05SAUTipnYNPo_NghJrDX&currency=USD'
      script.addEventListener('load', () => {
        setPaypalLoaded(true)
        renderPayPalButton()
      })
      document.body.appendChild(script)
    }
  }, [step])

  const getServicePrice = () => {
    const service = services.find(s => s.id === formData.serviceType)
    return service ? service.price : 50
  }

  const renderPayPalButton = () => {
    const amount = getServicePrice()
    
    if (typeof window !== 'undefined' && (window as any).paypal) {
      (window as any).paypal.Buttons({
        createOrder: async () => {
          try {
            const response = await fetch('http://localhost:3003/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount, currency: 'USD' })
            })
            const data = await response.json()
            return data.data.orderId
          } catch (error) {
            console.error('Error creating order:', error)
            alert('Error creating payment order. Please try again.')
          }
        },
        onApprove: async (data: any) => {
          try {
            // Here you would normally:
            // 1. Create user account if needed
            // 2. Create appointment
            // 3. Process payment with orderId
            
            alert(`Payment approved! Order ID: ${data.orderID}\n\nIn production, this would:\n1. Create your appointment\n2. Process payment\n3. Send confirmation email\n4. Redirect to dashboard`)
            
            // Redirect to home
            window.location.href = '/'
          } catch (error) {
            console.error('Error processing payment:', error)
            alert('Payment approved but error saving booking. Please contact support with Order ID: ' + data.orderID)
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err)
          alert('Payment failed. Please try again.')
        },
        onCancel: () => {
          alert('Payment cancelled. You can try again when ready.')
        }
      }).render('#paypal-button-container')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold text-primary-600">SmartAutoCheck</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    step >= s.num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? <Check className="h-6 w-6" /> : <s.icon className="h-6 w-6" />}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${step >= s.num ? 'text-primary-600' : 'text-gray-500'}`}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 rounded transition-all ${
                    step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card"
        >
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Select Your Service</h2>
              <div className="grid gap-4">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setFormData({ ...formData, serviceType: service.id })}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      formData.serviceType === service.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-gray-600 mt-1">Duration: {service.duration}</p>
                      </div>
                      <div className="text-3xl font-bold text-primary-600">${service.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Choose Date & Time</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setFormData({ ...formData, time })}
                      className={`py-3 px-4 border-2 rounded-lg font-medium transition-all ${
                        formData.time === time
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Information */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Vehicle Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                  <input
                    type="text"
                    placeholder="ABC-123-XYZ"
                    value={formData.vehicleReg}
                    onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                    <input
                      type="text"
                      placeholder="Toyota"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                    <input
                      type="text"
                      placeholder="Camry"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                  <input
                    type="number"
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Document Upload */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Upload Documents</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-500 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Vehicle Registration (Carte Grise)
                </h3>
                <p className="text-gray-600 mb-4">
                  PNG, JPG or PDF up to 10MB
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({ ...formData, document: e.target.files?.[0] || null })}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-block">
                  Choose File
                </label>
                {formData.document && (
                  <p className="mt-4 text-sm text-green-600 flex items-center justify-center">
                    <Check className="h-4 w-4 mr-2" />
                    {formData.document.name}
                  </p>
                )}
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    We'll process your document using OCR
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    You'll receive a confirmation email
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    Payment will be processed securely
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {step === 5 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Complete Payment</h2>
              
              <div className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-semibold">
                      {services.find(s => s.id === formData.serviceType)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span className="font-semibold">{formData.date} at {formData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <span className="font-semibold">
                      {formData.make} {formData.model} ({formData.year})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registration:</span>
                    <span className="font-semibold">{formData.vehicleReg}</span>
                  </div>
                  <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between text-xl">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-primary-600">
                      ${getServicePrice()}.00 USD
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <p className="text-gray-600 mb-4">
                  Pay securely with PayPal. You can use your PayPal balance, bank account, or credit/debit card.
                </p>
              </div>

              {/* PayPal Button Container */}
              <div id="paypal-button-container" className="mb-6 max-w-md mx-auto"></div>

              {!paypalLoaded && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="text-gray-600 mt-4">Loading payment options...</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  🔒 Your payment information is processed securely by PayPal. 
                  We never store your payment details.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`btn-secondary inline-flex items-center ${
              step === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.serviceType) ||
                (step === 2 && (!formData.date || !formData.time)) ||
                (step === 3 && (!formData.vehicleReg || !formData.make || !formData.model || !formData.year))
              }
              className="btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          ) : step === 4 ? (
            <button
              onClick={handleSubmit}
              className="btn-primary inline-flex items-center"
            >
              Proceed to Payment
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
