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
} from '@heroicons/react/24/outline';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Unit:     'bg-sky-100 text-sky-700',
  MidTerm:  'bg-amber-100 text-amber-700',
  Final:    'bg-purple-100 text-purple-700',
  Remedial: 'bg-pink-100 text-pink-700',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
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
    } catch {
      // ignore — keep current state
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
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-700">
        {error ?? 'Examination not found.'}
      </div>
    );
  }

  const passCount = results.filter(r => r.result === 'Pass').length;
  const failCount = results.filter(r => r.result === 'Fail').length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.EXAMINATIONS)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <AcademicCapIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{exam.examName}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[exam.examType] ?? 'bg-gray-100 text-gray-600'}`}>
                  {exam.examType}
                </span>
                {exam.isPublished ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Published</span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Draft</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin || isTeacher) && (
            <button
              onClick={() => navigate(ROUTES.EXAMINATION_RESULTS.replace(':id', String(exam.examinationId)))}
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              Enter Results
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={handlePublishToggle}
                disabled={publishing}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  exam.isPublished
                    ? 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {publishing ? (
                  <Spinner size="sm" className={exam.isPublished ? 'text-gray-500' : 'text-green-600'} />
                ) : exam.isPublished ? (
                  <LockClosedIcon className="h-4 w-4" />
                ) : (
                  <CheckBadgeIcon className="h-4 w-4" />
                )}
                {exam.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={() => navigate(ROUTES.EXAMINATION_EDIT.replace(':id', String(exam.examinationId)))}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteMod(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* ── Exam Info ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Examination Details</h3>
          </div>
          <InfoRow label="Class"         value={exam.className} />
          <InfoRow label="Academic Year"  value={exam.academicYear} />
          <InfoRow
            label="Schedule"
            value={`${new Date(exam.startDate).toLocaleDateString()} – ${new Date(exam.endDate).toLocaleDateString()}`}
          />
          <InfoRow label="Max Marks"  value={exam.maxMarks} />
          <InfoRow label="Pass Marks" value={exam.passMarks} />
          {exam.createdAt && (
            <InfoRow label="Created" value={new Date(exam.createdAt).toLocaleDateString()} />
          )}
        </div>

        {/* ── Results Summary ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <UserGroupIcon className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Results Summary</h3>
          </div>
          {results.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">No results entered yet.</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center rounded-lg bg-gray-50 p-3">
                  <div className="text-xl font-bold text-gray-700">{results.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total</div>
                </div>
                <div className="text-center rounded-lg bg-green-50 p-3">
                  <div className="text-xl font-bold text-green-600">{passCount}</div>
                  <div className="text-xs text-green-600 mt-0.5">Passed</div>
                </div>
                <div className="text-center rounded-lg bg-red-50 p-3">
                  <div className="text-xl font-bold text-red-500">{failCount}</div>
                  <div className="text-xs text-red-500 mt-0.5">Failed</div>
                </div>
              </div>
              {/* Top results preview */}
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
                        <td className="py-1.5 text-gray-700 text-xs">{r.studentName}</td>
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

      {/* ── Delete confirmation modal ── */}
      {showDeleteMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Delete Examination?</p>
                <p className="text-xs text-gray-500">{exam.examName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              This examination and all associated results will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteMod(false)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
