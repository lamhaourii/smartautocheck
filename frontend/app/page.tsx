'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock, Shield, Zap, ArrowRight, Calendar, Sparkles, Heart, Users, Star, MapPin, Car } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [availableSlots, setAvailableSlots] = useState<number>(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    
    // Fetch available slots from backend
    fetchAvailableSlots()
    
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const fetchAvailableSlots = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`http://localhost:80/api/appointments/available?date=${today}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots?.length || 8)
      } else {
        setAvailableSlots(8) // fallback
      }
    } catch (error) {
      setAvailableSlots(8) // fallback
    }
  }

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Get your vehicle inspected in just 30 minutes', color: 'from-yellow-400 to-orange-500' },
    { icon: Shield, title: 'Safe & Secure', desc: 'ISO certified inspectors you can trust', color: 'from-blue-400 to-blue-600' },
    { icon: Heart, title: 'Customer First', desc: 'We genuinely care about your experience', color: 'from-pink-400 to-rose-500' },
    { icon: Sparkles, title: 'Smart Tech', desc: 'AI-powered inspections with instant results', color: 'from-purple-400 to-indigo-500' }
  ]

  const services = [
    { name: 'Quick Check', price: '€45', duration: '20 min', emoji: '⚡', features: ['Basic safety inspection', 'Digital certificate', 'Same-day results'] },
    { name: 'Complete Care', price: '€75', duration: '40 min', emoji: '✨', features: ['Full diagnostic check', 'Detailed PDF report', 'Priority support', '6-month warranty'], popular: true },
    { name: 'Premium Plus', price: '€120', duration: '60 min', emoji: '👑', features: ['Everything in Complete', 'Video inspection tour', 'Free pickup & drop', 'VIP lounge access'] }
  ]

  const testimonials = [
    { name: 'Sarah M.', role: 'Teacher', text: 'The whole process was so smooth! I booked online, dropped off my car, and got my certificate in 30 minutes. Amazing!', avatar: '👩‍🏫', rating: 5 },
    { name: 'James K.', role: 'Engineer', text: 'Finally, a car inspection service that doesn\'t waste your time. The digital certificate arrived instantly!', avatar: '👨‍💻', rating: 5 },
    { name: 'Maria L.', role: 'Business Owner', text: 'I love how transparent everything is. The detailed report helped me understand my car better.', avatar: '👩‍💼', rating: 5 }
  ]

  return (
    <div className="min-h-screen mesh-gradient relative overflow-hidden">
      {/* Cursor glow effect */}
      <div 
        className="pointer-events-none fixed w-96 h-96 rounded-full opacity-20 blur-3xl bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-xl bg-white/70 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-2xl">
                <Car className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SmartAutoCheck
              </span>
            </motion.div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="text-gray-700 hover:text-blue-600 transition font-semibold">Services</Link>
              <Link href="#testimonials" className="text-gray-700 hover:text-blue-600 transition font-semibold">Reviews</Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition font-semibold">My Dashboard</Link>
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition text-sm">Admin</Link>
              <Link href="/booking" className="btn-primary">
                Book Now 🚗
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-6"
              >
                <span className="badge bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  ✨ Trusted by 50,000+ drivers
                </span>
              </motion.div>
              
              <h1 className="text-6xl lg:text-7xl font-black leading-tight mb-6">
                Your Car Deserves
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  Better Care
                </span>
              </h1>
              
              <p className="text-2xl text-gray-700 mb-8 font-medium leading-relaxed">
                No more waiting in line. No more paperwork. Just book online, show up, and drive away with your digital certificate. 
                <span className="text-blue-600"> It's really that simple.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/booking" className="btn-primary inline-flex items-center justify-center text-lg group">
                  Book Your Inspection
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#services" className="btn-secondary inline-flex items-center justify-center text-lg">
                  See Pricing
                </Link>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl"
                >
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{availableSlots}</div>
                  <div className="text-sm text-gray-600 font-semibold mt-1">Slots Today</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl"
                >
                  <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">30min</div>
                  <div className="text-sm text-gray-600 font-semibold mt-1">Avg. Time</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl"
                >
                  <div className="text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">4.9★</div>
                  <div className="text-sm text-gray-600 font-semibold mt-1">Rating</div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="card-gradient p-12 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <div className="text-6xl mb-4">🚗</div>
                    <h3 className="text-3xl font-black mb-2">Ready to Roll?</h3>
                    <p className="text-white/90 text-lg mb-6">
                      Book your spot now and get inspected today!
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      <Clock className="h-6 w-6" />
                      <span className="text-lg font-bold">Next slot: 2:30 PM</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <MapPin className="h-6 w-6" />
                      <span className="text-lg font-bold">3 centers near you</span>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-2xl p-4 border-2 border-blue-200"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">ISO Certified</div>
                      <div className="text-xs text-gray-600">100% Trusted</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-2xl p-4"
                >
                  <div className="flex items-center space-x-2 text-white">
                    <Star className="h-6 w-6" />
                    <div>
                      <div className="text-sm font-bold">4.9/5 Stars</div>
                      <div className="text-xs opacity-90">2,847 reviews</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="section-title">
              We're Not Just Any Inspection Service
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
              We built something <span className="font-bold text-blue-600">actually good</span>. 
              Here's why thousands of drivers trust us with their cars.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="group"
              >
                <div className="card text-center hover:shadow-3xl cursor-pointer">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl mb-6 shadow-lg`}
                  >
                    <feature.icon className="h-10 w-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-lg">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to get certified</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Book Online', desc: 'Choose your date and time. Upload vehicle documents.' },
              { step: '02', title: 'Get Inspected', desc: 'Visit our center. Professional inspection in 30 minutes.' },
              { step: '03', title: 'Receive Certificate', desc: 'Digital certificate delivered instantly to your email.' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div className="card">
                  <div className="text-6xl font-bold text-primary-100 mb-4">{item.step}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary-300"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="services" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="section-title">
              Pick Your Perfect Plan
            </h2>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees. No surprises. Just honest pricing for quality service. 💙
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                {service.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="badge bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg animate-pulse-glow">
                      🌟 Most Popular
                    </span>
                  </div>
                )}
                <div className={`card ${service.popular ? 'ring-4 ring-blue-500' : ''}`}>
                  <div className="text-center">
                    <div className="text-6xl mb-4">{service.emoji}</div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3">{service.name}</h3>
                    <div className="mb-6">
                      <span className="text-6xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {service.price}
                      </span>
                      <span className="text-gray-600 text-lg block mt-2">⏱️ {service.duration}</span>
                    </div>
                    <ul className="space-y-4 mb-8 text-left">
                      {service.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start text-gray-700">
                          <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link 
                      href="/booking" 
                      className={service.popular ? 'btn-primary w-full block text-center' : 'btn-secondary w-full block text-center'}
                    >
                      Choose {service.name}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-gray-600 text-lg">
              💡 <span className="font-semibold">Need help choosing?</span> Our team is happy to guide you. 
              <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-bold ml-2">Contact Us →</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="section-title">
              Real People, Real Stories
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what actual customers say about their experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="card hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  <div className="text-5xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 animate-gradient"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block mb-6">
              <span className="badge bg-white/20 text-white backdrop-blur-sm">
                🎉 Limited Time Offer
              </span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Your Car. Your Time.<br />
              <span className="text-yellow-300">Your Way.</span>
            </h2>
            <p className="text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
              Stop wasting time in lines. Book your inspection now and get it done in 30 minutes. 
              Yes, <span className="font-black">really</span> 30 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking" className="inline-flex items-center justify-center bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-xl hover:bg-gray-50 transition shadow-2xl hover:scale-105 transform">
                Book Now - It's Fast! 🚀
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm border-2 border-white text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/20 transition">
                View My Dashboard
              </Link>
            </div>
            <p className="mt-8 text-white/70 text-sm">
              ⭐ Join 50,000+ happy drivers | 💳 No payment until inspection complete
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  SmartAutoCheck
                </span>
              </div>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                Making car inspections simple, fast, and actually enjoyable. Because your time matters.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                  <span className="text-xl">𝕏</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                  <span className="text-xl">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                  <span className="text-xl">in</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-black text-lg mb-4">Quick Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/booking" className="hover:text-white transition">📅 Book Now</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">👤 My Dashboard</Link></li>
                <li><Link href="#services" className="hover:text-white transition">💰 Pricing</Link></li>
                <li><Link href="/inspector/dashboard" className="hover:text-white transition">🔧 For Inspectors</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-lg mb-4">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition">❓ Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">✉️ Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">💬 FAQ</Link></li>
                <li><Link href="/admin" className="hover:text-white transition text-sm">⚙️ Admin Panel</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-lg mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2024 SmartAutoCheck. Built with 💙 for drivers who value their time.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0 text-gray-400 text-sm">
              <span>🔒 Secure & Encrypted</span>
              <span>✅ ISO Certified</span>
              <span>⚡ Lightning Fast</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
