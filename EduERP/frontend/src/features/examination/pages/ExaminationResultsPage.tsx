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
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-700">
        {loadError ?? 'Examination not found.'}
      </div>
    );
  }

  const filledCount = rows.filter(r => r.marksObtained !== '').length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.EXAMINATION_DETAIL.replace(':id', String(exam.examinationId)))}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">{exam.examName}</h1>
              <p className="text-xs text-gray-500">{exam.className} · {exam.academicYear}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || selectedSub === '' || filledCount === 0}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? (
            <><Spinner size="sm" className="text-white" /> Saving…</>
          ) : (
            <><CheckCircleIcon className="h-4 w-4" /> Save Results</>
          )}
        </button>
      </div>

      {/* Subject selector + stats */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 min-w-[200px] flex-1">
          <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Subject</label>
          <select
            value={selectedSub}
            onChange={e => setSelectedSub(e.target.value === '' ? '' : Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
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
          <span className="text-gray-500">Max Marks:</span>
          <span className="font-semibold text-gray-700">{exam.maxMarks}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">Pass:</span>
          <span className="font-semibold text-gray-700">{exam.passMarks}</span>
        </div>
      </div>

      {/* Status messages */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
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
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-gray-400">
          <ClipboardDocumentListIcon className="h-10 w-10 mb-2" />
          <p className="text-sm font-medium">Select a subject to enter results</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrollment</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Marks Obtained</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Max Marks</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const marks = parseFloat(row.marksObtained);
                  const maxM  = parseFloat(row.maxMarks) || exam.maxMarks;
                  const isPassing = !isNaN(marks) && marks >= exam.passMarks;
                  const hasMarks  = row.marksObtained !== '';
                  return (
                    <tr key={row.studentId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
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
                          className={`w-20 text-center rounded-lg border px-2 py-1 text-sm outline-none transition focus:ring-1 focus:ring-purple-400 ${
                            hasMarks
                              ? isPassing
                                ? 'border-green-300 bg-green-50 text-green-700'
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
                          className="w-16 text-center rounded-lg border border-gray-300 bg-gray-50 px-2 py-1 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          maxLength={500}
                          value={row.remarks}
                          onChange={e => updateRow(idx, 'remarks', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-2 py-1 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
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
  );
}

