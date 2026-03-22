import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../router/routeConstants';
import {
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

// ── Campus images (Unsplash CDN — no API key needed for img src) ──────────────
const CAMPUS_IMGS = [
  { src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=900&q=80&auto=format&fit=crop', label: 'Main Campus', span: 'row-span-2' },
  { src: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&q=80&auto=format&fit=crop', label: 'Central Library', span: '' },
  { src: 'https://images.unsplash.com/photo-1532094349884-543290cce2f9?w=700&q=80&auto=format&fit=crop', label: 'Science Labs', span: '' },
  { src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=700&q=80&auto=format&fit=crop', label: 'Smart Classrooms', span: '' },
  { src: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=700&q=80&auto=format&fit=crop', label: 'Convocation Hall', span: '' },
];

const STATS = [
  { value: '1,200+', label: 'Students Enrolled', icon: UserGroupIcon,   color: 'from-blue-500 to-blue-600' },
  { value: '80+',    label: 'Expert Faculty',    icon: AcademicCapIcon,  color: 'from-violet-500 to-purple-600' },
  { value: '25+',    label: 'Years of Legacy',   icon: TrophyIcon,       color: 'from-amber-400 to-orange-500' },
  { value: '98%',    label: 'Pass Rate',          icon: ChartBarIcon,     color: 'from-emerald-500 to-teal-500' },
];

const FEATURES = [
  { icon: ClipboardDocumentListIcon, title: 'Smart Admissions',   desc: 'End-to-end paperless admissions with real-time status tracking and auto-notifications.',  color: 'bg-blue-500',    ring: 'ring-blue-100'   },
  { icon: UserGroupIcon,             title: 'Student Profiles',   desc: 'Rich student records covering academics, attendance, fee history and parent contacts.',     color: 'bg-violet-500',  ring: 'ring-violet-100' },
  { icon: AcademicCapIcon,           title: 'Examination Portal', desc: 'Schedule exams, publish results and auto-generate grade cards — instantly.',                color: 'bg-emerald-500', ring: 'ring-emerald-100'},
  { icon: BanknotesIcon,             title: 'Fee Automation',     desc: 'Generate invoices, collect online payments and track defaulters with reminders.',            color: 'bg-amber-500',   ring: 'ring-amber-100'  },
  { icon: ChatBubbleLeftRightIcon,   title: 'Communication Hub',  desc: 'Broadcast announcements and target messages across students, parents and faculty.',          color: 'bg-rose-500',    ring: 'ring-rose-100'   },
  { icon: ChartBarIcon,              title: 'Analytics',          desc: 'Live dashboards covering attendance trends, collections and academic performance.',           color: 'bg-cyan-500',    ring: 'ring-cyan-100'   },
];

const COURSES = [
  { name: 'B.Tech Computer Science', duration: '4 Years', seats: 120, fee: '₹1,20,000/yr', badge: 'Popular',   img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80&auto=format&fit=crop' },
  { name: 'M.Tech AI & Machine Learning', duration: '2 Years', seats: 60,  fee: '₹90,000/yr',  badge: 'New',      img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80&auto=format&fit=crop' },
  { name: 'BBA',                     duration: '3 Years', seats: 100, fee: '₹80,000/yr',  badge: '',          img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&auto=format&fit=crop' },
  { name: 'B.Sc. Data Science',      duration: '3 Years', seats: 80,  fee: '₹60,000/yr',  badge: 'In Demand', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop' },
];

const TESTIMONIALS = [
  { name: 'Priya Mehta',  role: 'Class XI Student', text: 'The student portal makes it so easy to check attendance and results. Everything is just a click away!', avatar: 'PM', stars: 5 },
  { name: 'Rajesh Kumar', role: 'Parent',            text: 'I get instant notifications about fees and attendance. The transparency this system brings is truly commendable.', avatar: 'RK', stars: 5 },
  { name: 'Dr. S. Gupta', role: 'Vice Principal',    text: 'Administrative workload dropped by 60% after adopting EduERP. The reports alone save us hours every week.', avatar: 'SG', stars: 5 },
];

// ── Image with gradient fallback ──────────────────────────────────────────────
function CampusImg({ src, label, className = '' }: { src: string; label: string; className?: string }) {
  const [err, setErr] = useState(false);
  return (
    <div className={`relative overflow-hidden rounded-2xl group ${className}`}>
      {!err ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          onError={() => setErr(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-800 flex items-center justify-center">
          <AcademicCapIcon className="w-12 h-12 text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {label}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — full-screen, campus background image + overlay
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background campus image */}
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=85&auto=format&fit=crop"
          alt="EduERP Campus"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        {/* Floating badge — top-right */}
        <div className={`absolute top-24 right-8 hidden xl:flex flex-col gap-3 transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { dot: 'bg-emerald-400', label: 'Students Enrolled', val: '1,248' },
            { dot: 'bg-blue-400',    label: "Today's Attendance", val: '94.2%' },
            { dot: 'bg-violet-400',  label: 'Fees Collected',    val: '₹8.4L' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white shadow-lg">
              <span className={`w-2 h-2 rounded-full ${r.dot} animate-pulse shrink-0`} />
              <span className="text-xs text-white/70">{r.label}</span>
              <span className="text-sm font-bold ml-auto pl-4">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 lg:py-40 w-full">
          <div className={`max-w-2xl transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Admissions Open — 2025–26
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-6 tracking-tight">
              Where Every<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Dream Learns
              </span>{' '}
              to Fly
            </h1>

            <p className="text-lg text-white/70 max-w-xl mb-10 leading-relaxed">
              A premier institution shaping future leaders since 2000. Modern infrastructure, world-class faculty, and a platform that keeps every stakeholder connected.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to={ROUTES.CONTACT}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-xl shadow-blue-500/30 hover:opacity-90 transition-opacity"
              >
                Apply for Admission
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.ABOUT}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/30 text-white font-medium backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <PlayIcon className="w-5 h-5" />
                Explore Campus
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 mt-10">
              {['AICTE Approved', 'NAAC A+ Rated', 'ISO 9001:2015'].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-white/60 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/40">
          <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 py-8 px-6 group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-3xl font-extrabold text-gray-900 leading-tight">{s.value}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CAMPUS GALLERY
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Our Campus</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">A Place to Grow & Thrive</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">25 acres of lush green campus with state-of-the-art infrastructure designed for the leaders of tomorrow.</p>
          </div>

          {/* Grid: 1 tall left + 2×2 right */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-auto lg:h-[520px]">
            <CampusImg
              src={CAMPUS_IMGS[0].src}
              label={CAMPUS_IMGS[0].label}
              className="col-span-2 lg:col-span-1 lg:row-span-2 h-64 lg:h-full"
            />
            {CAMPUS_IMGS.slice(1).map((img) => (
              <CampusImg key={img.label} src={img.src} label={img.label} className="h-48 lg:h-auto" />
            ))}
          </div>

          {/* Caption strip */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {['Main Campus', 'Central Library', 'Science Labs', 'Smart Classrooms', 'Convocation Hall', 'Sports Complex'].map((tag) => (
              <span key={tag} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Platform</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">Everything Your Institution Needs</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">An all-in-one ERP covering every administrative function from admission to alumni management.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ring-4 ring-transparent hover:${f.ring}`}>
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COURSES — image cards
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Academics</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">Our Programmes</h2>
            </div>
            <Link to={ROUTES.CONTACT} className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
              View all programmes <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COURSES.map((c) => {
              const [imgErr, setImgErr] = useState(false);
              return (
                <div key={c.name} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                  <div className="relative h-44 overflow-hidden">
                    {!imgErr ? (
                      <img
                        src={c.img}
                        alt={c.name}
                        loading="lazy"
                        onError={() => setImgErr(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                        <AcademicCapIcon className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    {c.badge && (
                      <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-blue-700 shadow">
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 leading-snug mb-3">{c.name}</h3>
                    <div className="flex-1 space-y-1.5 text-sm text-gray-500 mb-4">
                      <div className="flex justify-between"><span>Duration</span><span className="font-medium text-gray-700">{c.duration}</span></div>
                      <div className="flex justify-between"><span>Seats</span><span className="font-medium text-gray-700">{c.seats}</span></div>
                      <div className="flex justify-between"><span>Annual Fee</span><span className="font-bold text-gray-900">{c.fee}</span></div>
                    </div>
                    <Link
                      to={ROUTES.CONTACT}
                      className="block text-center py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Enquire Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIALS — dark strip with image backdrop
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1600&q=80&auto=format&fit=crop"
          alt="Testimonials background"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-slate-950/85" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">What Our Community Says</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-7 hover:bg-white/15 transition-colors">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/50 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10" />
            </div>
            <div className="relative">
              <span className="text-blue-200 text-sm font-semibold uppercase tracking-wider">Join Us</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-5">
                Shape Your Future<br />Starts Here
              </h2>
              <p className="text-blue-100/80 max-w-xl mx-auto mb-8 leading-relaxed">
                Applications are open for the 2025–26 academic year. Limited seats available. Apply today to secure your spot.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to={ROUTES.CONTACT}
                  className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-xl"
                >
                  Apply for Admission
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors backdrop-blur"
                >
                  Student Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
