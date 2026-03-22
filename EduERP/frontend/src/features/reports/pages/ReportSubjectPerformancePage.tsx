import { useState, useEffect } from 'react';
import {
  ChartBarIcon, ArrowDownTrayIcon, FunnelIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { reportService }       from '../services/reportService';
import { exportToExcel }       from '../utils/exportExcel';
import { admissionService }    from '../../admission/services/admissionService';
import { examinationService }  from '../../examination/services/examinationService';
import type { SubjectPerformanceItem, SubjectPerformanceParams } from '../types/report.types';
import type { AcademicYear }   from '../../admission/types/admission.types';
import type { ClassItem }      from '../../examination/types/examination.types';

function passRateColor(r: number) {
  if (r >= 80) return 'text-emerald-600';
  if (r >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export default function ReportSubjectPerformancePage() {
  const [years,   setYears]   = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [params,  setParams]  = useState<SubjectPerformanceParams>({ academicYearId: 0 });
  const [data,    setData]    = useState<SubjectPerformanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    admissionService.getAcademicYears().then(r => {
      if (r.isSuccess) {
        setYears(r.data);
        const cur = r.data.find(y => y.isCurrent) ?? r.data[0];
        if (cur) setParams(p => ({ ...p, academicYearId: cur.academicYearId }));
      }
    });
    examinationService.getAllClasses().then(r => {
      if (r.isSuccess) setClasses(r.data);
    });
  }, []);

  const handleFetch = async () => {
    if (!params.academicYearId) { setError('Please select an academic year.'); return; }
    setLoading(true); setError('');
    try {
      const res = await reportService.getSubjectPerformance(params);
      setData(res);
      setFetched(true);
    } catch { setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    const rows = data.map(s => ({
      Subject: s.subjectName, Code: s.subjectCode, Class: s.className,
      'Total Students': s.totalStudents, 'Avg Marks': s.avgMarks, 'Max Marks': s.maxMarks,
      'Avg %': s.avgPct, Passed: s.passCount, Failed: s.failCount, 'Pass Rate %': s.passRate,
    }));
    exportToExcel(rows as Record<string, unknown>[], 'subject_performance_report', 'Subject Performance');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Performance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Average marks and pass rates by subject across classes</p>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year <span className="text-red-500">*</span></label>
            <select value={params.academicYearId}
              onChange={e => setParams(p => ({ ...p, academicYearId: +e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44">
              <option value={0}>Select Year</option>
              {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select value={params.classId ?? ''}
              onChange={e => setParams(p => ({ ...p, classId: e.target.value ? +e.target.value : undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
            </select>
          </div>
          <button onClick={handleFetch} disabled={loading || !params.academicYearId}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ChartBarIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View Report'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {fetched && data.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No published exam results found for the selected filters.
        </div>
      )}

      {fetched && data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Subject','Code','Class','Students','Avg Marks','Max','Avg %','Passed','Failed','Pass Rate'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.subjectName}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">{s.subjectCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.className}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.totalStudents}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{s.avgMarks}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.maxMarks}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.avgPct}%` }} />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{s.avgPct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-700 font-medium">{s.passCount}</td>
                    <td className="px-4 py-3 text-sm text-red-700 font-medium">{s.failCount}</td>
                    <td className="px-4 py-3 text-sm font-bold">
                      <span className={passRateColor(s.passRate)}>{s.passRate.toFixed(1)}%</span>
                    </td>
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
