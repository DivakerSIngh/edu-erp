import { useState, useEffect } from 'react';
import {
  UserIcon, ArrowDownTrayIcon, FunnelIcon, ArrowPathIcon,
  AcademicCapIcon, CheckCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import { reportService }    from '../services/reportService';
import { exportToExcel }    from '../utils/exportExcel';
import { admissionService } from '../../admission/services/admissionService';
import type { IndividualReportCard } from '../types/report.types';
import type { AcademicYear }         from '../../admission/types/admission.types';

// Simple student search from students service — fetched inline
interface StudentOption { studentId: number; name: string; enrollmentNumber: string; }

function gradeColor(g: string) {
  if (g === 'A+' || g === 'A') return 'bg-emerald-100 text-emerald-800';
  if (g === 'B+' || g === 'B') return 'bg-blue-100 text-blue-800';
  if (g === 'C+' || g === 'C') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export default function ReportCardPage() {
  const [years,     setYears]     = useState<AcademicYear[]>([]);
  const [students,  setStudents]  = useState<StudentOption[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [yearId,    setYearId]    = useState<number>(0);
  const [studentId, setStudentId] = useState<number>(0);
  const [data,      setData]      = useState<IndividualReportCard | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [fetched,   setFetched]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    admissionService.getAcademicYears().then(r => {
      if (r.isSuccess) {
        setYears(r.data);
        const cur = r.data.find(y => y.isCurrent) ?? r.data[0];
        if (cur) setYearId(cur.academicYearId);
      }
    });
  }, []);

  // Lazy search students via existing students endpoint
  useEffect(() => {
    if (studentSearch.length < 2) { setStudents([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await import('../../../services/api/axiosInstance')
          .then(m => m.default.get<{ data: { items: StudentOption[] } }>(
            `/students?page=1&pageSize=10&searchTerm=${encodeURIComponent(studentSearch)}`
          ));
        setStudents(res.data.data?.items ?? []);
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const handleFetch = async () => {
    if (!studentId || !yearId) { setError('Please select a student and academic year.'); return; }
    setLoading(true); setError('');
    try {
      const res = await reportService.getIndividualReportCard(studentId, yearId);
      setData(res ?? null);
      setFetched(true);
    } catch { setError('Failed to load report card.'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    if (!data) return;
    const rows = data.results.map(r => ({
      'Exam Name': r.examName, 'Exam Type': r.examType,
      'Subject': r.subjectName, 'Subject Code': r.subjectCode,
      'Marks Obtained': r.marksObtained, 'Max Marks': r.maxMarks, 'Pass Marks': r.passMarks,
      Grade: r.grade, Result: r.result,
    }));
    exportToExcel(rows as Record<string, unknown>[], `report_card_${data.header.enrollmentNumber}`, 'Report Card');
  };

  // Group results by exam
  const examGroups = data?.results.reduce((acc, r) => {
    const key = `${r.examinationId}_${r.examName}`;
    if (!acc[key]) acc[key] = { examName: r.examName, examType: r.examType, rows: [] };
    acc[key].rows.push(r);
    return acc;
  }, {} as Record<string, { examName: string; examType: string; rows: typeof data.results }>) ?? {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Individual Report Card</h1>
          <p className="text-sm text-gray-500 mt-0.5">All exam results for a single student in an academic year</p>
        </div>
        {fetched && data && (
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export to Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Select Student</span>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">Student <span className="text-red-500">*</span></label>
            <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setStudentId(0); }}
              placeholder="Type name or enrollment…"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
            {students.length > 0 && studentId === 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-64 z-10 max-h-40 overflow-y-auto">
                {students.map(s => (
                  <button key={s.studentId}
                    onClick={() => { setStudentId(s.studentId); setStudentSearch(`${s.name} (${s.enrollmentNumber})`); setStudents([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{s.enrollmentNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year <span className="text-red-500">*</span></label>
            <select value={yearId} onChange={e => setYearId(+e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44">
              <option value={0}>Select Year</option>
              {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
            </select>
          </div>
          <button onClick={handleFetch} disabled={loading || !studentId || !yearId}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <UserIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View Report Card'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Student header card */}
      {fetched && data && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <AcademicCapIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{data.header.studentName}</h2>
              <p className="text-blue-100 text-sm">{data.header.enrollmentNumber} · {data.header.className} {data.header.sectionName} · {data.header.academicYear}</p>
            </div>
          </div>
        </div>
      )}

      {fetched && !data && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No exam results found for the selected student and year.
        </div>
      )}

      {/* Exam groups */}
      {fetched && data && Object.values(examGroups).map(group => (
        <div key={group.examName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
            <span className="font-semibold text-gray-800">{group.examName}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{group.examType}</span>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                {['Subject','Code','Marks','Max','Pass','Grade','Result'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.subjectName}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{r.subjectCode}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{r.marksObtained}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.maxMarks}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.passMarks}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(r.grade)}`}>{r.grade}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${r.result === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.result === 'Pass'
                        ? <CheckCircleIcon className="w-4 h-4" />
                        : <XCircleIcon className="w-4 h-4" />}
                      {r.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
