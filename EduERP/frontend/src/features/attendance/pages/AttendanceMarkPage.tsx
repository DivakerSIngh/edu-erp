import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { examinationService } from '../../examination/services/examinationService';
import { attendanceService }  from '../services/attendanceService';
import type { ClassStudent, ClassItem, SectionItem } from '../../examination/types/examination.types';
import type { AttendanceStatus, AttendanceSheetRow } from '../types/attendance.types';

type StatusConfig = { label: string; bg: string; text: string; ring: string; icon: React.ReactNode };
const STATUS_CONFIG: Record<AttendanceStatus, StatusConfig> = {
  Present: {
    label: 'Present',
    bg:    'bg-emerald-50 hover:bg-emerald-100',
    text:  'text-emerald-700',
    ring:  'ring-emerald-500',
    icon:  <CheckCircleIcon className="h-4 w-4" />,
  },
  Absent: {
    label: 'Absent',
    bg:    'bg-red-50 hover:bg-red-100',
    text:  'text-red-700',
    ring:  'ring-red-500',
    icon:  <XCircleIcon className="h-4 w-4" />,
  },
  Leave: {
    label: 'Leave',
    bg:    'bg-amber-50 hover:bg-amber-100',
    text:  'text-amber-700',
    ring:  'ring-amber-500',
    icon:  <CalendarDaysIcon className="h-4 w-4" />,
  },
  Late: {
    label: 'Late',
    bg:    'bg-yellow-50 hover:bg-yellow-100',
    text:  'text-yellow-700',
    ring:  'ring-yellow-500',
    icon:  <ClockIcon className="h-4 w-4" />,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AttendanceMarkPage() {
  const today = new Date().toISOString().split('T')[0];

  const [classes,   setClasses]   = useState<ClassItem[]>([]);
  const [sections,  setSections]  = useState<SectionItem[]>([]);
  const [classId,   setClassId]   = useState<number>(0);
  const [sectionId, setSectionId] = useState<number>(0);
  const [date,      setDate]      = useState<string>(today);
  const [search,    setSearch]    = useState('');

  const [students,  setStudents]  = useState<AttendanceSheetRow[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await examinationService.getClassStudents(classId);
      if (res.isSuccess) {
        const sheet: AttendanceSheetRow[] = (res.data as ClassStudent[]).map(s => ({
          studentId:        s.studentId,
          studentName:      s.studentName,
          enrollmentNumber: s.enrollmentNumber,
          status:           'Present' as AttendanceStatus,
          remarks:          '',
        }));
        setStudents(sheet);
      }
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const setStatus  = (id: number, status: AttendanceStatus) =>
    setStudents(prev => prev.map(s => s.studentId === id ? { ...s, status } : s));

  const setRemarks = (id: number, remarks: string) =>
    setStudents(prev => prev.map(s => s.studentId === id ? { ...s, remarks } : s));

  const markAll = (status: AttendanceStatus) =>
    setStudents(prev => prev.map(s => ({ ...s, status })));

  const counts = students.reduce(
    (acc, s) => { acc[s.status]++; return acc; },
    { Present: 0, Absent: 0, Leave: 0, Late: 0 } as Record<AttendanceStatus, number>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await attendanceService.markBulk({
        classId,
        sectionId,
        attendanceDate: date,
        records: students.map(s => ({
          studentId: s.studentId,
          status:    s.status,
          remarks:   s.remarks || undefined,
        })),
      });
      if (res.isSuccess) {
        setToast({ type: 'success', msg: `Attendance saved — ${res.data.markedCount} records marked.` });
      } else {
        setToast({ type: 'error', msg: res.message });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                  ?? 'Failed to save attendance.';
      setToast({ type: 'error', msg });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filtered = students.filter(
    s => s.studentName.toLowerCase().includes(search.toLowerCase()) ||
         s.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
  );

  const STAT_COLORS: Record<AttendanceStatus, string> = {
    Present: 'text-emerald-700 bg-emerald-50',
    Absent:  'text-red-700 bg-red-50',
    Leave:   'text-amber-700 bg-amber-50',
    Late:    'text-yellow-700 bg-yellow-50',
  };

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="text-sm text-gray-500">Select class, section and date, then mark each student</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving
            ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            : <CheckIcon className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex flex-wrap items-end gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</label>
          <select
            value={classId}
            onChange={e => setClassId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {classes.map(c => <option key={c.classId} value={c.classId}>{c.className} ({c.yearName})</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</label>
          <select
            value={sectionId}
            onChange={e => setSectionId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {sections.map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 pb-0.5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mark all as:</span>
          {(['Present', 'Absent', 'Leave', 'Late'] as AttendanceStatus[]).map(st => {
            const cfg = STATUS_CONFIG[st];
            return (
              <button key={st} onClick={() => markAll(st)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cfg.bg} ${cfg.text}`}>
                {cfg.icon}{cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Strip */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 grid grid-cols-4 gap-4">
        {(['Present', 'Absent', 'Leave', 'Late'] as AttendanceStatus[]).map(st => (
          <div key={st} className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${STAT_COLORS[st]}`}>{STATUS_CONFIG[st].icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{counts[st]}</div>
              <div className="text-xs text-gray-500">{STATUS_CONFIG[st].label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-8 py-3 flex items-center gap-3">
        <div className="relative max-w-sm w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
          <UserGroupIcon className="h-4 w-4" />
          {students.length} students
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <UserGroupIcon className="h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium">No students found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-10">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Enroll No.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((s, idx) => (
                <tr key={s.studentId} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{s.studentName}</td>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{s.enrollmentNumber}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['Present', 'Absent', 'Leave', 'Late'] as AttendanceStatus[]).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const active = s.status === st;
                        return (
                          <button key={st} onClick={() => setStatus(s.studentId, st)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                              ${active ? `${cfg.bg} ${cfg.text} ring-2 ${cfg.ring}` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {cfg.icon} {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      placeholder="Optional remark…"
                      value={s.remarks}
                      onChange={e => setRemarks(s.studentId, e.target.value)}
                      className="w-full max-w-xs rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
