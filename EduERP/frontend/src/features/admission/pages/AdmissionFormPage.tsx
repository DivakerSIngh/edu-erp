import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { admissionService } from '../services/admissionService';
import type { AcademicYear } from '../types/admission.types';
import Spinner from '../../../components/ui/Spinner';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

// ── Validation Schema ─────────────────────────────────────────────────────────

const schema = z.object({
  applicantName:    z.string().min(2, 'Required').max(200),
  dateOfBirth:      z.string().min(1, 'Required'),
  gender:           z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: 'Select a gender' }) }),
  applyingForClass: z.string().min(1, 'Required').max(100),
  academicYearId:   z.coerce.number().min(1, 'Select an academic year'),
  parentName:       z.string().min(2, 'Required').max(200),
  parentEmail:      z.string().email('Enter a valid email'),
  parentPhone:      z.string().min(7, 'Required').max(20),
  previousSchool:   z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdmissionFormPage() {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [submitError,   setSubmitError]   = useState<string | null>(null);
  const [submitted,     setSubmitted]     = useState<{ ref: string; id: number } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    admissionService.getAcademicYears().then((res) => {
      if (res.data) setAcademicYears(res.data);
    });
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const res = await admissionService.submit(values);
      setSubmitted({ ref: res.data.referenceNumber, id: res.data.applicationId });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg ?? 'Submission failed. Please try again.');
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="-m-6 min-h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100 p-12 max-w-lg w-full text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon className="w-11 h-11 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Application Submitted!</h2>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            Your admission application has been received. Keep the reference number below for status updates.
          </p>
          <div className="mt-6 px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Reference Number</p>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-700">{submitted.ref}</p>
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <button onClick={() => navigate(`/admission/${submitted.id}`)} className="btn-primary flex-1">
              View Application
            </button>
            <button onClick={() => navigate('/admission')} className="btn-secondary flex-1">
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate('/admission')}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">New Admission Application</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fill in all required details to submit the application</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <ClipboardDocumentCheckIcon className="w-4 h-4" />
          Academic Admissions
        </div>
      </div>

      {/* ── Body: sidebar + form ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar: info ─────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 flex-col bg-gradient-to-b from-blue-700 to-blue-900 text-white p-8 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">EduERP Admissions</span>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {[
              { icon: UserIcon,           title: 'Student Details',    desc: 'Name, DOB, gender & class' },
              { icon: AcademicCapIcon,    title: 'Academic Info',      desc: 'Year, class & previous school' },
              { icon: PhoneIcon,          title: 'Parent / Guardian',  desc: 'Contact name, phone & email' },
              { icon: DocumentTextIcon,   title: 'Review & Submit',    desc: 'Verify all details before submitting' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-xs text-white/60 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info box */}
          <div className="mt-auto pt-8">
            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Need help?</p>
              <p className="text-xs text-white/60 leading-relaxed">
                Contact the admissions office at admissions@eduerp.edu or call +91 98000 00000
              </p>
            </div>
          </div>
        </aside>

        {/* ── Right: scrollable form area ─────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-10">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl mx-auto space-y-8">

            {/* ── Student Information ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Student Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Full Name *</label>
                  <input className={`input ${errors.applicantName ? 'input-error' : ''}`} placeholder="e.g. Aditya Sharma" {...register('applicantName')} />
                  {errors.applicantName && <p className="mt-1 text-xs text-red-600">{errors.applicantName.message}</p>}
                </div>
                <div>
                  <label className="label">Date of Birth *</label>
                  <input type="date" className={`input ${errors.dateOfBirth ? 'input-error' : ''}`} {...register('dateOfBirth')} />
                  {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select className={`input ${errors.gender ? 'input-error' : ''}`} {...register('gender')}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>}
                </div>
                <div>
                  <label className="label">Applying for Class *</label>
                  <input
                    className={`input ${errors.applyingForClass ? 'input-error' : ''}`}
                    placeholder="e.g. Grade 10"
                    {...register('applyingForClass')}
                  />
                  {errors.applyingForClass && <p className="mt-1 text-xs text-red-600">{errors.applyingForClass.message}</p>}
                </div>
                <div>
                  <label className="label">Academic Year *</label>
                  <select className={`input ${errors.academicYearId ? 'input-error' : ''}`} {...register('academicYearId')}>
                    <option value={0}>Select year</option>
                    {academicYears.map((y) => (
                      <option key={y.academicYearId} value={y.academicYearId}>
                        {y.yearName}{y.isCurrent ? ' (Current)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.academicYearId && <p className="mt-1 text-xs text-red-600">{errors.academicYearId.message}</p>}
                </div>
                <div>
                  <label className="label">Previous School</label>
                  <input className="input" placeholder="Optional" {...register('previousSchool')} />
                </div>
              </div>
            </section>

            {/* ── Parent / Guardian Information ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <PhoneIcon className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Parent / Guardian Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Parent / Guardian Name *</label>
                  <input className={`input ${errors.parentName ? 'input-error' : ''}`} placeholder="e.g. Ramesh Sharma" {...register('parentName')} />
                  {errors.parentName && <p className="mt-1 text-xs text-red-600">{errors.parentName.message}</p>}
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input className={`input ${errors.parentPhone ? 'input-error' : ''}`} placeholder="+91 98000 00000" {...register('parentPhone')} />
                  {errors.parentPhone && <p className="mt-1 text-xs text-red-600">{errors.parentPhone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Email Address *</label>
                  <input type="email" className={`input ${errors.parentEmail ? 'input-error' : ''}`} placeholder="parent@example.com" {...register('parentEmail')} />
                  {errors.parentEmail && <p className="mt-1 text-xs text-red-600">{errors.parentEmail.message}</p>}
                </div>
              </div>
            </section>

            {/* ── Error & Submit ── */}
            {submitError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="flex justify-end gap-3 pb-4">
              <button type="button" onClick={() => navigate('/admission')} className="btn-secondary px-8">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary px-8 min-w-[160px]">
                {isSubmitting ? <Spinner size="sm" className="text-white" /> : 'Submit Application'}
              </button>
            </div>

          </form>
        </main>

      </div>
    </div>
  );
}
