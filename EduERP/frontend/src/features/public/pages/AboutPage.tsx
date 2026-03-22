
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../router/routeConstants';
import {
  AcademicCapIcon,
  TrophyIcon,
  UserGroupIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  LightBulbIcon,
  HeartIcon,
  StarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const MILESTONES = [
  { year: '2000', title: 'Foundation',            desc: 'Established with a vision to provide quality education to every student.' },
  { year: '2005', title: 'First 500 Students',    desc: 'Reached our first major milestone — 500 enrolled students across all programmes.' },
  { year: '2012', title: 'New Campus',            desc: 'Inaugurated the state-of-the-art campus with modern labs and sports facilities.' },
  { year: '2018', title: 'Digital Transformation',desc: 'Launched EduERP — our homegrown institution management platform.' },
  { year: '2023', title: 'National Recognition',  desc: 'Awarded "Best Institution in Education Technology" at the National Education Summit.' },
  { year: '2025', title: '25 Years of Excellence',desc: 'Celebrating 25 years with 1200+ students and 80+ dedicated faculty members.' },
];

const VALUES = [
  { icon: LightBulbIcon,  title: 'Innovation',   desc: 'We embrace technology and creative thinking to prepare students for a rapidly changing world.' },
  { icon: HeartIcon,      title: 'Integrity',    desc: 'Honesty, transparency and ethical behaviour form the foundation of everything we do.' },
  { icon: UserGroupIcon,  title: 'Inclusivity',  desc: 'Every student deserves equal access to quality education regardless of background.' },
  { icon: TrophyIcon,     title: 'Excellence',   desc: 'We set high standards and continually strive to exceed them in academics and beyond.' },
];

const FACULTY = [
  { name: 'Dr. Anita Sharma',  role: 'Principal',             dept: 'Administration',           initial: 'A' },
  { name: 'Prof. Rajesh Gupta', role: 'Head of Science',       dept: 'Physics & Chemistry',      initial: 'R' },
  { name: 'Ms. Priya Nair',    role: 'Head of Commerce',      dept: 'Business Studies',          initial: 'P' },
  { name: 'Mr. Sunil Mehta',   role: 'Head of Arts',          dept: 'History & Civics',          initial: 'S' },
  { name: 'Dr. Kavita Joshi',  role: 'Head of IT',            dept: 'Computer Science',          initial: 'K' },
  { name: 'Mr. Alok Singh',    role: 'Sports Coordinator',    dept: 'Physical Education',        initial: 'A' },
];

const FACILITIES = [
  { icon: BuildingLibraryIcon, title: 'Modern Library',         desc: '20,000+ volumes and digital database access'  },
  { icon: AcademicCapIcon,     title: 'Digital Classrooms',    desc: 'Smart boards and audio-visual learning systems' },
  { icon: GlobeAltIcon,        title: 'Language Lab',           desc: 'Equipped with latest language-learning software' },
  { icon: StarIcon,            title: 'Sports Complex',         desc: 'Indoor and outdoor arenas for 12+ sports'      },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-28 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">About Us</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-6 leading-tight">
            25 Years of Shaping{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Future Leaders
            </span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            We are a premier educational institution committed to academic excellence, holistic development,
            and nurturing the innovators of tomorrow.
          </p>
        </div>
      </section>

      {/* ── MISSION & VISION ─────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-5">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To provide an inclusive, high-quality education that equips students with the knowledge,
                skills and values to thrive in a globalised world — fostering intellectual curiosity,
                creativity and a lifelong love of learning.
              </p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-8 border border-violet-100">
              <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-5">
                <GlobeAltIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To be the most respected educational institution in the region — recognised for academic
                rigour, innovation, and the transformative impact our graduates have on society and industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Core Values</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Our Journey</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Milestones That Define Us</h2>
          </div>
          <div className="relative pl-8 border-l-2 border-blue-200 space-y-10">
            {MILESTONES.map((m) => (
              <div key={m.year} className="relative">
                <div className="absolute -left-[37px] w-6 h-6 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                </div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{m.year}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{m.title}</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FACULTY ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Our Team</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Meet the Faculty</h2>
            <p className="text-gray-500 mt-3">80+ dedicated educators with decades of collective experience.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {FACULTY.map((f) => (
              <div key={f.name} className="bg-white rounded-2xl p-5 border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {f.initial}
                </div>
                <p className="font-semibold text-gray-900 text-sm leading-snug">{f.name}</p>
                <p className="text-blue-600 text-xs mt-0.5">{f.role}</p>
                <p className="text-gray-400 text-xs mt-0.5">{f.dept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FACILITIES ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Campus Life</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">World-Class Facilities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FACILITIES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-white hover:bg-white/15 transition-colors">
                  <Icon className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-white/60 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Become Part of Our Story</h2>
          <p className="text-blue-100 mb-8">Join our vibrant community and start your journey towards excellence.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to={ROUTES.CONTACT}
              className="px-8 py-3.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-md inline-flex items-center gap-2"
            >
              Contact Admissions <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="px-8 py-3.5 border border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
