import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { examinationService } from '../services/examinationService';
import { admissionService } from '../../admission/services/admissionService';
import type { AcademicYear, ClassOption } from '../../admission/types/admission.types';
import type { ExamType } from '../types/examination.types';
import { ROUTES } from '../../../router/routeConstants';
import Spinner from '../../../components/ui/Spinner';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  examName:       z.string().min(1, 'Required').max(200),
  examType:       z.enum(['Unit', 'MidTerm', 'Final', 'Remedial'], {
    errorMap: () => ({ message: 'Select an exam type' }),
  }),
  academicYearId: z.coerce.number().min(1, 'Select academic year'),
  classId:        z.coerce.number().min(1, 'Select class'),
  startDate:      z.string().min(1, 'Required'),
  endDate:        z.string().min(1, 'Required'),
  maxMarks:       z.coerce.number().min(1, 'Must be at least 1').max(9999),
  passMarks:      z.coerce.number().min(1, 'Must be at least 1').max(9999),
}).refine(d => d.endDate >= d.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
}).refine(d => d.passMarks <= d.maxMarks, {
  message: 'Pass marks cannot exceed max marks',
  path: ['passMarks'],
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <div className="text-indigo-500">{icon}</div>
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow';

// ── Main component ────────────────────────────────────────────────────────────

const EXAM_TYPES: Array<{ label: string; value: ExamType }> = [
  { label: 'Unit Test',  value: 'Unit' },
  { label: 'Mid-Term',   value: 'MidTerm' },
  { label: 'Final',      value: 'Final' },
  { label: 'Remedial',   value: 'Remedial' },
];

export default function ExaminationFormPage() {
  const navigate       = useNavigate();
  const { id }         = useParams<{ id: string }>();
  const isEdit         = Boolean(id);

  const [pageLoading, setPageLoading] = useState(isEdit);
  const [pageError,   setPageError]   = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [years,   setYears]   = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver:      zodResolver(schema),
    defaultValues: { maxMarks: 100, passMarks: 40 },
  });

  const academicYearId = watch('academicYearId');

  // Load academic years
  useEffect(() => {
    admissionService.getAcademicYears()
      .then(r => setYears(r.data ?? []))
      .catch(() => {});
  }, []);

  // Load classes when AY changes
  useEffect(() => {
    if (academicYearId) {
      admissionService.getClasses(academicYearId)
        .then(r => setClasses(r.data ?? []))
        .catch(() => {});
    } else {
      setClasses([]);
    }
  }, [academicYearId]);

  // Pre-fill form when editing
  useEffect(() => {
    if (!isEdit || !id) return;
    setPageLoading(true);
    examinationService.getById(+id)
      .then(res => {
        const d = res.data;
        setValue('examName',       d.examName);
        setValue('examType',       d.examType);
        setValue('academicYearId', d.academicYearId);
        setValue('classId',        d.classId);
        setValue('startDate',      d.startDate);
        setValue('endDate',        d.endDate);
        setValue('maxMarks',       d.maxMarks);
        setValue('passMarks',      d.passMarks);
      })
      .catch(() => setPageError('Failed to load examination details.'))
      .finally(() => setPageLoading(false));
  }, [isEdit, id, setValue]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      if (isEdit && id) {
        await examinationService.update(+id, values);
        navigate(ROUTES.EXAMINATION_DETAIL.replace(':id', id));
      } else {
        const res = await examinationService.create(values);
        navigate(ROUTES.EXAMINATION_DETAIL.replace(':id', String(res.data.examinationId)));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Save failed. Please try again.';
      setSubmitError(msg);
    }
  };

  if (pageLoading) {
    return <div className="-m-6 flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  if (pageError) {
    return (
      <div className="-m-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 font-medium">{pageError}</p>
        <button onClick={() => navigate(ROUTES.EXAMINATIONS)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Examinations
        </button>
      </div>
    );
  }

  return (
    <div className="-m-6 flex min-h-[calc(100vh-0px)] bg-gray-50">

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-gradient-to-b from-indigo-600 to-blue-700 p-8 text-white">
        <button
          onClick={() => navigate(ROUTES.EXAMINATIONS)}
          className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm mb-8 transition-colors w-fit"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Examinations
        </button>

        <div className="mb-8">
          <div className="h-16 w-16 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center mb-4">
            <AcademicCapIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">{isEdit ? 'Edit Examination' : 'New Examination'}</h1>
          <p className="mt-2 text-indigo-200 text-sm leading-relaxed">
            {isEdit
              ? 'Update the examination details below.'
              : 'Fill in the details to create a new examination.'}
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: <AcademicCapIcon    className="h-4 w-4" />, label: 'Exam Details' },
            { icon: <CalendarDaysIcon   className="h-4 w-4" />, label: 'Schedule' },
            { icon: <StarIcon           className="h-4 w-4" />, label: 'Marks Configuration' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white">
                {step.icon}
              </div>
              <span className="text-sm text-indigo-100">{step.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Form area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="lg:hidden px-6 pt-5">
          <button onClick={() => navigate(ROUTES.EXAMINATIONS)} className="flex items-center gap-1.5 text-blue-600 hover:underline text-sm">
            <ArrowLeftIcon className="h-4 w-4" /> Back to Examinations
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-6 py-8 space-y-8">

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* ── Section: Exam Details ────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<AcademicCapIcon className="h-5 w-5" />} title="Examination Details" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Examination Name" required error={errors.examName?.message}>
                  <input {...register('examName')} placeholder="e.g. Mid-Term Examination 2026" className={inputCls} />
                </Field>
              </div>
              <Field label="Exam Type" required error={errors.examType?.message}>
                <select {...register('examType')} className={inputCls}>
                  <option value="">Select type</option>
                  {EXAM_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Academic Year" required error={errors.academicYearId?.message}>
                <select {...register('academicYearId')} className={inputCls}>
                  <option value="">Select year</option>
                  {years.map(y => (
                    <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
                  ))}
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Class" required error={errors.classId?.message}>
                  <select
                    {...register('classId')}
                    disabled={!academicYearId || classes.length === 0}
                    className={inputCls + ' disabled:opacity-50'}
                  >
                    <option value="">
                      {!academicYearId ? 'Select year first' : classes.length === 0 ? 'Loading…' : 'Select class'}
                    </option>
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>{c.className}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* ── Section: Schedule ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<CalendarDaysIcon className="h-5 w-5" />} title="Schedule" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date" required error={errors.startDate?.message}>
                <input type="date" {...register('startDate')} className={inputCls} />
              </Field>
              <Field label="End Date" required error={errors.endDate?.message}>
                <input type="date" {...register('endDate')} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── Section: Marks Configuration ──────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<StarIcon className="h-5 w-5" />} title="Marks Configuration" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Maximum Marks" required error={errors.maxMarks?.message}>
                <input type="number" step="0.5" min="1" {...register('maxMarks')} className={inputCls} />
              </Field>
              <Field label="Pass Marks" required error={errors.passMarks?.message}>
                <input type="number" step="0.5" min="1" {...register('passMarks')} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate(ROUTES.EXAMINATIONS)}
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Spinner /> : <CheckCircleIcon className="h-4 w-4" />}
              {isEdit ? 'Save Changes' : 'Create Examination'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
