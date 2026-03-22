import { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon, ArrowDownTrayIcon, FunnelIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { reportService }       from '../services/reportService';
import { exportToExcel }       from '../utils/exportExcel';
import { examinationService }  from '../../examination/services/examinationService';
import type { LowAttendanceStudent } from '../types/report.types';
import type { ClassItem }            from '../../examination/types/examination.types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pctColor(p: number) {
  if (p >= 60) return 'bg-yellow-100 text-yellow-800';
  if (p >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

export default function ReportLowAttendancePage() {
  const [classes,   setClasses]   = useState<ClassItem[]>([]);
  const [classId,   setClassId]   = useState<number>(0);
  const [month,     setMonth]     = useState(new Date().getMonth() + 1);
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [threshold, setThreshold] = useState(75);
  const [data,      setData]      = useState<LowAttendanceStudent[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [fetched,   setFetched]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    examinationService.getAllClasses().then(r => {
      if (r.isSuccess) setClasses(r.data);
    });
  }, []);

  const handleFetch = async () => {
    if (!classId) { setError('Please select a class.'); return; }
    setLoading(true); setError('');
    try {
      const res = await reportService.getLowAttendance({ classId, month, year, thresholdPct: threshold });
      setData(res);
      setFetched(true);
    } catch { setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    const rows = data.map(s => ({
      'Enrollment No': s.enrollmentNumber, Name: s.studentName,
      Class: s.className, Section: s.sectionName,
      'Present Days': s.presentDays, 'Late Days': s.lateDays,
      'Total Days': s.totalDays, 'Attendance %': s.attendancePct,
    }));
    exportToExcel(rows as Record<string, unknown>[], 'low_attendance_report', 'Low Attendance');
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Attendance Alert</h1>
          <p className="text-sm text-gray-500 mt-0.5">Students below the configured attendance threshold</p>
        </div>
        {fetched && data.length > 0 && (
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export to Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
            <select value={classId} onChange={e => setClassId(+e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44">
              <option value={0}>Select Class</option>
              {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Threshold %</label>
            <input type="number" min={1} max={99} value={threshold}
              onChange={e => setThreshold(Math.max(1, Math.min(99, +e.target.value)))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24" />
          </div>
          <button onClick={handleFetch} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ExclamationTriangleIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View Report'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Alert banner */}
      {fetched && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          data.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 ${data.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          <span className={`text-sm font-medium ${data.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {data.length > 0
              ? `${data.length} student${data.length > 1 ? 's' : ''} found with attendance below ${threshold}%`
              : `All students are above the ${threshold}% threshold — great attendance!`}
          </span>
        </div>
      )}

      {fetched && data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Enrollment','Name','Class','Section','Present','Late','Total','Attendance %'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(s => (
                <tr key={s.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{s.enrollmentNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.studentName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.className}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.sectionName}</td>
                  <td className="px-4 py-3 text-sm text-emerald-700 font-medium">{s.presentDays}</td>
                  <td className="px-4 py-3 text-sm text-yellow-700 font-medium">{s.lateDays}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.totalDays}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pctColor(s.attendancePct)}`}>
                      {s.attendancePct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
