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
      <div className="text-gray-400">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
  );
}

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm ' +
  'transition focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 outline-none';

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
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-700">
        {pageError}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
            <AcademicCapIcon className="h-5 w-5 text-purple-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Examination' : 'New Examination'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeader icon={<AcademicCapIcon className="h-4 w-4" />} title="Examination Details" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Examination Name" required error={errors.examName?.message}>
                <input {...register('examName')} placeholder="e.g. Mid-Term Examination 2026" className={INPUT} />
              </Field>
            </div>

            <Field label="Exam Type" required error={errors.examType?.message}>
              <select {...register('examType')} className={INPUT}>
                <option value="">Select type</option>
                {EXAM_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Academic Year" required error={errors.academicYearId?.message}>
              <select {...register('academicYearId')} className={INPUT}>
                <option value="">Select year</option>
                {years.map(y => (
                  <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
                ))}
              </select>
            </Field>

            <Field label="Class" required error={errors.classId?.message}>
              <select
                {...register('classId')}
                disabled={!academicYearId || classes.length === 0}
                className={INPUT + ' disabled:opacity-50'}
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

        {/* Dates */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeader icon={<CalendarDaysIcon className="h-4 w-4" />} title="Schedule" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required error={errors.startDate?.message}>
              <input type="date" {...register('startDate')} className={INPUT} />
            </Field>
            <Field label="End Date" required error={errors.endDate?.message}>
              <input type="date" {...register('endDate')} className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Marks */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeader icon={<CheckCircleIcon className="h-4 w-4" />} title="Marks Configuration" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Maximum Marks" required error={errors.maxMarks?.message}>
              <input type="number" step="0.5" min="1" {...register('maxMarks')} className={INPUT} />
            </Field>
            <Field label="Pass Marks" required error={errors.passMarks?.message}>
              <input type="number" step="0.5" min="1" {...register('passMarks')} className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Error */}
        {submitError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Spinner size="sm" className="text-white" /> Saving…</>
            ) : (
              <><CheckCircleIcon className="h-4 w-4" /> {isEdit ? 'Update' : 'Create'} Examination</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
