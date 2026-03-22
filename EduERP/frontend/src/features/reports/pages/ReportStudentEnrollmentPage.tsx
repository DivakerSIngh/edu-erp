import { useState, useEffect, useMemo } from 'react';
import { UsersIcon, ArrowDownTrayIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { reportService }      from '../services/reportService';
import { exportToExcel }      from '../utils/exportExcel';
import type { StudentStrengthItem } from '../types/report.types';
import { admissionService }   from '../../admission/services/admissionService';
import type { AcademicYear }  from '../../admission/types/admission.types';

// Grouped view: class → section → [male, female, other]
interface StrengthRow {
  className:    string;
  sectionName:  string;
  male:         number;
  female:       number;
  other:        number;
  total:        number;
}

function buildRows(items: StudentStrengthItem[]): StrengthRow[] {
  const map = new Map<string, StrengthRow>();
  for (const item of items) {
    const key = `${item.className}|${item.sectionName}`;
    if (!map.has(key)) {
      map.set(key, { className: item.className, sectionName: item.sectionName, male: 0, female: 0, other: 0, total: 0 });
    }
    const row = map.get(key)!;
    const g   = item.gender?.toLowerCase();
    if (g === 'male')        row.male   += item.studentCount;
    else if (g === 'female') row.female += item.studentCount;
    else                     row.other  += item.studentCount;
    row.total += item.studentCount;
  }
  return Array.from(map.values());
}

export default function ReportStudentEnrollmentPage() {
  const [years,    setYears]    = useState<AcademicYear[]>([]);
  const [yearId,   setYearId]   = useState<number | ''>('');
  const [data,     setData]     = useState<StudentStrengthItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    admissionService.getAcademicYears().then(res => {
      if (res.isSuccess) setYears(res.data);
    }).catch(() => {});
  }, []);

  const rows = useMemo(() => buildRows(data), [data]);

  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({ male: acc.male + r.male, female: acc.female + r.female, other: acc.other + r.other, total: acc.total + r.total }),
    { male: 0, female: 0, other: 0, total: 0 }
  ), [rows]);

  const handleFetch = async () => {
    setLoading(true); setError('');
    try {
      const res = await reportService.getStudentStrength(yearId !== '' ? yearId : undefined);
      setData(res);
      setFetched(true);
    } catch { setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    const exportData = rows.map(r => ({
      Class: r.className, Section: r.sectionName,
      Male: r.male, Female: r.female, Other: r.other, Total: r.total,
    }));
    exportToExcel(exportData, 'student_enrollment_report', 'Enrollment');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Summary</h1>
          <p className="text-sm text-gray-500 mt-0.5">Student count by class, section and gender</p>
        </div>
        {fetched && rows.length > 0 && (
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
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
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
            <select value={yearId} onChange={e => setYearId(e.target.value ? +e.target.value : '')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52">
              <option value="">All Years</option>
              {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
            </select>
          </div>
          <button onClick={handleFetch} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <UsersIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View Report'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Summary cards */}
      {fetched && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: totals.total, color: 'text-blue-600' },
            { label: 'Male',           value: totals.male,   color: 'text-indigo-600' },
            { label: 'Female',         value: totals.female, color: 'text-pink-600' },
            { label: 'Other',          value: totals.other,  color: 'text-gray-600' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {fetched && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No enrollment data found.
        </div>
      )}
      {fetched && rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Class','Section','Male','Female','Other','Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.className}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.sectionName}</td>
                  <td className="px-4 py-3 text-sm text-indigo-700 font-medium">{r.male}</td>
                  <td className="px-4 py-3 text-sm text-pink-700 font-medium">{r.female}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.other}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{r.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-sm font-bold text-indigo-700">{totals.male}</td>
                <td className="px-4 py-3 text-sm font-bold text-pink-700">{totals.female}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-700">{totals.other}</td>
                <td className="px-4 py-3 text-sm font-bold text-blue-700">{totals.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
