import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MagnifyingGlassIcon,
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Spinner from '../../../components/ui/Spinner';
import { feeService } from '../services/feeService';
import { admissionService } from '../../admission/services/admissionService';
import { useAuth } from '../../../hooks/useAuth';
import type { FeeInvoiceListItem, FeeStatus, PaymentMethod } from '../types/fee.types';
import type { AcademicYear } from '../../admission/types/admission.types';

// ── Status badge ──────────────────────────────────────────────────────────────

const statusStyle: Record<FeeStatus, string> = {
  Pending:        'bg-amber-100 text-amber-800',
  Paid:           'bg-emerald-100 text-emerald-800',
  PartiallyPaid:  'bg-blue-100 text-blue-800',
  Overdue:        'bg-red-100 text-red-800',
  Waived:         'bg-gray-100 text-gray-600',
};

function StatusBadge({ status }: { status: FeeStatus }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusStyle[status])}>
      {status === 'PartiallyPaid' ? 'Partial' : status}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── Record Payment schema ─────────────────────────────────────────────────────

const MANUAL_METHODS = ['Cash', 'BankTransfer', 'Card', 'Cheque'] as const;

const paySchema = z.object({
  amountPaid:           z.coerce.number().min(1, 'Amount must be > 0'),
  paymentMethod:        z.enum(MANUAL_METHODS),
  transactionReference: z.string().min(1, 'Reference is required'),
});

type PayFormData = z.infer<typeof paySchema>;

