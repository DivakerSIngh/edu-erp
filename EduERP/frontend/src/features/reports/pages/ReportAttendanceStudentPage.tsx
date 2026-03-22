import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CalendarDaysIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowPathIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { attendanceService } from '../../attendance/services/attendanceService';
import { exportToExcel }     from '../utils/exportExcel';
import type { StudentAttendanceResponse } from '../../attendance/types/attendance.types';
import apiClient from '../../../services/api/axiosInstance';

interface StudentOption { studentId: number; studentName: string; enrollmentNumber: string; }
interface ApiPage<T> { isSuccess: boolean; data: { items: T[] }; }

const STATUS_BADGE: Record<string, string> = {
  Present: 'bg-emerald-100 text-emerald-800',
  Absent:  'bg-red-100 text-red-800',
  Late:    'bg-yellow-100 text-yellow-800',
  Leave:   'bg-blue-100 text-blue-800',
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthStartStr() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function ReportAttendanceStudentPage() {
  const [query,     setQuery]     = useState('');
  const [options,   setOptions]   = useState<StudentOption[]>([]);
  const [selected,  setSelected]  = useState<StudentOption | null>(null);
  const [showDrop,  setShowDrop]  = useState(false);
  const [searching, setSearching] = useState(false);

  const [fromDate, setFromDate] = useState(monthStartStr());
  const [toDate,   setToDate]   = useState(todayStr());

  const [result,  setResult]  = useState<StudentAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error,   setError]   = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchStudents = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setOptions([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await apiClient.get<ApiPage<StudentOption>>('/students', {
          params: { searchTerm: q, pageSize: 10 },
        });
        const items = data.isSuccess ? (data.data?.items ?? []) : [];
        setOptions(items);
        setShowDrop(items.length > 0);
      } catch { setOptions([]); setShowDrop(false); }
      finally  { setSearching(false); }
    }, 350);
  }, []);

  useEffect(() => { searchStudents(query); }, [query, searchStudents]);

  const selectStudent = (s: StudentOption) => {
    setSelected(s); setQuery(s.studentName); setShowDrop(false); setResult(null); setFetched(false);
  };

  const clearStudent = () => { setSelected(null); setQuery(''); setOptions([]); setResult(null); setFetched(false); };

  const handleFetch = async () => {
    if (!selected) { setError('Please select a student.'); return; }
    if (!fromDate || !toDate) { setError('Please select a date range.'); return; }
    setLoading(true); setError('');
    try {
      const res = await attendanceService.getByStudent(selected.studentId, fromDate, toDate);
      if (res.isSuccess) { setResult(res.data); setFetched(true); }
      else               { setError(res.message || 'Failed to load data.'); }
    } catch { setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    if (!result || !selected) return;
    const rows = result.details.map(d => ({
      Student: selected.studentName, Enrollment: selected.enrollmentNumber,
      Date: d.attendanceDate, Period: d.period, Subject: d.subjectName ?? '',
      Status: d.status, Remarks: d.remarks ?? '',
    }));
    exportToExcel(rows as Record<string, unknown>[], `attendance_${selected.enrollmentNumber}`, 'Attendance');
  };

  const summary = result?.summary;
  const pct     = summary?.attendancePercentage ?? 0;
  const pctColor = pct >= 75 ? 'text-emerald-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const barColor = pct >= 75 ? 'bg-emerald-500'   : pct >= 60 ? 'bg-yellow-500'   : 'bg-red-500';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Attendance Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Day-by-day attendance for a specific student</p>
        </div>
        {fetched && result && result.details.length > 0 && (
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export to Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Student search */}
          <div className="flex-1 min-w-[220px] relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">Student *</label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input value={query} onChange={e => { setQuery(e.target.value); if (selected) setSelected(null); }}
                onFocus={() => options.length > 0 && setShowDrop(true)}
                placeholder="Search by name or enrollment…"
                className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {selected && (
                <button onClick={clearStudent} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
              {searching && <ArrowPathIcon className="w-4 h-4 text-blue-400 animate-spin absolute right-2.5 top-2.5" />}
            </div>
            {showDrop && (
              <div className="absolute left-0 top-full mt-1 z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {options.map(s => (
                  <button key={s.studentId} onClick={() => selectStudent(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm">
                    <span className="font-medium text-gray-900">{s.studentName}</span>
                    <span className="ml-2 text-gray-400 text-xs">{s.enrollmentNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input type="date" value={fromDate} max={toDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input type="date" value={toDate} min={fromDate} max={todayStr()}
              onChange={e => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button onClick={handleFetch} disabled={loading || !selected}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CalendarDaysIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View Report'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Summary cards */}
      {fetched && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Days',  value: summary.totalDays,            color: 'text-gray-900' },
            { label: 'Present',     value: summary.presentDays,          color: 'text-emerald-700' },
            { label: 'Absent',      value: summary.absentDays,           color: 'text-red-700' },
            { label: 'Late',        value: summary.lateDays,             color: 'text-yellow-700' },
            { label: 'Leave',       value: summary.leaveDays,            color: 'text-blue-700' },
            { label: 'Percentage',  value: `${pct.toFixed(1)}%`,         color: pctColor },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance bar */}
      {fetched && summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Overall attendance percentage</span>
            <span className={`font-semibold ${pctColor}`}>{pct.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          {pct < 75 && (
            <p className="text-xs text-red-600 mt-2">⚠ Attendance is below the 75% required threshold.</p>
          )}
        </div>
      )}

      {fetched && result && result.details.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No attendance records found for the selected date range.
        </div>
      )}

      {fetched && result && result.details.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Attendance Records</span>
            <span className="text-sm text-gray-500">{result.details.length} record{result.details.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Period', 'Subject', 'Status', 'Remarks'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.details.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{d.attendanceDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.period}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.subjectName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[d.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.remarks ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
