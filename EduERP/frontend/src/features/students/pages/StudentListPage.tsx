import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../router/routeConstants';
import { studentService } from '../services/studentService';
import type { StudentListItem, StudentStatus, StudentListParams } from '../types/student.types';
import Spinner from '../../../components/ui/Spinner';
import Pagination from '../../../components/ui/Pagination';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  AcademicCapIcon,
  FunnelIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StudentStatus, string> = {
  Active:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  Inactive:  'bg-red-100    text-red-800    border-red-200',
  Graduated: 'bg-blue-100   text-blue-800   border-blue-200',
};

function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number;
  color: 'emerald' | 'red' | 'blue' | 'indigo';
}) {
  const bg: Record<string, string> = {
    emerald: 'bg-emerald-50',
    red:     'bg-red-50',
    blue:    'bg-blue-50',
    indigo:  'bg-indigo-50',
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

// ── Main component ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ label: string; value: StudentStatus | '' }> = [
  { label: 'All Statuses', value: '' },
  { label: 'Active',       value: 'Active' },
  { label: 'Inactive',     value: 'Inactive' },
  { label: 'Graduated',    value: 'Graduated' },
];

export default function StudentListPage() {
  const navigate = useNavigate();

  const [params,  setParams]  = useState<StudentListParams>({ page: 1, pageSize: 20 });
  const [items,   setItems]   = useState<StudentListItem[]>([]);
  const [meta,    setMeta]    = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');

  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const load = useCallback(async (p: StudentListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getAll(p);
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
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(params); }, [load, params]);

  const handleSearch = () =>
    setParams((p) => ({ ...p, page: 1, search: search.trim() || undefined }));

  const handleStatusFilter = (status: StudentStatus | '') =>
    setParams((p) => ({ ...p, page: 1, status: status || undefined }));

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteErr(null);
    try {
      await studentService.delete(deleteId);
      setDeleteId(null);
      setItems((prev) => prev.filter((s) => s.studentId !== deleteId));
      setMeta((m) => ({ ...m, totalCount: m.totalCount - 1 }));
    } catch {
      setDeleteErr('Failed to delete student. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Derived stats
  const active    = items.filter((i) => i.status === 'Active').length;
  const inactive  = items.filter((i) => i.status === 'Inactive').length;
  const graduated = items.filter((i) => i.status === 'Graduated').length;

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.totalCount > 0
              ? `${meta.totalCount} student${meta.totalCount !== 1 ? 's' : ''} enrolled`
              : 'Manage enrolled students'}
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.STUDENT_NEW)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-8 py-4 grid grid-cols-4 gap-4 shrink-0">
          <StatCard icon={<UserGroupIcon      className="h-5 w-5 text-indigo-500" />} label="Total"    value={meta.totalCount} color="indigo" />
          <StatCard icon={<CheckCircleIcon    className="h-5 w-5 text-emerald-500" />} label="Active"   value={active}          color="emerald" />
          <StatCard icon={<MinusCircleIcon    className="h-5 w-5 text-red-500" />}     label="Inactive" value={inactive}        color="red" />
          <StatCard icon={<AcademicCapIcon    className="h-5 w-5 text-blue-500" />}   label="Graduated" value={graduated}       color="blue" />
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-200 px-8 py-3 flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search name or enrollment…"
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
        <div className="flex items-center gap-2 ml-auto">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            onChange={(e) => handleStatusFilter(e.target.value as StudentStatus | '')}
            className="text-sm border border-gray-300 rounded-lg py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
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
            <UserGroupIcon className="h-16 w-16" />
            <p className="text-lg font-medium text-gray-500">No students found</p>
            <p className="text-sm">Add a student or adjust your filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Student</th>
                <th className="px-4 py-3 text-left font-semibold">Enrollment No.</th>
                <th className="px-4 py-3 text-left font-semibold">Class / Section</th>
                <th className="px-4 py-3 text-left font-semibold">Gender</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s) => (
                <tr
                  key={s.studentId}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/students/${s.studentId}`)}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-700 font-semibold text-sm">
                          {s.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.fullName}</p>
                        <p className="text-xs text-gray-400">{s.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.enrollmentNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{s.className} — {s.section}</td>
                  <td className="px-4 py-3 text-gray-600">{s.gender}</td>
                  <td className="px-4 py-3"><StudentStatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/students/${s.studentId}/edit`);
                      }}
                      className="text-xs text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(s.studentId);
                        setDeleteErr(null);
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
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
            onPage={(p) => setParams((prev) => ({ ...prev, page: p }))}
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
            <h2 className="text-lg font-bold text-gray-900 text-center">Delete Student</h2>
            <p className="text-sm text-gray-500 text-center mt-2">
              This will permanently remove the student record. This action cannot be undone.
            </p>
            {deleteErr && <p className="mt-3 text-sm text-red-600 text-center">{deleteErr}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

