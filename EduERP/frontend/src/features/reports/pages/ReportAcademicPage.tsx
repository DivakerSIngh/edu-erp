import { useState, useEffect, useMemo } from 'react';
import {
  AcademicCapIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { exportToExcel } from '../utils/exportExcel';
import { examinationService } from '../../examination/services/examinationService';
import type { ExaminationListItem, ExamResultItem } from '../../examination/types/examination.types';

// ── helpers ───────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-800',
  'A':  'bg-emerald-100 text-emerald-700',
  'B':  'bg-blue-100 text-blue-700',
  'C':  'bg-yellow-100 text-yellow-700',
  'D':  'bg-orange-100 text-orange-700',
  'F':  'bg-red-100 text-red-700',
};

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-gray-300">—</span>;
  const cls = GRADE_COLOR[grade] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {grade}
    </span>
  );
}

interface SubjectAvg {
  subjectId:   number;
  subjectName: string;
  subjectCode: string;
  avgMarks:    number;
  maxMarks:    number;
  passCount:   number;
  failCount:   number;
  avgPct:      number;
}

interface StudentSummary {
  studentId:        number;
  studentName:      string;
  enrollmentNumber: string;
  totalMarks:       number;
  totalMaxMarks:    number;
  percentage:       number;
  grade:            string;
  passed:           boolean;
}

function overallGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ReportAcademicPage() {
  const [exams,        setExams]        = useState<ExaminationListItem[]>([]);
  const [examinationId, setExaminationId] = useState<number>(0);
  const [results,      setResults]      = useState<ExamResultItem[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [fetched,      setFetched]      = useState(false);
  const [examsLoading, setExamsLoading] = useState(true);

  // Load published exams on mount
  useEffect(() => {
    setExamsLoading(true);
    examinationService.getAll({ page: 1, pageSize: 100 }).then(res => {
      if (res.isSuccess) {
        const published = res.data.items.filter(e => e.isPublished);
        setExams(published);
        if (published.length > 0) setExaminationId(published[0].examinationId);
      }
    }).finally(() => setExamsLoading(false));
  }, []);

  const fetchResults = async () => {
    if (!examinationId) return;
    setLoading(true);
    try {
      const res = await examinationService.getResults(examinationId);
      if (res.isSuccess) { setResults(res.data); setFetched(true); }
    } finally { setLoading(false); }
  };

  // Subject-wise averages
  const subjectAverages = useMemo((): SubjectAvg[] => {
    const map = new Map<number, { subjectName: string; subjectCode: string; marks: number[]; max: number; pass: number; fail: number }>();
    for (const r of results) {
      if (!map.has(r.subjectId)) {
        map.set(r.subjectId, { subjectName: r.subjectName, subjectCode: r.subjectCode, marks: [], max: r.maxMarks, pass: 0, fail: 0 });
      }
      const s = map.get(r.subjectId)!;
      s.marks.push(r.marksObtained);
      if (r.result === 'Pass') s.pass++; else s.fail++;
    }
    return Array.from(map.entries()).map(([subjectId, s]) => {
      const avg = s.marks.length ? s.marks.reduce((a, b) => a + b, 0) / s.marks.length : 0;
      return {
        subjectId,
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
        avgMarks:    Math.round(avg * 10) / 10,
        maxMarks:    s.max,
        passCount:   s.pass,
        failCount:   s.fail,
        avgPct:      s.max ? Math.round((avg / s.max) * 100) : 0,
      };
    }).sort((a, b) => b.avgPct - a.avgPct);
  }, [results]);

  // Per-student summaries (aggregate across subjects)
  const studentSummaries = useMemo((): StudentSummary[] => {
    const map = new Map<number, { studentName: string; enrollmentNumber: string; total: number; max: number; passCount: number; subjectCount: number }>();
    for (const r of results) {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, { studentName: r.studentName, enrollmentNumber: r.enrollmentNumber, total: 0, max: 0, passCount: 0, subjectCount: 0 });
      }
      const s = map.get(r.studentId)!;
      s.total += r.marksObtained;
      s.max   += r.maxMarks;
      s.subjectCount++;
      if (r.result === 'Pass') s.passCount++;
    }
    return Array.from(map.entries()).map(([studentId, s]) => {
      const pct = s.max ? Math.round((s.total / s.max) * 100) : 0;
      return {
        studentId,
        studentName:      s.studentName,
        enrollmentNumber: s.enrollmentNumber,
        totalMarks:       s.total,
        totalMaxMarks:    s.max,
        percentage:       pct,
        grade:            overallGrade(pct),
        passed:           s.passCount === s.subjectCount && s.subjectCount > 0,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [results]);

  const passCount = studentSummaries.filter(s => s.passed).length;
  const failCount = studentSummaries.length - passCount;
  const avgPct    = studentSummaries.length
    ? Math.round(studentSummaries.reduce((a, s) => a + s.percentage, 0) / studentSummaries.length)
    : 0;

  const selectedExam = exams.find(e => e.examinationId === examinationId);

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Academic Report</h1>
          <p className="text-sm text-gray-500">Exam-wise results, subject averages and student performance</p>
        </div>
        {fetched && studentSummaries.length > 0 && (
          <button
            onClick={() =>
              exportToExcel(
                studentSummaries.map((s, i) => ({
                  Rank:           i + 1,
                  Enrollment:     s.enrollmentNumber,
                  Name:           s.studentName,
                  'Total Marks':  s.totalMarks,
                  'Max Marks':    s.totalMaxMarks,
                  '%':            s.percentage,
                  Grade:          s.grade,
                  Result:         s.passed ? 'Pass' : 'Fail',
                })) as Record<string, unknown>[],
                `academic_${selectedExam?.examName ?? 'report'}`,
                'Results',
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Export to Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex flex-wrap items-end gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Examination</label>
          <select value={examinationId} onChange={e => setExaminationId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[260px]"
            disabled={examsLoading}>
            {examsLoading
              ? <option>Loading exams…</option>
              : exams.length === 0
                ? <option value={0}>No published exams</option>
                : exams.map(e => (
                    <option key={e.examinationId} value={e.examinationId}>
                      {e.examName} — {e.className} ({e.academicYear})
                    </option>
                  ))
            }
          </select>
        </div>
        <button onClick={fetchResults} disabled={loading || !examinationId}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors">
          {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <FunnelIcon className="h-4 w-4" />}
          {loading ? 'Loading…' : 'View Report'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {!fetched && !loading && (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400">
            <AcademicCapIcon className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-semibold text-base text-gray-500">
              {examsLoading ? 'Loading exams…' : exams.length === 0 ? 'No published exams found' : 'Select an exam and click "View Report"'}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-72">
            <svg className="animate-spin h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}

        {fetched && !loading && (
          <>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <UserGroupIcon className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">No results entered for this examination yet</p>
              </div>
            ) : (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Students',  val: studentSummaries.length, icon: <UserGroupIcon className="h-5 w-5" />,    color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Class Average',   val: `${avgPct}%`,            icon: <AcademicCapIcon className="h-5 w-5" />,  color: 'text-blue-600 bg-blue-50' },
                    { label: 'Passed',          val: passCount,               icon: <CheckCircleIcon className="h-5 w-5" />,  color: 'text-emerald-700 bg-emerald-50' },
                    { label: 'Failed',          val: failCount,               icon: <XCircleIcon className="h-5 w-5" />,      color: 'text-red-700 bg-red-50' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${item.color}`}>{item.icon}</div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{item.val}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subject averages */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Subject-wise Performance</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Code</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Marks</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Avg %</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-emerald-600">Passed</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-red-600">Failed</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 min-w-[140px]">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {subjectAverages.map(s => (
                        <tr key={s.subjectId} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">{s.subjectName}</td>
                          <td className="px-6 py-3 text-gray-500 font-mono text-xs">{s.subjectCode}</td>
                          <td className="px-6 py-3 text-center text-gray-700">{s.avgMarks} / {s.maxMarks}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              s.avgPct >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                            }`}>{s.avgPct}%</span>
                          </td>
                          <td className="px-6 py-3 text-center text-emerald-700 font-semibold">{s.passCount}</td>
                          <td className="px-6 py-3 text-center text-red-600 font-semibold">{s.failCount}</td>
                          <td className="px-6 py-3">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-32">
                              <div className={`h-full rounded-full ${s.avgPct >= 60 ? 'bg-emerald-500' : 'bg-red-400'}`}
                                style={{ width: `${s.avgPct}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Student results */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Student Results — {selectedExam?.examName}</h2>
                    <span className="text-xs text-gray-500">{studentSummaries.length} students • sorted by rank</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-10">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Enroll No.</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Total Marks</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Percentage</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Grade</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {studentSummaries.map((s, idx) => (
                        <tr key={s.studentId} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-3 text-gray-400 font-semibold text-sm">{idx + 1}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">{s.studentName}</td>
                          <td className="px-6 py-3 text-gray-500 font-mono text-xs">{s.enrollmentNumber}</td>
                          <td className="px-6 py-3 text-center text-gray-700">{s.totalMarks} / {s.totalMaxMarks}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              s.percentage >= 75 ? 'bg-emerald-100 text-emerald-800'
                                : s.percentage >= 50 ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>{s.percentage}%</span>
                          </td>
                          <td className="px-6 py-3 text-center"><GradeBadge grade={s.grade} /></td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              s.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                            }`}>
                              {s.passed
                                ? <><CheckCircleIcon className="h-3.5 w-3.5" />Pass</>
                                : <><XCircleIcon className="h-3.5 w-3.5" />Fail</>}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

