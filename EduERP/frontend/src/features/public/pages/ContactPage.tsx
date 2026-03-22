import React, { useState } from 'react';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

const CONTACTS = [
  { icon: MapPinIcon,   label: 'Address',        value: '14 Knowledge Park, Sector 62\nNoida, Uttar Pradesh — 201309' },
  { icon: PhoneIcon,    label: 'Admissions',      value: '+91 98765 43210' },
  { icon: EnvelopeIcon, label: 'Email',           value: 'admissions@eduerp.edu.in' },
  { icon: ClockIcon,    label: 'Office Hours',    value: 'Mon – Sat: 9 AM – 5 PM\nSunday: Closed' },
];

const DEPARTMENTS = [
  { name: 'Admissions Office',  email: 'admissions@eduerp.edu.in', phone: '+91 98765 43210' },
  { name: 'Accounts & Fees',   email: 'accounts@eduerp.edu.in',   phone: '+91 98765 43211' },
  { name: 'Examination Cell',  email: 'exams@eduerp.edu.in',      phone: '+91 98765 43212' },
  { name: 'Student Support',   email: 'support@eduerp.edu.in',    phone: '+91 98765 43213' },
];

type FormState = { name: string; email: string; phone: string; dept: string; message: string };

export default function ContactPage() {
  const [form, setForm]       = useState<FormState>({ name: '', email: '', phone: '', dept: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission (no real API in public site)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="w-full">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-28 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Get in Touch</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-6">
            We'd Love to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Hear From You</span>
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Whether it's an admission query, fee issue or just general feedback — our team is here to help.
          </p>
        </div>
      </section>

      {/* ── CONTACT CARDS ────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {CONTACTS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{c.label}</p>
                  <p className="text-gray-700 text-sm font-medium leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{c.value}</p>
                </div>
              );
            })}
          </div>

          {/* Form + map */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 max-w-xs">
                    Thank you for reaching out. Our team will get back to you within 1 working day.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', dept: '', message: '' }); }}
                    className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
                  <p className="text-gray-500 text-sm mb-6">Fill the form and we'll get back to you shortly.</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          name="name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Rahul Sharma"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                          name="dept"
                          value={form.dept}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                        >
                          <option value="">Select department</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Message *</label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help you…"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg"
                    >
                      {loading ? (
                        <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <PaperAirplaneIcon className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Department contacts + map placeholder */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Department Contacts</h3>
                <div className="space-y-4">
                  {DEPARTMENTS.map((d) => (
                    <div key={d.name} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                      <a href={`mailto:${d.email}`} className="text-xs text-blue-600 hover:underline block mt-0.5">{d.email}</a>
                      <a href={`tel:${d.phone}`}    className="text-xs text-gray-500 block">{d.phone}</a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 h-52 flex flex-col items-center justify-center gap-3 text-center px-6">
                <MapPinIcon className="w-10 h-10 text-blue-400" />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">14 Knowledge Park, Sector 62</p>
                  <p className="text-gray-500 text-xs mt-0.5">Noida, Uttar Pradesh — 201309</p>
                </div>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline hover:text-blue-800"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
