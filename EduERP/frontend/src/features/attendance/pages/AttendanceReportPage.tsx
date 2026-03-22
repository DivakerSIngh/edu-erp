import { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { attendanceService } from '../services/attendanceService';
import { examinationService } from '../../examination/services/examinationService';
import type { ClassAttendanceRow, AttendanceStatus } from '../types/attendance.types';
import type { ClassItem, SectionItem } from '../../examination/types/examination.types';

// ── Helpers ───────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const CELL_COLOR: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-100 text-emerald-800',
  Absent:  'bg-red-100 text-red-700',
  Leave:   'bg-amber-100 text-amber-700',
  Late:    'bg-yellow-100 text-yellow-700',
};

const CELL_ABBR: Record<AttendanceStatus, string> = {
  Present: 'P',
  Absent:  'A',
  Leave:   'L',
  Late:    'Lt',
};

interface StudentSummaryRow {
  studentId:         number;
  studentName:       string;
  enrollmentNumber:  string;
  present:           number;
  absent:            number;
  leave:             number;
  late:              number;
  total:             number;
  percentage:        number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AttendanceReportPage() {
  const now   = new Date();
  const [classes,   setClasses]   = useState<ClassItem[]>([]);
  const [sections,  setSections]  = useState<SectionItem[]>([]);
  const [classId,   setClassId]   = useState(0);
  const [sectionId, setSectionId] = useState(0);
  const [month,     setMonth]     = useState(now.getMonth() + 1);
  const [year,      setYear]      = useState(now.getFullYear());

  const [rows,    setRows]    = useState<ClassAttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Load classes once on mount
  useEffect(() => {
    examinationService.getAllClasses().then(res => {
      if (res.isSuccess && res.data.length > 0) {
        setClasses(res.data);
        setClassId(res.data[0].classId);
      }
    });
  }, []);

  // Load sections when classId changes
  useEffect(() => {
    if (!classId) return;
    examinationService.getSectionsByClass(classId).then(res => {
      if (res.isSuccess) {
        setSections(res.data);
        setSectionId(res.data.length > 0 ? res.data[0].sectionId : 0);
      }
    });
  }, [classId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getByClass(classId, sectionId, month, year);
      if (res.isSuccess) {
        setRows(res.data);
        setFetched(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Compute grid: students × days ─────────────────────────────────────────
  const daysInMonth = new Date(year, month, 0).getDate();

  // Unique students (preserve order)
  const students: { studentId: number; studentName: string; enrollmentNumber: string }[] = useMemo(() => {
    const seen = new Set<number>();
    const list: typeof students = [];
    for (const r of rows) {
      if (!seen.has(r.studentId)) {
        seen.add(r.studentId);
        list.push({ studentId: r.studentId, studentName: r.studentName, enrollmentNumber: r.enrollmentNumber });
      }
    }
    return list;
  }, [rows]);

  // grid[studentId][day] = status
  const grid = useMemo(() => {
    const g: Record<number, Record<number, AttendanceStatus>> = {};
    for (const r of rows) {
      const day = new Date(r.attendanceDate).getDate();
      if (!g[r.studentId]) g[r.studentId] = {};
      g[r.studentId][day] = r.status;
    }
    return g;
  }, [rows]);

  // per-student summary
  const summaries: StudentSummaryRow[] = useMemo(() =>
    students.map(s => {
      const dayMap = grid[s.studentId] ?? {};
      const vals   = Object.values(dayMap) as AttendanceStatus[];
      const present = vals.filter(v => v === 'Present').length;
      const absent  = vals.filter(v => v === 'Absent').length;
      const leave   = vals.filter(v => v === 'Leave').length;
      const late    = vals.filter(v => v === 'Late').length;
      const total   = vals.length;
      return {
        ...s,
        present, absent, leave, late, total,
        percentage: total ? Math.round((present / total) * 100) : 0,
      };
    }),
  [students, grid]);

  // Overall stats
  const overall = useMemo(() => ({
    present:    summaries.reduce((a, s) => a + s.present,  0),
    absent:     summaries.reduce((a, s) => a + s.absent,   0),
    leave:      summaries.reduce((a, s) => a + s.leave,    0),
    late:       summaries.reduce((a, s) => a + s.late,     0),
    total:      summaries.reduce((a, s) => a + s.total,    0),
  }), [summaries]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <ChartBarIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance Report</h1>
          <p className="text-sm text-gray-500">Monthly attendance grid — select class/section/month to view</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex flex-wrap items-end gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</label>
          <select value={classId} onChange={e => setClassId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {classes.map(c => <option key={c.classId} value={c.classId}>{c.className} ({c.yearName})</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</label>
          <select value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {sections.map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <button onClick={fetchReport} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors">
          {loading
            ? <ArrowPathIcon className="h-4 w-4 animate-spin" />
            : <FunnelIcon className="h-4 w-4" />}
          {loading ? 'Loading…' : 'View Report'}
        </button>
      </div>

      {/* Stats strip — only shown after fetch */}
      {fetched && (
        <div className="bg-white border-b border-gray-100 px-8 py-4 grid grid-cols-5 gap-4">
          {[
            { label: 'Total Students', val: students.length,  icon: <UserGroupIcon className="h-5 w-5" />,    color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Present',        val: overall.present,  icon: <CheckCircleIcon className="h-5 w-5" />, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Absent',         val: overall.absent,   icon: <XCircleIcon className="h-5 w-5" />,     color: 'text-red-700 bg-red-50' },
            { label: 'Leave',          val: overall.leave,    icon: <CalendarDaysIcon className="h-5 w-5" />,color: 'text-amber-700 bg-amber-50' },
            { label: 'Late',           val: overall.late,     icon: <ClockIcon className="h-5 w-5" />,       color: 'text-yellow-700 bg-yellow-50' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${item.color}`}>{item.icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{item.val}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {!fetched && !loading && (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400">
            <ChartBarIcon className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-semibold text-base text-gray-500">Select filters and click "View Report"</p>
            <p className="text-sm mt-1">Monthly attendance data will appear here</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-72">
            <svg className="animate-spin h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}

        {fetched && !loading && students.length === 0 && (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400">
            <UserGroupIcon className="h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium">No attendance records found for this period</p>
          </div>
        )}

        {fetched && !loading && students.length > 0 && (
          <>
            {/* ── Calendar Grid ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {MONTHS[month - 1]} {year} — {classes.find(c => c.classId === classId)?.className}{' '}
                  Section {sections.find(s => s.sectionId === sectionId)?.sectionName}
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  {(['Present', 'Absent', 'Leave', 'Late'] as AttendanceStatus[]).map(st => (
                    <span key={st} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${CELL_COLOR[st]}`}>
                      {CELL_ABBR[st]} = {st}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="text-xs min-w-max w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap sticky left-0 bg-gray-50 z-10 min-w-[180px]">Student</th>
                      <th className="px-2 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap sticky left-[180px] bg-gray-50 z-10 min-w-[90px]">Enroll No.</th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                        <th key={d} className="px-1.5 py-2.5 text-center font-semibold text-gray-500 min-w-[28px]">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {students.map(s => (
                      <tr key={s.studentId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10">{s.studentName}</td>
                        <td className="px-2 py-2 text-gray-500 font-mono whitespace-nowrap sticky left-[180px] bg-white z-10">{s.enrollmentNumber}</td>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                          const st = grid[s.studentId]?.[d];
                          return (
                            <td key={d} className={`px-1 py-2 text-center font-semibold rounded ${st ? CELL_COLOR[st] : 'text-gray-200'}`}>
                              {st ? CELL_ABBR[st] : '–'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Summary Table ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Student Summary</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Enroll No.</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-emerald-600">Present</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-red-600">Absent</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-amber-600">Leave</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-yellow-600">Late</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summaries.map((s, idx) => (
                    <tr key={s.studentId} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{s.studentName}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{s.enrollmentNumber}</td>
                      <td className="px-6 py-3 text-center text-gray-700 font-semibold">{s.total}</td>
                      <td className="px-6 py-3 text-center text-emerald-700 font-semibold">{s.present}</td>
                      <td className="px-6 py-3 text-center text-red-600 font-semibold">{s.absent}</td>
                      <td className="px-6 py-3 text-center text-amber-600 font-semibold">{s.leave}</td>
                      <td className="px-6 py-3 text-center text-yellow-600 font-semibold">{s.late}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${s.percentage >= 75 ? 'bg-emerald-100 text-emerald-800'
                            : s.percentage >= 60 ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'}`}>
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
