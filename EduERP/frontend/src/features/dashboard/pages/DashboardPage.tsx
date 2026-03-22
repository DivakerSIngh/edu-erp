import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import StudentDashboardPage from './StudentDashboardPage';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../router/routeConstants';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  BuildingLibraryIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// ── KPI cards ─────────────────────────────────────────────────────────────────
const STATS = [
  {
    label: 'Total Students',
    value: '1,248',
    change: '+12 this month',
    trend: 'up' as const,
    icon: UserGroupIcon,
    from: 'from-blue-500', to: 'to-blue-700',
    light: 'bg-blue-50 text-blue-600',
    bar: [65, 72, 68, 80, 75, 85, 90],
  },
  {
    label: 'Pending Admissions',
    value: '34',
    change: '8 need review',
    trend: 'warn' as const,
    icon: ClipboardDocumentListIcon,
    from: 'from-amber-400', to: 'to-orange-500',
    light: 'bg-amber-50 text-amber-600',
    bar: [30, 25, 40, 34, 42, 38, 34],
  },
  {
    label: "Today's Attendance",
    value: '94.2%',
    change: '+1.3% vs yesterday',
    trend: 'up' as const,
    icon: CheckBadgeIcon,
    from: 'from-emerald-500', to: 'to-teal-600',
    light: 'bg-emerald-50 text-emerald-600',
    bar: [88, 91, 90, 93, 92, 95, 94],
  },
  {
    label: 'Fees Collected',
    value: '₹8.4L',
    change: '₹2.1L due this week',
    trend: 'up' as const,
    icon: BanknotesIcon,
    from: 'from-violet-500', to: 'to-purple-700',
    light: 'bg-violet-50 text-violet-600',
    bar: [50, 60, 55, 70, 65, 80, 84],
  },
] as const;

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'New Admission',     path: ROUTES.ADMISSION_NEW,     icon: PlusCircleIcon,            from: 'from-blue-500',    to: 'to-cyan-500' },
  { label: 'Mark Attendance',   path: ROUTES.ATTENDANCE_MARK,   icon: ClipboardDocumentListIcon, from: 'from-emerald-500', to: 'to-teal-500' },
  { label: 'View Students',     path: ROUTES.STUDENTS,          icon: UserGroupIcon,             from: 'from-indigo-500',  to: 'to-violet-500' },
  { label: 'Fee Invoices',      path: ROUTES.FEE_INVOICES,      icon: BanknotesIcon,             from: 'from-violet-500',  to: 'to-purple-600' },
  { label: 'Announcements',     path: ROUTES.ANNOUNCEMENTS,     icon: BellAlertIcon,             from: 'from-amber-400',   to: 'to-orange-500' },
  { label: 'Attendance Report', path: ROUTES.REPORT_ATTENDANCE, icon: ChartBarIcon,              from: 'from-rose-500',    to: 'to-pink-600' },
] as const;

// ── Activity ──────────────────────────────────────────────────────────────────
const ACTIVITY = [
  { text: 'Anjali Sharma enrolled in Grade 10-A',        time: '2 min ago',  type: 'success' },
  { text: 'Fee payment received — Rahul Verma ₹12,500',  time: '18 min ago', type: 'info'    },
  { text: 'Attendance marked for Grade 9-B (42/44)',      time: '1 hr ago',   type: 'success' },
  { text: '3 admission forms pending approval',           time: '2 hrs ago',  type: 'warn'    },
  { text: 'Exam schedule published for Term 2',           time: '3 hrs ago',  type: 'info'    },
  { text: 'Library books return due for 12 students',     time: '5 hrs ago',  type: 'warn'    },
];

// ── Upcoming ──────────────────────────────────────────────────────────────────
const UPCOMING = [
  { title: 'Parent-Teacher Meeting',  date: 'Tue, 24 Mar', time: '10:00 AM', color: 'bg-blue-500'    },
  { title: 'Mid-Term Examinations',   date: 'Mon, 30 Mar', time: 'All Day',  color: 'bg-violet-500'  },
  { title: 'Annual Sports Day',       date: 'Fri, 4 Apr',  time: '8:00 AM',  color: 'bg-emerald-500' },
  { title: 'Fee Payment Deadline',    date: 'Sat, 5 Apr',  time: '5:00 PM',  color: 'bg-amber-500'   },
];

// ── Attendance ring (SVG donut) ────────────────────────────────────────────────
const ATTENDANCE_PCT = 94.2;
const R = 54;
const CIRC = 2 * Math.PI * R;
const FILLED = (ATTENDANCE_PCT / 100) * CIRC;

