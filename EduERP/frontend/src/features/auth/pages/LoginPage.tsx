import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../router/routeConstants';
import type { LoginRequest } from '../types/auth.types';
import {
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const FEATURES = [
  { emoji: '🎓', text: 'Smart Admission Management' },
  { emoji: '📊', text: 'Real-time Attendance Tracking' },
  { emoji: '💳', text: 'Automated Fee Collection' },
  { emoji: '📝', text: 'Online Examination Portal' },
];

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD;

  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch {
      // error is displayed via useAuth().error
    }
  };

  return (
    <div className="w-full min-h-screen flex">
      {/* ── LEFT PANEL — branding ────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-12 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-20 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-white/5" />
        </div>

        <div className="relative">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">EduERP</span>
          </Link>
          <p className="text-white/70 text-sm mt-2">Education Management Platform</p>
        </div>

        <div className="relative space-y-6">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">
              Manage your institution<br />smarter &amp; faster
            </h2>
            <p className="text-white/70 text-sm mt-4 leading-relaxed max-w-xs">
              One platform for admissions, attendance, exams, fees, and everything in between.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map(({ emoji, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="text-base">{emoji}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to website
          </Link>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ───────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex justify-center mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-800">EduERP</span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                autoComplete="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400"
                placeholder="you@institution.edu"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>
              <Link to={ROUTES.OTP_LOGIN} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Sign in with OTP
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-opacity shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Mobile back link */}
          <div className="lg:hidden mt-8 text-center">
            <Link to={ROUTES.HOME} className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5 transition-colors">
              <ArrowLeftIcon className="w-3 h-3" /> Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
