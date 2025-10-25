'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock, Shield, Star, ArrowRight, Calendar, FileText, Award } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const features = [
    { icon: Calendar, title: 'Easy Booking', desc: 'Book online in 60 seconds' },
    { icon: Clock, title: 'Fast Service', desc: 'Inspections in 30 minutes' },
    { icon: Shield, title: 'Certified', desc: 'ISO certified inspectors' },
    { icon: Award, title: 'Digital Certificate', desc: 'Instant digital delivery' }
  ]

  const services = [
    { name: 'Standard Inspection', price: '$50', duration: '30 min', features: ['Complete vehicle check', 'Digital certificate', 'Email support'] },
    { name: 'Premium Inspection', price: '$80', duration: '45 min', features: ['Extended diagnostics', 'Priority service', 'Detailed report', '24/7 support'] },
    { name: 'Express Inspection', price: '$100', duration: '20 min', features: ['Same-day service', 'VIP treatment', 'All premium features'] }
  ]

  const stats = [
    { value: '50K+', label: 'Inspections Completed' },
    { value: '98%', label: 'Pass Rate' },
    { value: '4.9/5', label: 'Customer Rating' },
    { value: '15min', label: 'Avg. Wait Time' }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                SmartAutoCheck
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="text-gray-700 hover:text-primary-600 transition">Services</Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-primary-600 transition">How It Works</Link>
              <Link href="#pricing" className="text-gray-700 hover:text-primary-600 transition">Pricing</Link>
              <Link href="/booking" className="btn-primary">Book Now</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-primary-100 animate-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                Vehicle Inspections
                <span className="block bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Skip the hassle. Book online, get inspected fast, and receive your digital certificate instantly.
                Welcome to the future of vehicle inspections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/booking" className="btn-primary inline-flex items-center justify-center">
                  Book Inspection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="#how-it-works" className="btn-secondary inline-flex items-center justify-center">
                  Learn More
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mt-12">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
                    <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative h-[500px] bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Next Available Slot</h3>
                  <p className="text-primary-100">Today, 2:30 PM - 3:00 PM</p>
                </div>
              </div>
              
              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-8 -right-4 bg-white rounded-xl shadow-xl p-4 w-48"
              >
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">98% Pass Rate</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose SmartAutoCheck?</h2>
            <p className="text-xl text-gray-600">Modern, efficient, and customer-focused</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="card text-center group hover:scale-105"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4 group-hover:bg-primary-600 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
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
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`card ${idx === 1 ? 'ring-2 ring-primary-600 scale-105' : ''}`}
              >
                {idx === 1 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-primary-600">{service.price}</span>
                  <span className="text-gray-600"> / {service.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/booking" className={idx === 1 ? 'btn-primary w-full block text-center' : 'btn-secondary w-full block text-center'}>
                  Select Plan
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Certified?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of satisfied customers. Book your inspection today.
            </p>
            <Link href="/booking" className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition shadow-xl">
              Book Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6" />
                <span className="text-xl font-bold">SmartAutoCheck</span>
              </div>
              <p className="text-gray-400">Modern vehicle inspections made simple.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/booking">Book Inspection</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/locations">Locations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/help">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartAutoCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