function AttendanceRing() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
          <circle cx="65" cy="65" r={R} fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle
            cx="65" cy="65" r={R}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${FILLED} ${CIRC}`}
          />
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-gray-900">{ATTENDANCE_PCT}%</span>
          <span className="text-xs text-gray-400 mt-0.5">Present</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-700">Today's Attendance</p>
      <div className="mt-3 grid grid-cols-3 gap-2 w-full">
        {[
          { label: 'Present', val: '1,175', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Absent',  val: '73',    color: 'text-red-500 bg-red-50' },
          { label: 'Leave',   val: '18',    color: 'text-amber-600 bg-amber-50' },
        ].map((d) => (
          <div key={d.label} className={`rounded-xl px-2 py-2 text-center ${d.color}`}>
            <p className="text-base font-bold leading-tight">{d.val}</p>
            <p className="text-xs font-medium mt-0.5">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline bar chart ────────────────────────────────────────────────────────
function Sparkline({ bars, color }: { bars: readonly number[]; color: string }) {
  const max = Math.max(...bars);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color} opacity-70`}
          style={{ height: `${(v / max) * 100}%`, minHeight: '3px' }}
        />
      ))}
    </div>
  );
}

// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  // Show role-specific dashboard
  if (user?.role === 'Student') return <StudentDashboardPage />;

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ──────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 rounded-2xl p-6 lg:p-8 overflow-hidden shadow-xl shadow-blue-500/20">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-extrabold text-xl shadow-lg shrink-0">
              {user?.fullName?.charAt(0) ?? 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-yellow-300" />
                <span className="text-blue-100 text-sm">{getGreeting()}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">
                {user?.fullName ?? 'User'} 👋
              </h1>
              <p className="text-blue-100/70 text-sm mt-0.5">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur">
              {user?.role}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur">
              <BuildingLibraryIcon className="w-3.5 h-3.5" />
              Academic Year 2025–26
            </div>
          </div>
        </div>

        {/* Mini KPI strip inside banner */}
        <div className="relative mt-5 pt-5 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Students',    val: '1,248', dot: 'bg-emerald-400' },
            { label: 'Attendance',  val: '94.2%', dot: 'bg-blue-300' },
            { label: 'Fees (Mon)',  val: '₹8.4L', dot: 'bg-violet-300' },
            { label: 'Pending',     val: '34',    dot: 'bg-amber-300' },
          ].map((k) => (
            <div key={k.label} className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${k.dot} shrink-0`} />
              <div>
                <p className="text-white font-bold text-lg leading-tight">{k.val}</p>
                <p className="text-blue-100/60 text-xs">{k.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden relative">
              <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${stat.from} ${stat.to} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${stat.light} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.trend === 'up'
                  ? <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                  : <ArrowTrendingDownIcon className="w-4 h-4 text-amber-500" />
                }
              </div>
              <p className="text-2xl font-extrabold text-gray-900 leading-tight">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              <p className={`text-xs mt-1.5 font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stat.change}
              </p>
              {/* Sparkline */}
              <div className="mt-3">
                <Sparkline bars={stat.bar} color={`bg-gradient-to-r ${stat.from} ${stat.to}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Attendance ring + Quick Actions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Attendance ring */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 self-start">Attendance Overview</h2>
          <AttendanceRing />
          <div className="mt-5 w-full">
            {[
              { label: 'Grade 10-A', pct: 97, color: 'bg-emerald-500' },
              { label: 'Grade 9-B',  pct: 89, color: 'bg-blue-500'    },
              { label: 'Grade 11-C', pct: 82, color: 'bg-amber-500'   },
            ].map((g) => (
              <div key={g.label} className="mb-2.5 last:mb-0">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{g.label}</span><span className="font-semibold">{g.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${g.color} rounded-full`} style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className={`group relative bg-gradient-to-br ${action.from} ${action.to} text-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-2xl" />
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold leading-tight">{action.label}</span>
                    <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Activity feed + Upcoming ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</h2>
            <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View all</span>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-100" />
            <div className="space-y-4">
              {ACTIVITY.map((item, i) => {
                const cfgMap: Record<string, { icon: React.ElementType; cls: string; ring: string }> = {
                  success: { icon: CheckBadgeIcon,         cls: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-200' },
                  warn:    { icon: ExclamationTriangleIcon, cls: 'bg-amber-100 text-amber-600',    ring: 'ring-amber-200'   },
                  info:    { icon: ClockIcon,               cls: 'bg-blue-100 text-blue-600',      ring: 'ring-blue-200'    },
                };
                const cfg = cfgMap[item.type] ?? { icon: ClockIcon, cls: 'bg-gray-100 text-gray-600', ring: 'ring-gray-200' };
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-start gap-4 relative group">
                    <div className={`w-[45px] h-[45px] rounded-xl ${cfg.cls} ring-4 ${cfg.ring} flex items-center justify-center shrink-0 z-10 bg-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 group-hover:bg-blue-50/50 transition-colors">
                      <p className="text-sm text-gray-800 leading-snug">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />{item.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Upcoming</h2>
            <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3 flex-1">
            {UPCOMING.map((e) => (
              <div key={e.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full ${e.color} mt-1.5 shrink-0`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug truncate">{e.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{e.date} · {e.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to={ROUTES.ANNOUNCEMENTS}
            className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Calendar <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
