import { useEffect, useState } from 'react';
import { studentService } from '../../students/services/studentService';
import type { StudentDetail, StudentResult } from '../../students/types/student.types';
import Spinner from '../../../components/ui/Spinner';
import {
  AcademicCapIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

// ── helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function gradeColor(grade: string | null) {
  if (!grade) return 'bg-gray-100 text-gray-600';
  if (['A+', 'A'].includes(grade))   return 'bg-emerald-100 text-emerald-700';
  if (['B'].includes(grade))         return 'bg-blue-100 text-blue-700';
  if (['C'].includes(grade))         return 'bg-indigo-100 text-indigo-700';
  if (['D'].includes(grade))         return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function pctColor(pct: number) {
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 60) return 'text-blue-600';
  if (pct >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function pctBar(pct: number) {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-blue-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

// Group results by examinationId
interface ExamGroup {
  examinationId: number;
  examName:      string;
  examType:      string;
  startDate:     string;
  className:     string;
  academicYear:  string;
  passMarks:     number;
  subjects:      StudentResult[];
  totalObtained: number;
  totalMax:      number;
  percentage:    number;
  passed:        boolean;
}

function groupByExam(results: StudentResult[]): ExamGroup[] {
  const map = new Map<number, ExamGroup>();
  for (const r of results) {
    if (!map.has(r.examinationId)) {
      map.set(r.examinationId, {
        examinationId: r.examinationId,
        examName:      r.examName,
        examType:      r.examType,
        startDate:     r.startDate,
        className:     r.className,
        academicYear:  r.academicYear,
        passMarks:     r.passMarks,
        subjects:      [],
        totalObtained: 0,
        totalMax:      0,
        percentage:    0,
        passed:        true,
      });
    }
    const g = map.get(r.examinationId)!;
    g.subjects.push(r);
    g.totalObtained += r.marksObtained;
    g.totalMax      += r.maxMarks;
    if (r.result === 'Fail') g.passed = false;
  }
  // compute percentage
  for (const g of map.values()) {
    g.percentage = g.totalMax > 0 ? Math.round((g.totalObtained / g.totalMax) * 100) : 0;
  }
  return [...map.values()];
}

// Overall grade from percentage
function overallGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

// ── InfoChip ─────────────────────────────────────────────────────────────────
function InfoChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-blue-100/60 text-xs uppercase tracking-wide">{label}</p>
        <p className="text-white font-semibold text-sm leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── ExamResultCard ────────────────────────────────────────────────────────────
function ExamResultCard({ group }: { group: ExamGroup }) {
  const [open, setOpen] = useState(false);
  const grade = overallGrade(group.percentage);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm
            ${group.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {grade}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{group.examName}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500">{group.examType}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500">
                {new Date(group.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-gray-300">·</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${group.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {group.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>

        {/* Score summary */}
        <div className="flex items-center gap-6 shrink-0 ml-4">
          <div className="text-right hidden sm:block">
            <p className={`text-2xl font-extrabold ${pctColor(group.percentage)}`}>{group.percentage}%</p>
            <p className="text-xs text-gray-400">{group.totalObtained}/{group.totalMax} marks</p>
          </div>
          {/* Progress ring (mini) */}
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle
                cx="22" cy="22" r="18"
                fill="none"
                stroke={group.passed ? '#10b981' : '#ef4444'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(group.percentage / 100) * 113.1} 113.1`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
              {group.percentage}%
            </span>
          </div>
          <div className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className={`h-full ${pctBar(group.percentage)} transition-all`}
          style={{ width: `${group.percentage}%` }}
        />
      </div>

      {/* Subject table — expandable */}
      {open && (
        <div className="px-6 py-4 border-t border-gray-50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                <th className="pb-2 text-left font-semibold">Subject</th>
                <th className="pb-2 text-center font-semibold">Marks</th>
                <th className="pb-2 text-center font-semibold">Out of</th>
                <th className="pb-2 text-center font-semibold">%</th>
                <th className="pb-2 text-center font-semibold">Grade</th>
                <th className="pb-2 text-center font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.subjects.map(s => {
                const subPct = s.maxMarks > 0 ? Math.round((s.marksObtained / s.maxMarks) * 100) : 0;
                return (
                  <tr key={s.subjectId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-gray-800">{s.subjectName}</span>
                      <span className="ml-2 text-xs text-gray-400">{s.subjectCode}</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-gray-900">{s.marksObtained}</td>
                    <td className="py-2.5 text-center text-gray-500">{s.maxMarks}</td>
                    <td className={`py-2.5 text-center font-semibold ${pctColor(subPct)}`}>{subPct}%</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(s.grade)}`}>
                        {s.grade ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      {s.result === 'Pass'
                        ? <CheckCircleIcon className="w-4 h-4 text-emerald-500 inline" />
                        : <XCircleIcon className="w-4 h-4 text-red-500 inline" />
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr>
                <td className="py-2.5 pl-1 text-xs font-bold text-gray-700 uppercase tracking-wide">Total</td>
                <td className="py-2.5 text-center font-extrabold text-gray-900">{group.totalObtained}</td>
                <td className="py-2.5 text-center font-bold text-gray-600">{group.totalMax}</td>
                <td className={`py-2.5 text-center font-extrabold ${pctColor(group.percentage)}`}>{group.percentage}%</td>
                <td className="py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(grade)}`}>{grade}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${group.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {group.passed ? 'Pass' : 'Fail'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentDashboardPage() {

  const [profile,  setProfile]  = useState<StudentDetail | null>(null);
  const [results,  setResults]  = useState<StudentResult[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      studentService.getMyProfile(),
      studentService.getMyResults(),
    ])
      .then(([profileRes, resultsRes]) => {
        setProfile(profileRes.data);
        setResults(resultsRes.data ?? []);
      })
      .catch(() => setError('Failed to load your data. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="-m-6 flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="-m-6 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AcademicCapIcon className="h-12 w-12 text-gray-300" />
        <p className="text-red-600 font-medium">{error ?? 'Profile not found.'}</p>
      </div>
    );
  }

  const examGroups         = groupByExam(results);
  const totalExams         = examGroups.length;
  const passedExams        = examGroups.filter(g => g.passed).length;
  const avgPct             = examGroups.length > 0
    ? Math.round(examGroups.reduce((s, g) => s + g.percentage, 0) / examGroups.length)
    : 0;
  const best               = examGroups.reduce<ExamGroup | null>(
    (b, g) => (!b || g.percentage > b.percentage) ? g : b, null
  );
  const initials           = profile.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">

      {/* ── Hero / Welcome banner ─────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-indigo-700 via-blue-700 to-blue-600 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative px-6 pt-6 pb-5 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shrink-0 ring-2 ring-white/30">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <SparklesIcon className="w-4 h-4 text-yellow-300" />
                <span className="text-blue-100/80 text-sm">{getGreeting()}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white truncate">{profile.fullName} 👋</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2.5 py-1 bg-white/20 text-white font-semibold rounded-full backdrop-blur">
                  {profile.enrollmentNumber}
                </span>
                <span className="text-xs px-2.5 py-1 bg-white/20 text-white font-semibold rounded-full backdrop-blur flex items-center gap-1">
                  <BuildingLibraryIcon className="w-3 h-3" />{profile.className} · Sec {profile.section}
                </span>
                <span className="text-xs px-2.5 py-1 bg-white/20 text-white font-semibold rounded-full backdrop-blur">
                  {profile.academicYear}
                </span>
              </div>
            </div>
          </div>

          {/* Info chips */}
          <div className="mt-5 pt-5 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoChip icon={IdentificationIcon}    label="Enrollment"  value={profile.enrollmentNumber} />
            <InfoChip icon={AcademicCapIcon}        label="Class"       value={`${profile.className} – ${profile.section}`} />
            <InfoChip icon={CalendarDaysIcon}       label="Admitted"    value={new Date(profile.admissionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} />
            <InfoChip icon={UserCircleIcon}         label="Status"      value={profile.status} />
          </div>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Exams Appeared',
            value: String(totalExams),
            sub:   totalExams === 0 ? 'No results yet' : `${passedExams} passed`,
            icon:  ClipboardDocumentListIcon,
            light: 'bg-indigo-50 text-indigo-600',
            accent: 'text-indigo-600',
          },
          {
            label: 'Pass Rate',
            value: totalExams > 0 ? `${Math.round((passedExams / totalExams) * 100)}%` : '—',
            sub:   `${passedExams}/${totalExams} exams`,
            icon:  CheckCircleIcon,
            light: 'bg-emerald-50 text-emerald-600',
            accent: 'text-emerald-600',
          },
          {
            label: 'Avg. Score',
            value: totalExams > 0 ? `${avgPct}%` : '—',
            sub:   avgPct >= 60 ? 'Keep it up!' : avgPct > 0 ? 'Room to grow' : 'No data',
            icon:  ChartBarIcon,
            light: 'bg-blue-50 text-blue-600',
            accent: 'text-blue-600',
          },
          {
            label: 'Best Exam',
            value: best ? `${best.percentage}%` : '—',
            sub:   best ? best.examName : 'No results',
            icon:  StarIcon,
            light: 'bg-amber-50 text-amber-600',
            accent: 'text-amber-600',
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl ${stat.light} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-extrabold ${stat.accent} leading-tight`}>{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main area: Results + Profile side ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Results list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Exam Results</h2>
            </div>
            {results.length > 0 && (
              <span className="text-xs text-gray-400">{examGroups.length} exam{examGroups.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {examGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-gray-400">
              <ClipboardDocumentListIcon className="h-10 w-10 mb-3" />
              <p className="text-sm font-semibold">No results published yet</p>
              <p className="text-xs mt-1">Your exam results will appear here once published by admin</p>
            </div>
          ) : (
            examGroups.map(g => <ExamResultCard key={g.examinationId} group={g} />)
          )}
        </div>

        {/* Profile side panel */}
        <div className="space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCircleIcon className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">My Profile</h2>
            </div>

            <div className="flex flex-col items-center text-center mb-5 pb-5 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-xl mb-3">
                {initials}
              </div>
              <p className="font-bold text-gray-900">{profile.fullName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{profile.email ?? '—'}</p>
              <span className={`mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                profile.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>{profile.status}</span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Enrollment No.', value: profile.enrollmentNumber },
                { label: 'Class',          value: `${profile.className} – ${profile.section}` },
                { label: 'Academic Year',  value: profile.academicYear },
                { label: 'Date of Birth',  value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : '—' },
                { label: 'Gender',         value: profile.gender },
                { label: 'Blood Group',    value: profile.bloodGroup ?? '—' },
                { label: 'Phone',          value: profile.phone ?? '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide shrink-0">{row.label}</span>
                  <span className="text-xs font-semibold text-gray-700 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance card */}
          {typeof profile.attendancePercentage === 'number' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Attendance</h2>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={profile.attendancePercentage >= 75 ? '#10b981' : profile.attendancePercentage >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(profile.attendancePercentage / 100) * 251.2} 251.2`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold text-gray-900">{profile.attendancePercentage}%</span>
                    <span className="text-xs text-gray-400">Present</span>
                  </div>
                </div>
                <p className={`mt-3 text-sm font-semibold ${
                  profile.attendancePercentage >= 75 ? 'text-emerald-600' :
                  profile.attendancePercentage >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {profile.attendancePercentage >= 75 ? 'Good standing' :
                   profile.attendancePercentage >= 60 ? 'Needs improvement' : 'Critical — below 60%'}
                </p>
              </div>
            </div>
          )}

          {/* Parent info */}
          {profile.parents && profile.parents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCircleIcon className="h-5 w-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Parent / Guardian</h2>
              </div>
              <div className="space-y-3">
                {profile.parents.map(p => (
                  <div key={p.parentId} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {p.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.fullName}</p>
                      <p className="text-xs text-gray-500">{p.relationship} · {p.phoneNumber || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
