import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../router/routeConstants';
import { admissionService } from '../services/admissionService';
import type { AdmissionListItem, AdmissionStatus, AdmissionListParams } from '../types/admission.types';
import StatusBadge from '../../../components/ui/StatusBadge';
import Spinner from '../../../components/ui/Spinner';
import Pagination from '../../../components/ui/Pagination';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS: Array<{ label: string; value: AdmissionStatus | '' }> = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending',      value: 'Pending' },
  { label: 'Reviewed',     value: 'Reviewed' },
  { label: 'Accepted',     value: 'Accepted' },
  { label: 'Rejected',     value: 'Rejected' },
  { label: 'Enrolled',     value: 'Enrolled' },
];

export default function AdmissionListPage() {
  const navigate = useNavigate();

  const [params,  setParams]  = useState<AdmissionListParams>({ page: 1, pageSize: 20 });
  const [items,   setItems]   = useState<AdmissionListItem[]>([]);
  const [meta,    setMeta]    = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async (p: AdmissionListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await admissionService.getAll(p);
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
      setError('Failed to load admission applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(params); }, [load, params]);

  const handleSearch = () =>
    setParams((p) => ({ ...p, page: 1, search: search.trim() || undefined }));

  const handleStatusFilter = (status: AdmissionStatus | '') =>
    setParams((p) => ({ ...p, page: 1, status: status || undefined }));

  // ── Derived stats ──────────────────────────────────────────────────────────
  const pending  = items.filter((i) => i.status === 'Pending').length;
  const accepted = items.filter((i) => i.status === 'Accepted').length;
  const rejected = items.filter((i) => i.status === 'Rejected').length;
  const enrolled = items.filter((i) => i.status === 'Enrolled').length;

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)]">

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admission Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.totalCount > 0
              ? `${meta.totalCount} application${meta.totalCount !== 1 ? 's' : ''} total`
              : 'Manage and review student admission applications'}
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.ADMISSION_NEW)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Application
        </button>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-8 py-4 grid grid-cols-4 gap-4 shrink-0">
          <StatCard icon={<ClockIcon className="h-5 w-5 text-amber-500" />}  label="Pending"  value={pending}  color="amber" />
          <StatCard icon={<CheckCircleIcon className="h-5 w-5 text-green-500" />} label="Accepted" value={accepted} color="green" />
          <StatCard icon={<XCircleIcon className="h-5 w-5 text-red-500" />}  label="Rejected" value={rejected} color="red" />
          <StatCard icon={<AcademicCapIcon className="h-5 w-5 text-blue-500" />} label="Enrolled" value={enrolled} color="blue" />
        </div>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-200 px-8 py-4 flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="flex flex-1 gap-2 items-center bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or reference number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <button
            onClick={handleSearch}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
          <select
            className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={params.status ?? ''}
            onChange={(e) => handleStatusFilter(e.target.value as AdmissionStatus | '')}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner size="lg" className="text-blue-600" />
            <p className="text-sm text-gray-500">Loading applications…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <p className="font-medium text-gray-800">{error}</p>
            <button
              onClick={() => load(params)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700">No applications found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Reference', 'Applicant', 'Parent / Contact', 'Applying For', 'Applied On', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider first:pl-8 last:pr-8"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((row) => (
                <tr
                  key={row.applicationId}
                  onClick={() => navigate(`/admission/${row.applicationId}`)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 pl-8 font-mono text-xs text-blue-700 font-medium">
                    {row.referenceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{row.applicantName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{row.gender} · {new Date(row.dateOfBirth).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-700">{row.parentEmail}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{row.parentPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-800">{row.className ?? row.applyingForClass}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{row.academicYear}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(row.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-4 pr-8 text-right">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      View →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="px-6 pl-8 border-t border-gray-100">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalCount={meta.totalCount}
            pageSize={meta.pageSize}
            onPage={(p) => setParams((prev) => ({ ...prev, page: p }))}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number; color: 'amber' | 'green' | 'red' | 'blue' }) {
  const bg = {
    amber: 'bg-amber-50',
    green: 'bg-green-50',
    red:   'bg-red-50',
    blue:  'bg-blue-50',
  }[color];

  return (
    <div className={`flex items-center gap-3 ${bg} rounded-xl px-4 py-3`}>
      {icon}
      <div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
      </div>
    </div>
  );
}
