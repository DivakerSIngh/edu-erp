import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examinationService } from '../services/examinationService';
import type { ExaminationDetail, Subject, ClassStudent, ExamResultItem } from '../types/examination.types';
import { ROUTES } from '../../../router/routeConstants';
import Spinner from '../../../components/ui/Spinner';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResultRow {
  studentId:    number;
  studentName:  string;
  enrollmentNumber: string;
  marksObtained: string;   // string for controlled input
  maxMarks:      string;
  remarks:       string;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExaminationResultsPage() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();

  const [exam,         setExam]         = useState<ExaminationDetail | null>(null);
  const [subjects,     setSubjects]     = useState<Subject[]>([]);
  const [rows,         setRows]         = useState<ResultRow[]>([]);
  const [selectedSub,  setSelectedSub]  = useState<number | ''>('');
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);
  const [saveSuccess,  setSaveSuccess]  = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build rows from students, pre-filling any existing results for the chosen subject
  const buildRows = useCallback(
    (students: ClassStudent[], existing: ExamResultItem[], subjectId: number | '', examMaxMarks: number): ResultRow[] => {
      return students.map(s => {
        const hit = subjectId !== ''
          ? existing.find(r => r.studentId === s.studentId && r.subjectId === subjectId)
          : undefined;
        return {
          studentId:        s.studentId,
          studentName:      s.studentName,
          enrollmentNumber: s.enrollmentNumber,
          marksObtained:    hit ? String(hit.marksObtained) : '',
          maxMarks:         hit ? String(hit.maxMarks) : String(examMaxMarks),
          remarks:          hit?.remarks ?? '',
        };
      });
    },
    []
  );

  // Load exam + subjects + students + existing results
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      examinationService.getById(+id),
      examinationService.getSubjects(),
      examinationService.getResults(+id),
    ])
      .then(([examRes, subjectsRes, resultsRes]) => {
        const examData = examRes.data;
        const subList  = subjectsRes.data ?? [];
        const extRes   = resultsRes.data ?? [];
        setExam(examData);
        setSubjects(subList);
        // Load class students
        return examinationService.getClassStudents(examData.classId)
          .then(stuRes => ({ students: stuRes.data ?? [], existing: extRes, maxM: examData.maxMarks }));
      })
      .then(({ students, existing, maxM }) => {
        setRows(buildRows(students as ClassStudent[], existing, '', maxM));
        // Keep students in a ref for later subject changes
        (window as unknown as { __examStudents: ClassStudent[] }).__examStudents = students as ClassStudent[];
        (window as unknown as { __examExisting: ExamResultItem[] }).__examExisting = existing;
      })
      .catch(() => setLoadError('Failed to load examination data.'))
      .finally(() => setLoading(false));
  }, [id, buildRows]);

  // When subject changes, re-build rows with pre-filled marks
  useEffect(() => {
    if (!exam) return;
    const students: ClassStudent[] = (window as unknown as { __examStudents: ClassStudent[] }).__examStudents ?? [];
    const existing: ExamResultItem[] = (window as unknown as { __examExisting: ExamResultItem[] }).__examExisting ?? [];
    setRows(buildRows(students, existing, selectedSub, exam.maxMarks));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSub]);

  const updateRow = (idx: number, field: keyof Omit<ResultRow, 'studentId' | 'studentName' | 'enrollmentNumber'>, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    if (!id || selectedSub === '' || !exam) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const results = rows
        .filter(r => r.marksObtained !== '')
        .map(r => ({
          studentId:     r.studentId,
          subjectId:     selectedSub as number,
          marksObtained: parseFloat(r.marksObtained) || 0,
          maxMarks:      parseFloat(r.maxMarks) || exam.maxMarks,
          remarks:       r.remarks || undefined,
        }));
      await examinationService.bulkEnterResults(+id, { results });
      setSaveSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save results. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="-m-6 flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  if (loadError || !exam) {
    return (
      <div className="-m-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 font-medium">{loadError ?? 'Examination not found.'}</p>
        <button
          onClick={() => navigate(ROUTES.EXAMINATION_DETAIL.replace(':id', String(exam?.examinationId ?? id)))}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  const filledCount = rows.filter(r => r.marksObtained !== '').length;

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.EXAMINATION_DETAIL.replace(':id', String(exam.examinationId)))}
            className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm transition-colors px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{exam.examName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{exam.className} · {exam.academicYear}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || selectedSub === '' || filledCount === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? (
            <><Spinner size="sm" className="text-white" /> Saving…</>
          ) : (
            <><CheckCircleIcon className="h-4 w-4" /> Save Results</>
          )}
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-6 space-y-5">

          {/* Subject selector + stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 min-w-[200px] flex-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Subject</label>
              <select
                value={selectedSub}
                onChange={e => setSelectedSub(e.target.value === '' ? '' : Number(e.target.value))}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              >
                <option value="">Select subject…</option>
                {subjects.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectCode} — {s.subjectName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <UserGroupIcon className="h-4 w-4" />
              <span><span className="font-semibold text-gray-700">{filledCount}</span>/{rows.length} filled</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-500">Max:</span>
              <span className="font-semibold text-gray-700">{exam.maxMarks}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">Pass:</span>
              <span className="font-semibold text-gray-700">{exam.passMarks}</span>
            </div>
          </div>

          {/* Status messages */}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              Results saved successfully!
            </div>
          )}
          {saveError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Results grid */}
          {selectedSub === '' ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-gray-400">
              <ClipboardDocumentListIcon className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Select a subject to enter results</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Student</th>
                      <th className="px-4 py-3 text-left font-semibold">Enrollment</th>
                      <th className="px-4 py-3 text-center font-semibold w-28">Marks Obtained</th>
                      <th className="px-4 py-3 text-center font-semibold w-24">Max Marks</th>
                      <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, idx) => {
                      const marks   = parseFloat(row.marksObtained);
                      const maxM    = parseFloat(row.maxMarks) || exam.maxMarks;
                      const isPassing = !isNaN(marks) && marks >= exam.passMarks;
                      const hasMarks  = row.marksObtained !== '';
                      return (
                        <tr key={row.studentId} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-gray-400 tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium">{row.studentName}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs tabular-nums">{row.enrollmentNumber}</td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={maxM}
                              step="0.5"
                              value={row.marksObtained}
                              onChange={e => updateRow(idx, 'marksObtained', e.target.value)}
                              className={`w-20 text-center rounded-xl border px-2 py-1 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
                                hasMarks
                                  ? isPassing
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-red-300 bg-red-50 text-red-700'
                                  : 'border-gray-300 bg-gray-50'
                              }`}
                              placeholder="—"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              value={row.maxMarks}
                              onChange={e => updateRow(idx, 'maxMarks', e.target.value)}
                              className="w-16 text-center rounded-xl border border-gray-300 bg-gray-50 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              maxLength={500}
                              value={row.remarks}
                              onChange={e => updateRow(idx, 'remarks', e.target.value)}
                              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                              placeholder="Optional"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-400">
                  No students enrolled in this class.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

