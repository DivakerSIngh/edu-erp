import { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { exportToExcel } from '../utils/exportExcel';
import { feeService }       from '../../fees/services/feeService';
import { admissionService } from '../../admission/services/admissionService';
import type { FeesSummary, Defaulter } from '../../fees/types/fee.types';
import type { AcademicYear }           from '../../admission/types/admission.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function currency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function CollectionBar({ summary }: { summary: FeesSummary }) {
  const total = summary.totalCollected + summary.totalPending;
  const pct   = total > 0 ? Math.round((summary.totalCollected / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Collection progress</span>
        <span className="font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ReportFeesPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState<number>(0);
  const [summary,   setSummary]   = useState<FeesSummary | null>(null);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [fetched,   setFetched]   = useState(false);

  useEffect(() => {
    admissionService.getAcademicYears().then(res => {
      if (res.isSuccess && res.data.length > 0) {
        setAcademicYears(res.data);
        const current = res.data.find(y => y.isCurrent) ?? res.data[0];
        setAcademicYearId(current.academicYearId);
      }
    });
  }, []);

  const load = async () => {
    if (!academicYearId) return;
    setLoading(true);
    try {
      const [summRes, defRes] = await Promise.all([
        feeService.getSummary(academicYearId),
        feeService.getDefaulters({ academicYearId }),
      ]);
      if (summRes.isSuccess) setSummary(summRes.data);
      if (defRes.isSuccess)  setDefaulters(defRes.data);
      setFetched(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <BanknotesIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Fees Report</h1>
          <p className="text-sm text-gray-500">Fee collection summary and defaulters list</p>
        </div>
        {fetched && defaulters.length > 0 && (
          <button
            onClick={() =>
              exportToExcel(
                defaulters.map(d => ({
                  Student:           d.studentName,
                  Enrollment:        d.enrollmentNumber,
                  Class:             d.className,
                  'Overdue Invoices': d.overdueCount,
                  'Total Due (INR)': d.totalDue,
                  'Oldest Due Date': d.oldestDueDate,
                })) as Record<string, unknown>[],
                'fee_defaulters',
                'Defaulters',
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
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Academic Year</label>
          <select value={academicYearId} onChange={e => setAcademicYearId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]">
            {academicYears.map(y => (
              <option key={y.academicYearId} value={y.academicYearId}>
                {y.yearName}{y.isCurrent ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button onClick={load} disabled={loading || !academicYearId}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors">
          {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <BanknotesIcon className="h-4 w-4" />}
          {loading ? 'Loading…' : 'View Report'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {!fetched && !loading && (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400">
            <BanknotesIcon className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-semibold text-base text-gray-500">Select an academic year and click "View Report"</p>
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

        {fetched && !loading && summary && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Collected', val: currency(summary.totalCollected), icon: <CheckCircleIcon className="h-5 w-5" />, color: 'text-emerald-700 bg-emerald-50' },
                { label: 'Pending',         val: currency(summary.totalPending),   icon: <ClockIcon className="h-5 w-5" />,       color: 'text-amber-700 bg-amber-50' },
                { label: 'Overdue',         val: currency(summary.totalOverdue),   icon: <ExclamationTriangleIcon className="h-5 w-5" />, color: 'text-red-700 bg-red-50' },
                { label: 'Total Invoices',  val: summary.totalInvoices,            icon: <BanknotesIcon className="h-5 w-5" />,   color: 'text-indigo-600 bg-indigo-50' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.color}`}>{item.icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{item.val}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice status breakdown + progress bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Invoice Breakdown</h2>
              <CollectionBar summary={summary} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { label: 'Paid',         val: summary.paidInvoices,    color: 'bg-emerald-100 text-emerald-800' },
                  { label: 'Pending',      val: summary.pendingInvoices, color: 'bg-amber-100 text-amber-800' },
                  { label: 'Partial',      val: summary.partialInvoices, color: 'bg-blue-100 text-blue-800' },
                  { label: 'Overdue',      val: summary.overdueInvoices, color: 'bg-red-100 text-red-700' },
                ].map(item => (
                  <div key={item.label} className={`rounded-xl px-4 py-3 ${item.color}`}>
                    <div className="text-2xl font-bold">{item.val}</div>
                    <div className="text-xs font-medium mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defaulters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Fee Defaulters</h2>
                {defaulters.length > 0 && (
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">
                    {defaulters.length} defaulter{defaulters.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {defaulters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <CheckCircleIcon className="h-10 w-10 mb-2 opacity-40" />
                  <p className="font-medium text-sm">No defaulters — all dues are cleared!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-8">#</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Enroll No.</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Overdue Invoices</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-red-600">Total Due</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Oldest Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {defaulters.map((d, idx) => (
                        <tr key={d.studentId} className="hover:bg-red-50 transition-colors">
                          <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="px-6 py-3">
                            <div className="font-medium text-gray-900">{d.studentName}</div>
                            {d.email && <div className="text-xs text-gray-400">{d.email}</div>}
                          </td>
                          <td className="px-6 py-3 text-gray-500 font-mono text-xs">{d.enrollmentNumber}</td>
                          <td className="px-6 py-3 text-gray-600">{d.className} — {d.sectionName}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              {d.overdueCount}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-red-700">{currency(d.totalDue)}</td>
                          <td className="px-6 py-3 text-center text-gray-500 text-xs">{d.oldestDueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

