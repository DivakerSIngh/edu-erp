import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../router/routeConstants';
import { examinationService } from '../services/examinationService';
import { admissionService } from '../../admission/services/admissionService';
import type {
  ExaminationListItem,
  ExamType,
  ExaminationListParams,
} from '../types/examination.types';
import type { AcademicYear, ClassOption } from '../../admission/types/admission.types';
import Spinner from '../../../components/ui/Spinner';
import Pagination from '../../../components/ui/Pagination';
import { useAuth } from '../../../hooks/useAuth';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  AcademicCapIcon,
  BookOpenIcon,
  FunnelIcon,
  TrashIcon,
  CheckBadgeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ExamType, string> = {
  Unit:     'bg-blue-100   text-blue-800   border-blue-200',
  MidTerm:  'bg-amber-100  text-amber-800  border-amber-200',
  Final:    'bg-purple-100 text-purple-800 border-purple-200',
  Remedial: 'bg-red-100    text-red-800    border-red-200',
};

function ExamTypeBadge({ type }: { type: ExamType }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[type]}`}>
      {type}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number;
  color: 'indigo' | 'blue' | 'emerald' | 'amber';
}) {
  const bg: Record<string, string> = {
    indigo:  'bg-indigo-50',
    blue:    'bg-blue-50',
    emerald: 'bg-emerald-50',
    amber:   'bg-amber-50',
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 ${bg[color]}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ── Exam type options ──────────────────────────────────────────────────────────

const EXAM_TYPE_OPTIONS: Array<{ label: string; value: ExamType | '' }> = [
  { label: 'All Types',  value: '' },
  { label: 'Unit',       value: 'Unit' },
  { label: 'Mid-Term',   value: 'MidTerm' },
  { label: 'Final',      value: 'Final' },
  { label: 'Remedial',   value: 'Remedial' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function ExaminationListPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'Admin';

  const [params,   setParams]   = useState<ExaminationListParams>({ page: 1, pageSize: 20 });
  const [items,    setItems]    = useState<ExaminationListItem[]>([]);
  const [meta,     setMeta]     = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState('');

  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const [years,   setYears]   = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  useEffect(() => {
    admissionService.getAcademicYears().then(r => setYears(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (params.academicYearId) {
      admissionService.getClasses(params.academicYearId)
        .then(r => setClasses(r.data ?? []))
        .catch(() => {});
    } else {
      setClasses([]);
    }
  }, [params.academicYearId]);

  const load = useCallback(async (p: ExaminationListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await examinationService.getAll(p);
      if (res.data) {
        setItems(res.data.items);
        setMeta({
          page:       res.data.page,
          pageSize:   res.data.pageSize,
          totalCount: res.data.totalCount,
          totalPages: res.data.totalPages,
        });
      }
    } catch {
      setError('Failed to load examinations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(params); }, [load, params]);

  const handleSearch = () => setParams(p => ({ ...p, page: 1, search }));
  const handleFilter = (key: keyof ExaminationListParams, value: string | number | undefined) =>
    setParams(p => ({ ...p, page: 1, [key]: value || undefined }));

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteErr(null);
    try {
      await examinationService.delete(deleteId);
      setDeleteId(null);
      load(params);
    } catch {
      setDeleteErr('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const published   = items.filter(i => i.isPublished).length;
  const unpublished = items.filter(i => !i.isPublished).length;

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.totalCount > 0
              ? `${meta.totalCount} examination${meta.totalCount !== 1 ? 's' : ''} total`
              : 'Manage examinations'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate(ROUTES.EXAMINATION_NEW)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Examination
          </button>
        )}
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-8 py-4 grid grid-cols-4 gap-4 shrink-0">
          <StatCard icon={<AcademicCapIcon className="h-5 w-5 text-indigo-500" />} label="Total"       value={meta.totalCount} color="indigo" />
          <StatCard icon={<BookOpenIcon    className="h-5 w-5 text-blue-500"   />} label="This Page"   value={items.length}    color="blue"   />
          <StatCard icon={<CheckBadgeIcon  className="h-5 w-5 text-emerald-500"/>} label="Published"   value={published}       color="emerald"/>
          <StatCard icon={<ClockIcon       className="h-5 w-5 text-amber-500"  />} label="Unpublished" value={unpublished}     color="amber"  />
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-200 px-8 py-3 flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          Search
        </button>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={params.academicYearId ?? ''}
            onChange={e => handleFilter('academicYearId', e.target.value ? +e.target.value : undefined)}
            className="text-sm border border-gray-300 rounded-lg py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Years</option>
            {years.map(y => (
              <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
            ))}
          </select>
          <select
            value={params.classId ?? ''}
            onChange={e => handleFilter('classId', e.target.value ? +e.target.value : undefined)}
            disabled={!params.academicYearId}
            className="text-sm border border-gray-300 rounded-lg py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>
          <select
            value={params.examType ?? ''}
            onChange={e => handleFilter('examType', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {EXAM_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-600 font-medium">{error}</p>
            <button onClick={() => load(params)} className="mt-3 text-sm text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <AcademicCapIcon className="h-16 w-16" />
            <p className="text-lg font-medium text-gray-500">No examinations found</p>
            <p className="text-sm">Add an examination or adjust your filters.</p>
            {isAdmin && (
              <button
                onClick={() => navigate(ROUTES.EXAMINATION_NEW)}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Create the first one
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Examination</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Class</th>
                <th className="px-4 py-3 text-left font-semibold">Academic Year</th>
                <th className="px-4 py-3 text-left font-semibold">Dates</th>
                <th className="px-4 py-3 text-left font-semibold">Marks</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(exam => (
                <tr
                  key={exam.examinationId}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(ROUTES.EXAMINATION_DETAIL.replace(':id', String(exam.examinationId)))}
                >
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{exam.examName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <ExamTypeBadge type={exam.examType} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{exam.className}</td>
                  <td className="px-4 py-3 text-gray-600">{exam.academicYear}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {exam.startDate} <span className="text-gray-300">→</span> {exam.endDate}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="font-medium text-gray-900">{exam.maxMarks}</span>
                    <span className="text-gray-400 text-xs ml-1">(pass {exam.passMarks})</span>
                  </td>
                  <td className="px-4 py-3">
                    {exam.isPublished ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckBadgeIcon className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        <ClockIcon className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(ROUTES.EXAMINATION_DETAIL.replace(':id', String(exam.examinationId)))}
                      className="text-xs text-gray-500 hover:underline mr-3"
                    >
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => navigate(ROUTES.EXAMINATION_EDIT.replace(':id', String(exam.examinationId)))}
                          className="text-xs text-blue-600 hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteId(exam.examinationId); setDeleteErr(null); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {!loading && meta.totalPages > 1 && (
        <div className="shrink-0 border-t border-gray-200 bg-white">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalCount={meta.totalCount}
            pageSize={meta.pageSize}
            onPage={p => setParams(prev => ({ ...prev, page: p }))}
          />
        </div>
      )}

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                <TrashIcon className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">Delete Examination</h2>
            <p className="text-sm text-gray-500 text-center mt-2">
              This will permanently remove the examination record. This action cannot be undone.
            </p>
            {deleteErr && <p className="mt-3 text-sm text-red-600 text-center">{deleteErr}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setDeleteId(null); setDeleteErr(null); }}
                disab