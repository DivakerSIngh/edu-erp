import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { admissionService } from '../services/admissionService';
import type { AdmissionDetail, AdmissionStatus, ClassOption, SectionOption } from '../types/admission.types';
import StatusBadge from '../../../components/ui/StatusBadge';
import Spinner from '../../../components/ui/Spinner';
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// ── Status Update Schema ──────────────────────────────────────────────────────

const statusSchema = z.object({
  status:  z.enum(['Pending', 'Reviewed', 'Accepted', 'Rejected'], {
    errorMap: () => ({ message: 'Select a valid status' }),
  }),
  remarks: z.string().max(1000).optional(),
});
type StatusValues = z.infer<typeof statusSchema>;

// ── Convert Schema ────────────────────────────────────────────────────────────

const convertSchema = z.object({
  classId:      z.coerce.number().min(1, 'Select a class'),
  sectionId:    z.coerce.number().min(1, 'Select a section'),
  tempPassword: z.string().min(8, 'Minimum 8 characters'),
});
type ConvertValues = z.infer<typeof convertSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdmissionDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();

  const [app,       setApp]       = useState<AdmissionDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [showConvert, setShowConvert] = useState(false);

  // class / section lookup state
  const [classes,       setClasses]       = useState<ClassOption[]>([]);
  const [sections,      setSections]      = useState<SectionOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const statusForm  = useForm<StatusValues>({ resolver: zodResolver(statusSchema) });
  const convertForm = useForm<ConvertValues>({ resolver: zodResolver(convertSchema) });

  useEffect(() => {
    if (!id) return;
    admissionService.getById(Number(id))
      .then((res) => setApp(res.data))
      .catch(() => setError('Application not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // When the convert panel opens, load classes linked to the application's academic year
  useEffect(() => {
    if (!showConvert || !app) return;
    setLoadingClasses(true);
    admissionService.getClasses(app.academicYearId ?? 0)
      .then((res) => setClasses(res.data ?? []))
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));
  }, [showConvert, app]);

  const handleClassChange = async (classId: number) => {
    convertForm.setValue('classId', classId);
    convertForm.setValue('sectionId', 0);
    setSections([]);
    if (!classId) return;
    const res = await admissionService.getSections(classId).catch(() => null);
    setSections(res?.data ?? []);
  };

  const handleStatusUpdate = async (values: StatusValues) => {
    setActionErr(null);
    setActionMsg(null);
    try {
      await admissionService.updateStatus(Number(id), values);
      setApp((prev) => prev ? { ...prev, status: values.status as AdmissionStatus, remarks: values.remarks ?? null } : prev);
      setActionMsg('Status updated successfully.');
    } catch {
      setActionErr('Failed to update status. Please try again.');
    }
  };

  const handleConvert = async (values: ConvertValues) => {
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await admissionService.convertToStudent(Number(id), values);
      setActionMsg(`Converted! Enrollment: ${res.data.enrollmentNumber}`);
      setApp((prev) => prev ? { ...prev, status: 'Enrolled' } : prev);
      setShowConvert(false);
    } catch {
      setActionErr('Conversion failed. Please try again.');
    }
  };

  if (loading) return (
    <div className="-m-6 flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-blue-600" />
        <p className="text-sm text-gray-500">Loading application…</p>
      </div>
    </div>
  );

  if (error || !app) return (
    <div className="-m-6 flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <XCircleIcon className="h-8 w-8 text-red-400" />
      </div>
      <p className="font-semibold text-gray-700">{error ?? 'Application not found.'}</p>
      <button
        onClick={() => navigate('/admission')}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Back to list
      </button>
    </div>
  );

  const isEnrolled = app.status === 'Enrolled';
  const canConvert = app.status === 'Accepted' && !app.convertedAt;

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate('/admission')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Applications
        </button>
        <span className="text-gray-300">/</span>
        <span className="font-mono text-sm text-blue-600 font-medium">{app.referenceNumber}</span>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={app.status} />
          {canConvert && (
            <button
              onClick={() => setShowConvert(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <AcademicCapIcon className="h-3.5 w-3.5" />
              Enroll Student
            </button>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 overflow-auto">

        {/* ── Left — applicant details ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Applicant name banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <UserIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{app.applicantName}</h1>
                <p className="text-blue-200 text-sm mt-0.5">
                  {app.gender} · Born {new Date(app.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoPill label="Applying For" value={app.className ?? app.applyingForClass} />
              <InfoPill label="Academic Year" value={app.academicYear} />
              {app.previousSchool && <InfoPill label="Previous School" value={app.previousSchool} />}
            </div>
          </div>

          {/* Parent / Guardian */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Parent / Guardian
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DetailCard icon={<UserIcon className="h-4 w-4" />}     label="Full Name" value={app.parentName} />
              <DetailCard icon={<EnvelopeIcon className="h-4 w-4" />} label="Email"     value={app.parentEmail} />
              <DetailCard icon={<PhoneIcon className="h-4 w-4" />}    label="Phone"     value={app.parentPhone} />
            </div>
          </div>

          {/* Remarks */}
          {app.remarks && (
            <div className="bg-white rounded-2xl border border-amber-200 p-6">
              <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">
                Review Remarks
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{app.remarks}</p>
            </div>
          )}

          {/* Enrolled panel */}
          {isEnrolled && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
              <CheckBadgeIcon className="h-10 w-10 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 text-lg">Student Enrolled</p>
                <p className="text-sm text-emerald-600">
                  This applicant has been converted to a student.
                  {app.convertedAt && ` Enrolled on ${new Date(app.convertedAt).toLocaleDateString()}.`}
                </p>
              </div>
            </div>
          )}

          {/* Convert panel */}
          {canConvert && showConvert && (
            <div className="bg-white rounded-2xl border-2 border-emerald-400 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-emerald-500" />
                  Enroll as Student
                </h2>
                <button
                  onClick={() => setShowConvert(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={convertForm.handleSubmit(handleConvert)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Class <span className="text-red-500">*</span>
                    </label>
                    {loadingClasses ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                        <Spinner size="sm" className="text-blue-500" />
                        Loading classes…
                      </div>
                    ) : (
                      <select
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${convertForm.formState.errors.classId ? 'border-red-400' : 'border-gray-200'}`}
                        defaultValue=""
                        onChange={(e) => handleClassChange(Number(e.target.value))}
                      >
                        <option value="" disabled>Select class…</option>
                        {classes.map((c) => (
                          <option key={c.classId} value={c.classId}>{c.className}</option>
                        ))}
                      </select>
                    )}
                    {convertForm.formState.errors.classId && (
                      <p className="text-xs text-red-600 mt-1">{convertForm.formState.errors.classId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${convertForm.formState.errors.sectionId ? 'border-red-400' : 'border-gray-200'} disabled:bg-gray-50 disabled:text-gray-400`}
                      defaultValue=""
                      disabled={sections.length === 0}
                      {...convertForm.register('sectionId')}
                    >
                      <option value="" disabled>
                        {sections.length === 0 ? 'Select a class first' : 'Select section…'}
                      </option>
                      {sections.map((s) => (
                        <option key={s.sectionId} value={s.sectionId}>
                          Section {s.sectionName} (capacity: {s.capacity})
                        </option>
                      ))}
                    </select>
                    {convertForm.formState.errors.sectionId && (
                      <p className="text-xs text-red-600 mt-1">{convertForm.formState.errors.sectionId.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Temporary Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${convertForm.formState.errors.tempPassword ? 'border-red-400' : 'border-gray-200'}`}
                      {...convertForm.register('tempPassword')}
                    />
                    {convertForm.formState.errors.tempPassword && (
                      <p className="text-xs text-red-600 mt-1">{convertForm.formState.errors.tempPassword.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={convertForm.formState.isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {convertForm.formState.isSubmitting
                    ? <><Spinner size="sm" className="text-white" /> Processing…</>
                    : <><AcademicCapIcon className="h-4 w-4" /> Confirm Enrollment</>
                  }
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Status Update */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Update Status
            </h2>
            {isEnrolled ? (
              <div className="flex items-center gap-2 py-3 text-sm text-emerald-700">
                <CheckBadgeIcon className="h-5 w-5" />
                Fully enrolled
              </div>
            ) : (
              <form onSubmit={statusForm.handleSubmit(handleStatusUpdate)} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    New Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusForm.formState.errors.status ? 'border-red-400' : 'border-gray-200'}`}
                    defaultValue={app.status}
                    {...statusForm.register('status')}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  {statusForm.formState.errors.status && (
                    <p className="text-xs text-red-600 mt-1">{statusForm.formState.errors.status.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Optional review notes…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...statusForm.register('remarks')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={statusForm.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {statusForm.formState.isSubmitting
                    ? <><Spinner size="sm" className="text-white" /> Saving…</>
                    : 'Update Status'
                  }
                </button>
              </form>
            )}

            {actionMsg && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700">
                <CheckBadgeIcon className="h-4 w-4 mt-0.5 shrink-0" />
                {actionMsg}
              </div>
            )}
            {actionErr && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <XCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                {actionErr}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Timeline
            </h2>
            <div className="space-y-3">
              <TimelineRow
                icon={<CalendarDaysIcon className="h-3.5 w-3.5" />}
                label="Applied"
                date={app.appliedAt}
                color="blue"
              />
              {app.reviewedAt && (
                <TimelineRow
                  icon={<ClockIcon className="h-3.5 w-3.5" />}
                  label="Reviewed"
                  date={app.reviewedAt}
                  color="amber"
                />
              )}
              {app.convertedAt && (
                <TimelineRow
                  icon={<AcademicCapIcon className="h-3.5 w-3.5" />}
                  label="Enrolled"
                  date={app.convertedAt}
                  color="green"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-xl px-3 py-2">
      <div className="text-blue-200 text-xs">{label}</div>
      <div className="text-white font-semibold text-sm mt-0.5">{value}</div>
    </div>
  );
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function TimelineRow({
  icon, label, date, color,
}: { icon: React.ReactNode; label: string; date: string; color: 'blue' | 'amber' | 'green' }) {
  const dot = {
    blue:  'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
  }[color];

  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${dot}`}>
        {icon}
      </div>
      <div className="flex-1 text-sm text-gray-600">{label}</div>
      <div className="text-xs text-gray-400">{new Date(date).toLocaleDateString()}</div>
    </div>
  );
}
