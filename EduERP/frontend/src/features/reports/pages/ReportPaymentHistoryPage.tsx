import { useState, useEffect } from 'react';
import {
  CreditCardIcon, ArrowDownTrayIcon, FunnelIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { reportService }      from '../services/reportService';
import { exportToExcel }      from '../utils/exportExcel';
import { examinationService } from '../../examination/services/examinationService';
import type { PaymentHistoryItem, PaymentHistoryParams } from '../types/report.types';
import type { ClassItem } from '../../examination/types/examination.types';

function currency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function methodBadge(m: string) {
  const map: Record<string, string> = {
    Cash: 'bg-emerald-100 text-emerald-700',
    Card: 'bg-blue-100 text-blue-700',
    BankTransfer: 'bg-purple-100 text-purple-700',
    OnlinePortal: 'bg-indigo-100 text-indigo-700',
    Cheque: 'bg-amber-100 text-amber-700',
  };
  return map[m] ?? 'bg-gray-100 text-gray-700';
}

export default function ReportPaymentHistoryPage() {
  const [classes,  setClasses]  = useState<ClassItem[]>([]);
  const [params,   setParams]   = useState<PaymentHistoryParams>({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate:   new Date().toISOString().split('T')[0],
  });
  const [classId,  setClassId]  = useState<number | ''>('');
  const [data,     setData]     = useState<PaymentHistoryItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    examinationService.getAllClasses().then(r => {
      if (r.isSuccess) setClasses(r.data);
    });
  }, []);

  const total = data.reduce((s, p) => s + p.amountPaid, 0);

  const handleFetch = async () => {
    setLoading(true); setError('');
    try {
      const res = await reportService.getPaymentHistory({
        ...params,
        classId: classId !== '' ? classId : undefined,
      });
      setData(res);
      setFetched(true);
    } catch { setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    const rows = data.map(p => ({
      Receipt: p.receiptNumber, Date: p.paymentDate, Amount: p.amountPaid,
      Method: p.paymentMethod, Invoice: p.invoiceNumber, 'Fee Name': p.feeName,
      Student: p.studentName, Enrollment: p.enrollmentNumber,
      Class: p.className, Section: p.sectionName, 'Academic Year': p.academicYear,
    }));
    exportToExcel(rows as Record<string, unknown>[], 'payment_history_report', 'Payments');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fee payments in a date range</p>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input type="date" value={params.fromDate}
              onChange={e => setParams(p => ({ ...p, fromDate: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input type="date" value={params.toDate}
              onChange={e => setParams(p => ({ ...p, toDate: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value ? +e.target.value : '')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
            </select>
          </div>
          <button onClick={handleFetch} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CreditCardIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View Report'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Summary card */}
      {fetched && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Total Collected</div>
            <div className="text-2xl font-bold text-emerald-600">{currency(total)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Transactions</div>
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Period</div>
            <div className="text-sm font-semibold text-gray-700">{params.fromDate} → {params.toDate}</div>
          </div>
        </div>
      )}

      {fetched && data.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No payments found for the selected period.
        </div>
      )}
      {fetched && data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Receipt','Date','Student','Class','Fee Name','Amount','Method'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(p => (
                  <tr key={p.feePaymentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.paymentDate}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{p.studentName}</div>
                      <div className="text-xs text-gray-400">{p.enrollmentNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.className} {p.sectionName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.feeName}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-700">{currency(p.amountPaid)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${methodBadge(p.paymentMethod)}`}>
                        {p.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-700">{currency(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
