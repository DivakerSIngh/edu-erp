import { useState, useEffect } from 'react';
import {
  UsersIcon, ArrowDownTrayIcon, FunnelIcon, ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { reportService }    from '../services/reportService';
import { exportToExcel }    from '../utils/exportExcel';
import { admissionService } from '../../admission/services/admissionService';
import { examinationService } from '../../examination/services/examinationService';
import type { StudentDirectoryItem, StudentDirectoryParams } from '../types/report.types';
import type { AcademicYear } from '../../admission/types/admission.types';
import type { ClassItem, SectionItem } from '../../examination/types/examination.types';

export default function ReportStudentDirectoryPage() {
  const [years,    setYears]    = useState<AcademicYear[]>([]);
  const [classes,  setClasses]  = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [params,   setParams]   = useState<StudentDirectoryParams>({});
  const [data,     setData]     = useState<StudentDirectoryItem[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    admissionService.getAcademicYears().then(r => { if (r.isSuccess) setYears(r.data); });
    examinationService.getAllClasses().then(r => { if (r.isSuccess) setClasses(r.data); });
  }, []);

  useEffect(() => {
    if (params.classId) {
      examinationService.getSectionsByClass(params.classId)
        .then(r => { if (r.isSuccess) setSections(r.data); });
    } else {
      setSections([]);
      setParams(p => ({ ...p, sectionId: undefined }));
    }
  }, [params.classId]);

  const handleFetch = async () => {
    setLoading(true); setError('');
    try {
      const res = await reportService.getStudentDirectory(params);
      setData(res);
      setFetched(true);
    } catch { setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  const filtered = data.filter(s =>
    !search ||
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const rows = filtered.map(s => ({
      'Enrollment No': s.enrollmentNumber, Name: s.studentName, Gender: s.gender,
      'Date of Birth': s.dateOfBirth?.split('T')[0] ?? '',
      Email: s.email, Phone: s.phone, Class: s.className, Section: s.sectionName,
      Status: s.status, 'Academic Year': s.academicYear,
      'Admission Date': s.admissionDate?.split('T')[0] ?? '',
    }));
    exportToExcel(rows as Record<string, unknown>[], 'student_directory', 'Directory');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Filterable and exportable student list</p>
        </div>
        {fetched && filtered.length > 0 && (
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
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
            <select value={params.academicYearId ?? ''}
              onChange={e => setParams(p => ({ ...p, academicYearId: e.target.value ? +e.target.value : undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Years</option>
              {years.map(y => <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select value={params.classId ?? ''}
              onChange={e => setParams(p => ({ ...p, classId: e.target.value ? +e.target.value : undefined, sectionId: undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
            <select value={params.sectionId ?? ''}
              onChange={e => setParams(p => ({ ...p, sectionId: e.target.value ? +e.target.value : undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!params.classId}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
            <select value={params.gender ?? ''}
              onChange={e => setParams(p => ({ ...p, gender: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={params.status ?? ''}
              onChange={e => setParams(p => ({ ...p, status: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              <option>Active</option><option>Inactive</option><option>Graduated</option><option>Transferred</option>
            </select>
          </div>
          <button onClick={handleFetch} disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <UsersIcon className="w-4 h-4" />}
            {loading ? 'Loading…' : 'View'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Search + count */}
      {fetched && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or enrollment…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} students</span>
        </div>
      )}

      {fetched && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No students found matching the filters.
        </div>
      )}
      {fetched && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['#','Enrollment No','Name','Gender','Class','Section','Status','Email','Phone','Admission Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s, i) => (
                  <tr key={s.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{s.enrollmentNumber}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.gender}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.className}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.sectionName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'Active' ? 'bg-emerald-100 text-emerald-700'
                        : s.status === 'Graduated' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.admissionDate?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
