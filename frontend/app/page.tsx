'use client'

import { CheckCircle, Clock, Shield, Car, ArrowRight, Calendar, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { StatsSkeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  const [availableSlots, setAvailableSlots] = useState<number>(12)
  const [stats, setStats] = useState({ inspections: 0, customers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAvailableSlots(), fetchStats()])
      .finally(() => setLoading(false))
  }, [])

  const fetchAvailableSlots = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`http://localhost:3000/appointments/available?date=${today}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots?.length || 12)
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full glass z-50 border-b border-slate-200">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16 px-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-sky-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">SmartAutoCheck</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#services" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Services</Link>
              <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">How It Works</Link>
              <Link href="/auth/login" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Login</Link>
              <Link href="/booking" className="btn-primary">Book Inspection</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-full text-sky-700 text-sm font-medium mb-6">
              <CheckCircle className="h-4 w-4" />
              <span>Trusted by 10,000+ drivers</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Vehicle Inspection
              <span className="block text-sky-600">Made Simple</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Book your vehicle inspection online in minutes. Professional service, instant digital certificate, and zero hassle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/booking" className="btn-primary btn-large">
                Book Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/auth/login" className="btn-secondary btn-large">
                Sign In
              </Link>
            </div>

            {/* Stats */}
            {loading ? (
              <StatsSkeleton />
            ) : (
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in">
                <div className="text-center group cursor-default">
                  <div className="text-3xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{availableSlots}</div>
                  <div className="text-sm text-slate-600 mt-1">Slots Available Today</div>
                </div>
                <div className="text-center group cursor-default">
                  <div className="text-3xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">30min</div>
                  <div className="text-sm text-slate-600 mt-1">Average Time</div>
                </div>
                <div className="text-center group cursor-default">
                  <div className="text-3xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">4.9★</div>
                  <div className="text-sm text-slate-600 mt-1">Customer Rating</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-slate-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-title">Why Choose Us</h2>
            <p className="section-subtitle mx-auto">Fast, reliable, and hassle-free vehicle inspections</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-lg mb-6">
                <Clock className="h-8 w-8 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Quick & Easy</h3>
              <p className="text-slate-600">Book online in under 2 minutes. Get inspected in 30 minutes or less.</p>
            </div>

            <div className="card p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-lg mb-6">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Certified Inspectors</h3>
              <p className="text-slate-600">All our inspectors are ISO certified and highly experienced.</p>
            </div>

            <div className="card p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-lg mb-6">
                <CheckCircle className="h-8 w-8 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Digital Certificate</h3>
              <p className="text-slate-600">Receive your certificate instantly via email. No waiting, no paperwork.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle mx-auto">Three simple steps to get your vehicle certified</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Book Online', desc: 'Choose your preferred date, time, and location. Upload your vehicle documents.' },
              { step: '2', title: 'Get Inspected', desc: 'Visit our center at your scheduled time. Our certified inspectors handle the rest.' },
              { step: '3', title: 'Receive Certificate', desc: 'Get your digital certificate instantly via email. Download or print anytime.' }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="card p-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-100 rounded-lg text-sky-600 font-bold text-xl mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="services" className="section bg-slate-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-title">Simple Pricing</h2>
            <p className="section-subtitle mx-auto">Transparent pricing with no hidden fees</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Standard', price: '€45', features: ['Basic safety inspection', 'Digital certificate', 'Same-day results'] },
              { name: 'Complete', price: '€75', features: ['Full diagnostic check', 'Detailed PDF report', 'Priority support', '6-month warranty'], popular: true },
              { name: 'Premium', price: '€120', features: ['Everything in Complete', 'Video inspection tour', 'Free pickup & delivery'] }
            ].map((plan) => (
              <div key={plan.name} className={`card p-8 ${plan.popular ? 'ring-2 ring-sky-600' : ''} relative`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-primary px-4 py-1">Most Popular</span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-slate-900 mb-1">{plan.price}</div>
                  <div className="text-sm text-slate-600">per inspection</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-600">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/booking" 
                  className={`btn-${plan.popular ? 'primary' : 'secondary'} w-full justify-center`}
                >
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-sky-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto">
            Book your vehicle inspection today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="inline-flex items-center justify-center gap-2 bg-white text-sky-600 hover:bg-slate-50 font-medium px-8 py-3.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
              Book Inspection
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 text-white font-medium px-8 py-3.5 rounded-lg transition-all duration-200">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-sky-600 p-2 rounded-lg">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">SmartAutoCheck</span>
              </div>
              <p className="text-slate-400 text-sm">Professional vehicle inspection services made simple and accessible.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/booking" className="hover:text-white transition-colors">Book Inspection</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="#services" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>© 2024 SmartAutoCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
