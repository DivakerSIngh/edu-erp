import { useState, useEffect } from 'react';
import {
  ClipboardDocumentListIcon, ArrowDownTrayIcon, FunnelIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { reportService }    from '../services/reportService';
import { exportToExcel }    from '../utils/exportExcel';
import { admissionService } from '../../admission/services/admissionService';
import type { AdmissionStatItem } from '../types/report.types';
import type { AcademicYear }      from '../../admission/types/admission.types';

const STATUS_COLORS: Record<string, string> = {
  Pending:  'bg-yellow-100 text-yellow-800',
  Reviewed: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
  Enrolled: 'bg-purple-100 text-purple-800',
};

export default function ReportAdmissionPage() {
  const [years,   setYears]   = useState<AcademicYear[]>([]);
  const [yearId,  setYearId]  = useState<number | ''>('');
  const [data,    setData]    = useState<AdmissionStatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    admissionService.getAcademicYears().then(r => {
      if (r.isSuccess) {
        setYears(r.data);
        const cur = r.data.find(y => y.isCurrent);
        if (cur) setYearId(cur.academicYearId);
      }
    });
  }, []);

  const handleFetch = async () => {
    setLoading(true); setError('');
    try {
      const res = await reportService.getAdmissionStats(yearId !== '' ? yearId : undefined);
      setData(res);
      setFetched(true);
    } catch { setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    const rows = data.map(d => ({
      'Academic Year': d.yearName, Status: d.status,
      Applications: d.applicationCount, Converted: d.convertedCount,
      'Conversion Rate %': d.applicationCount > 0
        ? ((d.convertedCount / d.applicationCount) * 100).toFixed(1) : '0.0',
    }));
    exportToExcel(rows as Record<string, unknown>[], 'admission_report', 'Admissions');
  };

  // Group by academic year
  const grouped = data.reduce((acc, d) => {
    if (!acc[d.yearName]) acc[d.yearName] = [];
    acc[d.yearName].push(d);
    return acc;
  }, {} as Record<string, AdmissionStatItem[]>);

  const totalByYear = (items: AdmissionStatItem[]) =>
    items.reduce((s, i) => ({ total: s.total + i.applicationCount, converted: s.converted + i.convertedCount }),
      { total: 0, converted: 0 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admissions Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Application counts by status and conversion rate</p>
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
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
            <select value={yearId} onChange={e => setYearId(e.target.value ? +e.target.value : '')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48">
              <option value="">All Years</option>
              {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
            </select>
          </div>
          <button onClick={handleFetch} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ClipboardDocumentListIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View Report'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {fetched && data.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No admission data found.
        </div>
      )}

      {fetched && Object.entries(grouped).map(([yearName, items]) => {
        const { total, converted } = totalByYear(items);
        const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
        return (
          <div key={yearName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-900">{yearName}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">Total: <strong className="text-gray-900">{total}</strong></span>
                <span className="text-gray-600">Enrolled: <strong className="text-emerald-700">{converted}</strong></span>
                <span className="text-gray-600">Conversion Rate: <strong className="text-blue-700">{convRate}%</strong></span>
              </div>
            </div>

            {/* Bar chart visual */}
            <div className="px-5 py-3 flex gap-3 flex-wrap border-b border-gray-100">
              {items.map(item => (
                <div key={item.status} className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {item.status}: {item.applicationCount}
                  </span>
                </div>
              ))}
            </div>

            {/* Conversion bar */}
            <div className="px-5 py-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Conversion rate (applications → enrolled)</span>
                <span className="font-semibold text-gray-700">{convRate}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${convRate}%` }} />
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Status','Applications','Converted','Conversion Rate'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.status} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.applicationCount}</td>
                    <td className="px-4 py-3 text-sm text-emerald-700 font-medium">{item.convertedCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.applicationCount > 0
                        ? `${((item.convertedCount / item.applicationCount) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
