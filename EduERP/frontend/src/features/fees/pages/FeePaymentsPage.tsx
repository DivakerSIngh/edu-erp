import { useEffect, useState, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Spinner from '../../../components/ui/Spinner';
import { feeService } from '../services/feeService';
import { admissionService } from '../../admission/services/admissionService';
import type { FeesSummary, Defaulter } from '../types/fee.types';
import type { AcademicYear } from '../../admission/types/admission.types';

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:   string;
  value:   string;
  sub?:    string;
  color:   'green' | 'amber' | 'red' | 'blue';
  icon:    React.ReactNode;
}

const cardColors: Record<StatCardProps['color'], { bg: string; icon: string; value: string }> = {
  green: { bg: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600',  value: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50  border-amber-100',   icon: 'text-amber-500',    value: 'text-amber-700'   },
  red:   { bg: 'bg-red-50    border-red-100',      icon: 'text-red-500',      value: 'text-red-700'     },
  blue:  { bg: 'bg-blue-50   border-blue-100',     icon: 'text-blue-500',     value: 'text-blue-700'    },
};

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  const c = cardColors[color];
  return (
    <div className={clsx('rounded-xl border p-5 flex items-start gap-4', c.bg)}>
      <div className={clsx('mt-0.5', c.icon)}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={clsx('text-2xl font-bold mt-0.5', c.value)}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FeePaymentsPage() {
  const [years, setYears]             = useState<AcademicYear[]>([]);
  const [filterYear, setFilterYear]   = useState<number | ''>('');
  const [asOfDate, setAsOfDate]       = useState('');

  const [summary, setSummary]         = useState<FeesSummary | null>(null);
  const [defaulters, setDefaulters]   = useState<Defaulter[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // ── Load academic years ───────────────────────────────────────────────────
  useEffect(() => {
    admissionService.getAcademicYears()
      .then(res => {
        if (res.isSuccess || res.success) {
          setYears(res.data);
          const current = res.data.find(y => y.isCurrent);
          if (current) setFilterYear(current.academicYearId);
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch summary + defaulters ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, defRes] = await Promise.all([
        feeService.getSummary(filterYear || undefined),
        feeService.getDefaulters({
          academicYearId: filterYear || undefined,
          asOfDate:       asOfDate   || undefined,
        }),
      ]);

      if (sumRes.isSuccess) setSummary(sumRes.data);
      else setError(sumRes.message ?? 'Failed to load summary.');

      if (defRes.isSuccess) setDefaulters(defRes.data);
    } catch {
      setError('Failed to load financial overview.');
    } finally {
      setLoading(false);
    }
  }, [filterYear, asOfDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fee collection summary and defaulters report</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Academic Years</option>
          {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Overdue as of:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <div className="py-12 text-center text-red-600">{error}</div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Collected"
                value={fmt(summary.totalCollected)}
                sub={`${summary.paidInvoices} paid invoices`}
                color="green"
                icon={<CurrencyDollarIcon className="h-7 w-7" />}
              />
              <StatCard
                label="Total Pending"
                value={fmt(summary.totalPending)}
                sub={`${summary.pendingInvoices + summary.partialInvoices} invoices`}
                color="amber"
                icon={<ClockIcon className="h-7 w-7" />}
              />
              <StatCard
                label="Total Overdue"
                value={fmt(summary.totalOverdue)}
                sub={`${summary.overdueInvoices} overdue invoices`}
                color="red"
                icon={<ExclamationTriangleIcon className="h-7 w-7" />}
              />
              <StatCard
                label="Total Invoices"
                value={String(summary.totalInvoices)}
                sub={`Partial: ${summary.partialInvoices}`}
                color="blue"
                icon={<DocumentTextIcon className="h-7 w-7" />}
              />
            </div>
          )}

          {/* Defaulters */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Defaulters
              {defaulters.length > 0 && (
                <span className="ml-2 text-sm font-normal text-red-600">
                  ({defaulters.length} student{defaulters.length !== 1 ? 's' : ''})
                </span>
              )}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {defaulters.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                  <ExclamationTriangleIcon className="h-9 w-9" />
                  <p>No defaulters found for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Student', 'Enrollment #', 'Class', 'Section', 'Contact', 'Overdue Count', 'Amount Due', 'Oldest Due'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {defaulters.map(d => (
                        <tr key={d.studentId} className="hover:bg-red-50/40 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.studentName}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-600">{d.enrollmentNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{d.className}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{d.sectionName}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {d.phone ?? d.email ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              {d.overdueCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-red-700">{fmt(d.totalDue)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{d.oldestDueDate.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