// ── Generate invoices schema ──────────────────────────────────────────────────

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' },  { value: 5, label: 'May' },       { value: 6, label: 'June' },
  { value: 7, label: 'July' },   { value: 8, label: 'August' },    { value: 9, label: 'September' },
  { value: 10, label: 'October' },{ value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const genSchema = z.object({
  academicYearId: z.coerce.number().min(1, 'Academic year is required'),
  month:          z.coerce.number().min(1).max(12),
  year:           z.coerce.number().min(2020).max(2099),
});

type GenFormData = z.infer<typeof genSchema>;

// ── Main Page ─────────────────────────────────────────────────────────────────

const ALL_STATUSES: (FeeStatus | '')[] = ['', 'Pending', 'Paid', 'PartiallyPaid', 'Overdue', 'Waived'];

export default function FeeInvoicesPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('Admin');

  const [invoices, setInvoices]       = useState<FeeInvoiceListItem[]>([]);
  const [years, setYears]             = useState<AcademicYear[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // search / filter
  const [studentIdInput, setStudentIdInput] = useState('');
  const [activeStudentId, setActiveStudentId] = useState<number | null>(
    isAdmin ? null : (user as { studentId?: number })?.studentId ?? null
  );
  const [statusFilter, setStatusFilter] = useState<FeeStatus | ''>('');

  // modals
  const [payTarget, setPayTarget]         = useState<FeeInvoiceListItem | null>(null);
  const [showGenerate, setShowGenerate]   = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [actionError, setActionError]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);

  // ── Forms ────────────────────────────────────────────────────────────────
  const payForm = useForm<PayFormData>({
    resolver: zodResolver(paySchema),
    defaultValues: { paymentMethod: 'Cash', transactionReference: '' },
  });

  const now = new Date();
  const genForm = useForm<GenFormData>({
    resolver: zodResolver(genSchema),
    defaultValues: { month: now.getMonth() + 1, year: now.getFullYear() },
  });

  // ── Load academic years ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    admissionService.getAcademicYears()
      .then(res => { if (res.isSuccess || res.success) setYears(res.data); })
      .catch(() => {});
  }, [isAdmin]);

  // ── Load own invoices for non-admin ───────────────────────────────────────
  useEffect(() => {
    if (!isAdmin && activeStudentId) fetchInvoices(activeStudentId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch invoices ────────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async (sid: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await feeService.getStudentInvoices(sid, statusFilter || undefined);
      if (res.isSuccess) setInvoices(res.data);
      else setError(res.message ?? 'Failed to load invoices.');
    } catch {
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const handleSearch = () => {
    const sid = parseInt(studentIdInput, 10);
    if (!isNaN(sid) && sid > 0) {
      setActiveStudentId(sid);
      fetchInvoices(sid);
    }
  };

  // Re-fetch when status filter changes (if there's an active student)
  useEffect(() => {
    if (activeStudentId) fetchInvoices(activeStudentId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // ── Record payment ────────────────────────────────────────────────────────
  const handleRecordPayment = async (values: PayFormData) => {
    if (!payTarget) return;
    setActionError(null);
    try {
      const res = await feeService.recordPayment(payTarget.invoiceId, {
        amountPaid:           values.amountPaid,
        paymentMethod:        values.paymentMethod as Exclude<PaymentMethod, 'OnlinePortal'>,
        transactionReference: values.transactionReference,
      });
      if (res.isSuccess) {
        setPayTarget(null);
        setSuccessMsg(`Payment recorded — Receipt: ${res.data.receiptNumber}`);
        if (activeStudentId) fetchInvoices(activeStudentId);
      } else {
        setActionError(res.message ?? 'Could not record payment.');
      }
    } catch {
      setActionError('Could not record payment.');
    }
  };

  // ── Stripe checkout ───────────────────────────────────────────────────────
  const handleCheckout = async (invoice: FeeInvoiceListItem) => {
    setCheckoutLoading(invoice.invoiceId);
    setActionError(null);
    try {
      const res = await feeService.initiateCheckout(invoice.invoiceId);
      if (res.isSuccess) {
        window.open(res.data.checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        setActionError(res.message ?? 'Could not initiate checkout. Ensure Stripe is configured.');
      }
    } catch {
      setActionError('Could not initiate checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  // ── Generate invoices ─────────────────────────────────────────────────────
  const handleGenerate = async (values: GenFormData) => {
    setActionError(null);
    try {
      const res = await feeService.generateInvoices(values.academicYearId, values.month, values.year);
      if (res.isSuccess) {
        setShowGenerate(false);
        genForm.reset();
        setSuccessMsg(`${res.data.invoicesCreated} invoice(s) generated.`);
      } else {
        setActionError(res.message ?? 'Could not generate invoices.');
      }
    } catch {
      setActionError('Could not generate invoices.');
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

  const canPay = (inv: FeeInvoiceListItem) =>
    inv.status === 'Pending' || inv.status === 'PartiallyPaid' || inv.status === 'Overdue';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">View invoices, record payments, and initiate online checkout</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowGenerate(true); setActionError(null); genForm.reset(); }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <SparklesIcon className="h-4 w-4" />
            Generate Invoices
          </button>
        )}
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-sm text-emerald-700">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                placeholder="Student ID…"
                value={studentIdInput}
                onChange={e => setStudentIdInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9 pr-3 py-2 border rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                type="number"
                min={1}
              />
            </div>
            <button onClick={handleSearch} className="px-3 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700">
              Search
            </button>
          </div>
        )}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as FeeStatus | '')}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s === '' ? 'All Statuses' : s === 'PartiallyPaid' ? 'Partially Paid' : s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {!activeStudentId && isAdmin ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <DocumentTextIcon className="h-10 w-10" />
            <p>Enter a Student ID above to view invoices.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Invoice #', 'Fee Type', 'Month', 'Due Date', 'Total', 'Paid', 'Balance', 'Status', 'Receipt', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv.invoiceId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{inv.feeType}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inv.invoiceMonth ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inv.dueDate.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-700">{fmt(inv.paidAmount)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-700">{fmt(inv.balanceAmount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{inv.receiptNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      {canPay(inv) && (
                        <div className="flex gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => { setPayTarget(inv); setActionError(null); payForm.reset({ paymentMethod: 'Cash', transactionReference: '', amountPaid: inv.balanceAmount }); }}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                              title="Record manual payment"
                            >
                              <BanknotesIcon className="h-3.5 w-3.5" />
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => handleCheckout(inv)}
                            disabled={checkoutLoading === inv.invoiceId}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                            title="Pay online via Stripe"
                          >
                            {checkoutLoading === inv.invoiceId ? (
                              <span>…</span>
                            ) : (
                              <>
                                <CreditCardIcon className="h-3.5 w-3.5" />
                                Online
                                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Record Payment Modal ─────────────────────────────────────────────── */}
      {payTarget && (
        <Modal title={`Collect Payment — ${payTarget.invoiceNumber}`} onClose={() => setPayTarget(null)}>
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold">{fmt(payTarget.totalAmount)}</span>
            <span className="text-gray-500">Paid</span>
            <span className="text-emerald-700">{fmt(payTarget.paidAmount)}</span>
            <span className="text-gray-500">Balance</span>
            <span className="font-semibold text-red-700">{fmt(payTarget.balanceAmount)}</span>
          </div>
          <form onSubmit={payForm.handleSubmit(handleRecordPayment)} className="space-y-4">
            {actionError && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{actionError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
              <input type="number" min={1} step={1} {...payForm.register('amountPaid')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {payForm.formState.errors.amountPaid && <p className="text-xs text-red-500 mt-1">{payForm.formState.errors.amountPaid.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select {...payForm.register('paymentMethod')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {MANUAL_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Receipt</label>
              <input {...payForm.register('transactionReference')} placeholder="Voucher or cheque number…" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {payForm.formState.errors.transactionReference && <p className="text-xs text-red-500 mt-1">{payForm.formState.errors.transactionReference.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={() => setPayTarget(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                Record Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Generate Invoices Modal ──────────────────────────────────────────── */}
      {showGenerate && (
        <Modal title="Generate Monthly Invoices" onClose={() => setShowGenerate(false)}>
          <p className="text-sm text-gray-600 mb-4">
            This will create invoices for all active students based on their class fee structures for the selected academic year.
          </p>
          <form onSubmit={genForm.handleSubmit(handleGenerate)} className="space-y-4">
            {actionError && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{actionError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select {...genForm.register('academicYearId')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">— Select —</option>
                  {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
                </select>
                {genForm.formState.errors.academicYearId && <p className="text-xs text-red-500 mt-1">{genForm.formState.errors.academicYearId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select {...genForm.register('month')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" min={2020} max={2099} {...genForm.register('year')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                Generate
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
