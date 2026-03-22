import { useState, useEffect, useMemo } from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { exportToExcel } from '../utils/exportExcel';
import { attendanceService }   from '../../attendance/services/attendanceService';
import { examinationService }  from '../../examination/services/examinationService';
import type { ClassAttendanceRow } from '../../attendance/types/attendance.types';
import type { ClassItem, SectionItem }               from '../../examination/types/examination.types';

// ── helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pctColor(p: number) {
  if (p >= 75) return 'bg-emerald-100 text-emerald-800';
  if (p >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

interface StudentSummary {
  studentId:        number;
  studentName:      string;
  enrollmentNumber: string;
  present: number; absent: number; leave: number; late: number; total: number;
  percentage: number;
}

function buildSummaries(rows: ClassAttendanceRow[]): StudentSummary[] {
  const map = new Map<number, StudentSummary>();
  for (const r of rows) {
    if (!map.has(r.studentId)) {
      map.set(r.studentId, {
        studentId: r.studentId, studentName: r.studentName,
        enrollmentNumber: r.enrollmentNumber,
        present: 0, absent: 0, leave: 0, late: 0, total: 0, percentage: 0,
      });
    }
    const s = map.get(r.studentId)!;
    s.total++;
    if (r.status === 'Present') s.present++;
    else if (r.status === 'Absent') s.absent++;
    else if (r.status === 'Leave') s.leave++;
    else if (r.status === 'Late') s.late++;
  }
  for (const s of map.values()) {
    s.percentage = s.total ? Math.round((s.present / s.total) * 100) : 0;
  }
  return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ReportAttendancePage() {
  const now = new Date();

  const [classes,   setClasses]   = useState<ClassItem[]>([]);
  const [sections,  setSections]  = useState<SectionItem[]>([]);
  const [classId,   setClassId]   = useState(0);
  const [sectionId, setSectionId] = useState(0);
  const [month,     setMonth]     = useState(now.getMonth() + 1);
  const [year,      setYear]      = useState(now.getFullYear());
  const [rows,      setRows]      = useState<ClassAttendanceRow[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [fetched,   setFetched]   = useState(false);

  useEffect(() => {
    examinationService.getAllClasses().then(res => {
      if (res.isSuccess && res.data.length > 0) {
        setClasses(res.data);
        setClassId(res.data[0].classId);
      }
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    examinationService.getSectionsByClass(classId).then(res => {
      if (res.isSuccess) {
        setSections(res.data);
        setSectionId(res.data.length > 0 ? res.data[0].sectionId : 0);
      }
    });
  }, [classId]);

  const fetch = async () => {
    if (!classId || !sectionId) return;
    setLoading(true);
    try {
      const res = await attendanceService.getByClass(classId, sectionId, month, year);
      if (res.isSuccess) { setRows(res.data); setFetched(true); }
    } finally { setLoading(false); }
  };

  const summaries = useMemo(() => buildSummaries(rows), [rows]);

  const overall = useMemo(() => ({
    present:    summaries.reduce((a, s) => a + s.present, 0),
    absent:     summaries.reduce((a, s) => a + s.absent,  0),
    leave:      summaries.reduce((a, s) => a + s.leave,   0),
    late:       summaries.reduce((a, s) => a + s.late,    0),
    total:      summaries.reduce((a, s) => a + s.total,   0),
    avgPct:     summaries.length
      ? Math.round(summaries.reduce((a, s) => a + s.percentage, 0) / summaries.length)
      : 0,
  }), [summaries]);

  const lowAttendance = useMemo(() => summaries.filter(s => s.percentage < 75), [summaries]);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <UsersIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Attendance Report</h1>
          <p className="text-sm text-gray-500">Monthly class-wise attendance summary</p>
        </div>
        {fetched && summaries.length > 0 && (
          <button
            onClick={() =>
              exportToExcel(
                summaries.map(s => ({
                  'Enrollment No': s.enrollmentNumber,
                  Name:            s.studentName,
                  Present:         s.present,
                  Absent:          s.absent,
                  Late:            s.late,
                  Leave:           s.leave,
                  'Total Days':    s.total,
                  'Attendance %':  s.percentage,
                })) as Record<string, unknown>[],
                `attendance_${MONTHS[month - 1]}_${year}`,
                'Attendance',
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Export to Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex flex-wrap items-end gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</label>
          <select value={classId} onChange={e => setClassId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]">
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
        <button onClick={fetch} disabled={loading || !classId}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors">
          {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <FunnelIcon className="h-4 w-4" />}
          {loading ? 'Loading…' : 'View Report'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {!fetched && !loading && (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400">
            <UsersIcon className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-semibold text-base text-gray-500">Select filters and click "View Report"</p>
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

        {fetched && !loading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Students',     val: summaries.length,  icon: <UsersIcon className="h-5 w-5" />,          color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Avg %',        val: `${overall.avgPct}%`, icon: <CheckCircleIcon className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
                { label: 'Present',      val: overall.present,   icon: <CheckCircleIcon className="h-5 w-5" />,   color: 'text-emerald-700 bg-emerald-50' },
                { label: 'Absent',       val: overall.absent,    icon: <XCircleIcon className="h-5 w-5" />,       color: 'text-red-700 bg-red-50' },
                { label: 'Leave',        val: overall.leave,     icon: <CalendarDaysIcon className="h-5 w-5" />,  color: 'text-amber-700 bg-amber-50' },
                { label: 'Late',         val: overall.late,      icon: <ClockIcon className="h-5 w-5" />,        color: 'text-yellow-700 bg-yellow-50' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${item.color}`}>{item.icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{item.val}</div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Low attendance alert */}
            {lowAttendance.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  ⚠ {lowAttendance.length} student{lowAttendance.length > 1 ? 's' : ''} below 75% attendance
                </p>
                <p className="text-xs text-red-600">
                  {lowAttendance.map(s => s.studentName).join(' • ')}
                </p>
              </div>
            )}

            {/* Student summary table */}
            {summaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <UsersIcon className="h-10 w-10 mb-2 opacity-40" />
                <p className="font-medium">No attendance records for this period</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">
                    Student Summary — {MONTHS[month - 1]} {year} &nbsp;·&nbsp;
                    {classes.find(c => c.classId === classId)?.className} &nbsp;
                    Section {sections.find(s => s.sectionId === sectionId)?.sectionName}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-8">#</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Enroll No.</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Total Days</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-emerald-600">Present</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-red-600">Absent</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-amber-600">Leave</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-yellow-600">Late</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${pctColor(s.percentage)}`}>
                              {s.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

