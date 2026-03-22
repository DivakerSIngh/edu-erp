import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Spinner from '../../../components/ui/Spinner';
import { feeService } from '../services/feeService';
import { admissionService } from '../../admission/services/admissionService';
import type { FeeStructure, FeeFrequency } from '../types/fee.types';
import type { AcademicYear, ClassOption } from '../../admission/types/admission.types';

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const FREQUENCIES: FeeFrequency[] = ['Monthly', 'Quarterly', 'Annual', 'OneTime'];

const createSchema = z.object({
  feeName:        z.string().min(1, 'Name is required'),
  academicYearId: z.coerce.number().min(1, 'Academic year is required'),
  classId:        z.coerce.number().nullable().optional(),
  amount:         z.coerce.number().min(1, 'Amount must be > 0'),
  isRecurring:    z.boolean(),
  frequency:      z.enum(['Monthly', 'Quarterly', 'Annual', 'OneTime']).nullable().optional(),
  dueDate:        z.string().nullable().optional(),
});

const editSchema = z.object({
  feeName:     z.string().min(1, 'Name is required'),
  amount:      z.coerce.number().min(1, 'Amount must be > 0'),
  isRecurring: z.boolean(),
  frequency:   z.enum(['Monthly', 'Quarterly', 'Annual', 'OneTime']).nullable().optional(),
  dueDate:     z.string().nullable().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData   = z.infer<typeof editSchema>;

// ── Badge ─────────────────────────────────────────────────────────────────────

const freqColors: Record<FeeFrequency, string> = {
  Monthly:   'bg-blue-100 text-blue-800',
  Quarterly: 'bg-purple-100 text-purple-800',
  Annual:    'bg-indigo-100 text-indigo-800',
  OneTime:   'bg-gray-100 text-gray-800',
};

function FrequencyBadge({ freq }: { freq: FeeFrequency | null }) {
  if (!freq) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', freqColors[freq])}>
      {freq}
    </span>
  );
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [years, setYears]           = useState<AcademicYear[]>([]);
  const [classes, setClasses]       = useState<ClassOption[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [filterYear, setFilterYear]   = useState<number | ''>('');
  const [filterClass, setFilterClass] = useState<number | ''>('');
  const [search, setSearch]           = useState('');

  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<FeeStructure | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeStructure | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [actionError, setActionError]   = useState<string | null>(null);

  // Classes loaded specifically for the Create modal (tracks form's academicYearId)
  const [createFormClasses, setCreateFormClasses] = useState<ClassOption[]>([]);

  // ── Form: Create ──────────────────────────────────────────────────────────
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { isRecurring: true, frequency: 'Monthly', classId: null, dueDate: null },
  });
  const createIsRecurring = createForm.watch('isRecurring');
  const createFormYearId  = createForm.watch('academicYearId');

  // ── Form: Edit ────────────────────────────────────────────────────────────
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });
  const editIsRecurring = editForm.watch('isRecurring');

  // ── Load lookups ──────────────────────────────────────────────────────────
  useEffect(() => {
    admissionService.getAcademicYears()
      .then(res => { if (res.isSuccess || res.success) setYears(res.data); })
      .catch(() => {});
  }, []);

  // Load classes for page-level filter
  useEffect(() => {
    if (!filterYear) { setClasses([]); setFilterClass(''); return; }
    admissionService.getClasses(filterYear as number)
      .then(res => { if (res.isSuccess || res.success) setClasses(res.data); })
      .catch(() => {});
  }, [filterYear]);

  // Load classes for Create modal based on form's selected academic year
  useEffect(() => {
    if (!createFormYearId) { setCreateFormClasses([]); return; }
    admissionService.getClasses(Number(createFormYearId))
      .then(res => { if (res.isSuccess || res.success) setCreateFormClasses(res.data); })
      .catch(() => {});
  }, [createFormYearId]);

  // ── Fetch structures ──────────────────────────────────────────────────────
  const fetchStructures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await feeService.getStructures({
        academicYearId: filterYear  || undefined,
        classId:        filterClass || undefined,
      });
      if (res.isSuccess) setStructures(res.data);
      else setError(res.message ?? 'Failed to load fee structures.');
    } catch {
      setError('Failed to load fee structures.');
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterClass]);

  useEffect(() => { fetchStructures(); }, [fetchStructures]);

  // ── Create handler ────────────────────────────────────────────────────────
  const handleCreate = async (values: CreateFormData) => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await feeService.createStructure({
        feeName:        values.feeName,
        academicYearId: values.academicYearId,
        classId:        values.classId ?? null,
        amount:         values.amount,
        isRecurring:    values.isRecurring,
        frequency:      values.isRecurring ? (values.frequency ?? null) : null,
        dueDate:        values.dueDate ?? null,
      });
      if (res.isSuccess) {
        setShowCreate(false);
        createForm.reset();
        fetchStructures();
      } else {
        setActionError(res.message ?? 'Could not create fee structure.');
      }
    } catch {
      setActionError('Could not create fee structure.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit handler ──────────────────────────────────────────────────────────
  const openEdit = (s: FeeStructure) => {
    setEditTarget(s);
    editForm.reset({
      feeName:     s.feeName,
      amount:      s.amount,
      isRecurring: s.isRecurring,
      frequency:   s.frequency ?? undefined,
      dueDate:     s.dueDate ?? undefined,
    });
    setActionError(null);
  };

  const handleEdit = async (values: EditFormData) => {
    if (!editTarget) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await feeService.updateStructure(editTarget.feeStructureId, {
        feeName:     values.feeName,
        amount:      values.amount,
        isRecurring: values.isRecurring,
        frequency:   values.isRecurring ? (values.frequency ?? null) : null,
        dueDate:     values.dueDate ?? null,
      });
      if (res.isSuccess) {
        setEditTarget(null);
        fetchStructures();
      } else {
        setActionError(res.message ?? 'Could not update fee structure.');
      }
    } catch {
      setActionError('Could not update fee structure.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await feeService.deleteStructure(deleteTarget.feeStructureId);
      if (res.isSuccess) {
        setDeleteTarget(null);
        fetchStructures();
      } else {
        setActionError(res.message ?? 'Could not delete fee structure.');
      }
    } catch {
      setActionError('Could not delete fee structure.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered display ──────────────────────────────────────────────────────
  const displayed = structures.filter(s =>
    s.feeName.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage fee categories, amounts, and schedules</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setActionError(null); createForm.reset({ isRecurring: true, frequency: 'Monthly' }); }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          New Structure
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search fee name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Academic Years</option>
          {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
        </select>
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value ? Number(e.target.value) : '')}
          disabled={!filterYear}
          className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">{error}</div>
        ) : displayed.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No fee structures found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Fee Name', 'Academic Year', 'Class', 'Amount', 'Recurring', 'Frequency', 'Due Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map(s => (
                  <tr key={s.feeStructureId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.feeName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.academicYear}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.className ?? <span className="text-gray-400">All classes</span>}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(s.amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', s.isRecurring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>
                        {s.isRecurring ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><FrequencyBadge freq={s.frequency as FeeFrequency | null} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.dueDate ? s.dueDate.slice(0, 10) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteTarget(s); setActionError(null); }} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Modal ────────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="New Fee Structure" onClose={() => setShowCreate(false)}>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            {actionError && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{actionError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name</label>
                <input {...createForm.register('feeName')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Monthly Tuition" />
                {createForm.formState.errors.feeName && <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.feeName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select {...createForm.register('academicYearId')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">— Select —</option>
                  {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
                </select>
                {createForm.formState.errors.academicYearId && <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.academicYearId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class (optional)</label>
                <select {...createForm.register('classId')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All classes</option>
                  {createFormClasses.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                <input type="number" min={1} step={1} {...createForm.register('amount')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {createForm.formState.errors.amount && <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.amount.message}</p>}
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" {...createForm.register('isRecurring')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Recurring</span>
                </label>
              </div>
              {createIsRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select {...createForm.register('frequency')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                <input type="date" {...createForm.register('dueDate')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
                {submitting ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.feeName}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            {actionError && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{actionError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name</label>
                <input {...editForm.register('feeName')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {editForm.formState.errors.feeName && <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.feeName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                <input type="number" min={1} step={1} {...editForm.register('amount')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {editForm.formState.errors.amount && <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.amount.message}</p>}
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" {...editForm.register('isRecurring')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Recurring</span>
                </label>
              </div>
              {editIsRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select {...editForm.register('frequency')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                <input type="date" {...editForm.register('dueDate')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal title="Delete Fee Structure" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-1">
            Are you sure you want to delete <span className="font-semibold">{deleteTarget.feeName}</span>?
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2 mb-4">
            This will fail if there are existing invoices linked to this structure.
          </p>
          {actionError && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-3">{actionError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleDelete} disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
              {submitting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
