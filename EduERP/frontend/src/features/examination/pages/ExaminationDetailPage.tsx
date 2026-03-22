import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examinationService } from '../services/examinationService';
import type { ExaminationDetail, ExamResultItem } from '../types/examination.types';
import { ROUTES } from '../../../router/routeConstants';
import { useAuth } from '../../../hooks/useAuth';
import Spinner from '../../../components/ui/Spinner';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function Grade({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    'A+': 'bg-green-100 text-green-700',
    A:    'bg-green-100 text-green-700',
    B:    'bg-sky-100 text-sky-700',
    C:    'bg-amber-100 text-amber-700',
    D:    'bg-orange-100 text-orange-700',
    F:    'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${colors[grade] ?? 'bg-gray-100 text-gray-600'}`}>
      {grade}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExaminationDetailPage() {
  const navigate       = useNavigate();
  const { id }         = useParams<{ id: string }>();
  const { user }       = useAuth();
  const isAdmin        = user?.role === 'Admin';
  const isTeacher      = user?.role === 'Teacher';

  const [exam,          setExam]          = useState<ExaminationDetail | null>(null);
  const [results,       setResults]       = useState<ExamResultItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [publishing,    setPublishing]    = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [showDeleteMod, setShowDeleteMod] = useState(false);
  const [publishOk,     setPublishOk]     = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      examinationService.getById(+id),
      examinationService.getResults(+id),
    ])
      .then(([examRes, resultsRes]) => {
        setExam(examRes.data);
        setResults(resultsRes.data ?? []);
      })
      .catch(() => setError('Failed to load examination details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePublishToggle = async () => {
    if (!exam || !id) return;
    setPublishing(true);
    try {
      const updated = await examinationService.publish(+id, !exam.isPublished);
      setExam(updated.data);
      setPublishOk(true);
      setTimeout(() => setPublishOk(false), 3000);
    } catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await examinationService.delete(+id);
      navigate(ROUTES.EXAMINATIONS);
    } catch {
      setDeleting(false);
      setShowDeleteMod(false);
    }
  };

  if (loading) {
    return <div className="-m-6 flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  if (error || !exam) {
    return (
      <div className="-m-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 font-medium">{error ?? 'Examination not found.'}</p>
        <button onClick={() => navigate(ROUTES.EXAMINATIONS)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Examinations
        </button>
      </div>
    );
  }

  const passCount = results.filter(r => r.result === 'Pass').length;
  const failCount = results.filter(r => r.result === 'Fail').length;
  const initials  = exam.examName.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 pt-6 pb-16 shrink-0">
        <button
          onClick={() => navigate(ROUTES.EXAMINATIONS)}
          className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-5 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Examinations
        </button>
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-white/20 ring-2 ring-white/40 flex items-center justify-center shrink-0">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white">{exam.examName}</h1>
            <p className="text-indigo-200 text-sm mt-0.5">{exam.className} · {exam.academicYear}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-white/20 text-white text-xs px-2.5 py-0.5 font-medium">
                {exam.examType}
              </span>
              {exam.isPublished ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/80 text-white text-xs px-2.5 py-0.5 font-medium">
                  <CheckBadgeIcon className="h-3 w-3" /> Published
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-white/20 text-white text-xs px-2.5 py-0.5 font-medium">
                  Draft
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {(isAdmin || isTeacher) && (
              <button
                onClick={() => navigate(ROUTES.EXAMINATION_RESULTS.replace(':id', String(exam.examinationId)))}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <ClipboardDocumentListIcon className="h-4 w-4" /> Enter Results
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={handlePublishToggle}
                  disabled={publishing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {publishing
                    ? <Spinner size="sm" className="text-white" />
                    : exam.isPublished
                      ? <LockClosedIcon className="h-4 w-4" />
                      : <CheckBadgeIcon className="h-4 w-4" />}
                  {exam.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => navigate(ROUTES.EXAMINATION_EDIT.replace(':id', String(exam.examinationId)))}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <PencilSquareIcon className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => setShowDeleteMod(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <TrashIcon className="h-4 w-4" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Cards grid ────────────────────────────────────────────────────── */}
      <div className="px-8 -mt-10 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Examination Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <AcademicCapIcon className="h-4 w-4 text-indigo-500" /> Examination Details
          </h3>
          <InfoRow icon={<AcademicCapIcon  className="h-4 w-4" />} label="Class"         value={exam.className} />
          <InfoRow icon={<CalendarDaysIcon className="h-4 w-4" />} label="Academic Year"  value={exam.academicYear} />
          <InfoRow
            icon={<CalendarDaysIcon className="h-4 w-4" />}
            label="Schedule"
            value={`${new Date(exam.startDate).toLocaleDateString()} – ${new Date(exam.endDate).toLocaleDateString()}`}
          />
          <InfoRow icon={<StarIcon         className="h-4 w-4" />} label="Max Marks"  value={String(exam.maxMarks)} />
          <InfoRow icon={<CheckCircleIcon  className="h-4 w-4" />} label="Pass Marks" value={String(exam.passMarks)} />
          {exam.createdAt && (
            <InfoRow icon={<ClockIcon className="h-4 w-4" />} label="Created" value={new Date(exam.createdAt).toLocaleDateString()} />
          )}
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4 text-blue-500" /> Results Summary
          </h3>
          {results.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">No results entered yet.</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center rounded-xl bg-gray-50 p-3">
                  <div className="text-xl font-bold text-gray-700">{results.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total</div>
                </div>
                <div className="text-center rounded-xl bg-emerald-50 p-3">
                  <div className="text-xl font-bold text-emerald-600">{passCount}</div>
                  <div className="text-xs text-emerald-600 mt-0.5">Passed</div>
                </div>
                <div className="text-center rounded-xl bg-red-50 p-3">
                  <div className="text-xl font-bold text-red-500">{failCount}</div>
                  <div className="text-xs text-red-500 mt-0.5">Failed</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-1.5 text-left text-gray-500 font-medium">Student</th>
                      <th className="py-1.5 text-center text-gray-500 font-medium">Subject</th>
                      <th className="py-1.5 text-center text-gray-500 font-medium">Score</th>
                      <th className="py-1.5 text-center text-gray-500 font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 8).map(r => (
                      <tr key={r.resultId} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-700">{r.studentName}</td>
                        <td className="py-1.5 text-center text-gray-600">{r.subjectCode}</td>
                        <td className="py-1.5 text-center text-gray-700">{r.marksObtained}/{r.maxMarks}</td>
                        <td className="py-1.5 text-center">{r.grade ? <Grade grade={r.grade} /> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.length > 8 && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    +{results.length - 8} more results
                  </p>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Publish success toast ──────────────────────────────────────────── */}
      {publishOk && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
          <CheckBadgeIcon className="h-5 w-5" />
          {exam.isPublished ? 'Examination published.' : 'Examination unpublished.'}
        </div>
      )}

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      {showDeleteMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                <TrashIcon className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">Delete Examination</h2>
            <p className="text-sm text-gray-500 text-center mt-2">
              This examination and all associated results will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteMod(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <><Spinner size="sm" className="text-white" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
