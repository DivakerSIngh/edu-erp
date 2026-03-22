import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../router/routeConstants';
import {
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import ChatbotWidget from '../common/ChatbotWidget';

const NAV_LINKS = [
  { label: 'Home',    to: ROUTES.HOME },
  { label: 'About',  to: ROUTES.ABOUT },
  { label: 'Contact', to: ROUTES.CONTACT },
];

export default function PublicWebsiteLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-blue-400'
        : 'text-white/80 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── TOP-BAR ───────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-900/95 backdrop-blur-sm shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">
              Edu<span className="text-blue-400">ERP</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink key={to} to={to} end={to === ROUTES.HOME} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Login button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30"
            >
              Student Login
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-slate-900/97 backdrop-blur-sm border-t border-white/10 px-6 py-5 space-y-4">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.HOME}
                className={({ isActive }) =>
                  `block text-sm font-medium py-1 ${isActive ? 'text-blue-400' : 'text-white/80'}`
                }
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { setMobileOpen(false); navigate(ROUTES.LOGIN); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold mt-2"
            >
              Student Login
            </button>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <AcademicCapIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-extrabold text-lg tracking-tight">
                  Edu<span className="text-blue-400">ERP</span>
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Empowering institutions with modern education management and student-first experiences since 2000.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Home',            to: ROUTES.HOME },
                  { label: 'About Us',        to: ROUTES.ABOUT },
                  { label: 'Contact',         to: ROUTES.CONTACT },
                  { label: 'Student Portal',  to: ROUTES.LOGIN },
                ].map(({ label, to }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-white/60 hover:text-blue-400 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Programs */}
            <div>
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Programs</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                {['B.Tech Computer Science', 'M.Tech AI & ML', 'BBA', 'MBA', 'B.Sc. Data Science'].map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Contact Us</h4>
              <ul className="space-y-3">
                {[
                  { Icon: MapPinIcon,   text: '14 Knowledge Park, Sector 62, Noida — 201309' },
                  { Icon: PhoneIcon,    text: '+91 98765 43210' },
                  { Icon: EnvelopeIcon, text: 'admissions@eduerp.edu.in' },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-white/60">
                    <Icon className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} EduERP Institute. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-xs text-white/40">
              <Link to={ROUTES.HOME} className="hover:text-white/70 transition-colors">Privacy Policy</Link>
              <Link to={ROUTES.HOME} className="hover:text-white/70 transition-colors">Terms of Use</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── CHATBOT ──────────────────────────────────────────────────────── */}
      <ChatbotWidget />
    </div>
  );
}
