import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { studentService } from '../services/studentService';
import { admissionService } from '../../admission/services/admissionService';
import type { ClassOption, SectionOption, AcademicYear } from '../../admission/types/admission.types';
import Spinner from '../../../components/ui/Spinner';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z.object({
  firstName:              z.string().min(1, 'Required').max(100),
  lastName:               z.string().min(1, 'Required').max(100),
  dateOfBirth:            z.string().min(1, 'Required'),
  gender:                 z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: 'Select a gender' }) }),
  email:                  z.string().email('Invalid email').max(256).optional().or(z.literal('')),
  phone:                  z.string().max(20).optional().or(z.literal('')),
  address:                z.string().max(500).optional().or(z.literal('')),
  bloodGroup:             z.string().max(5).optional().or(z.literal('')),
  academicYearId:         z.coerce.number().min(1, 'Select academic year'),
  classId:                z.coerce.number().min(1, 'Select class'),
  sectionId:              z.coerce.number().min(1, 'Select section'),
  admissionDate:          z.string().min(1, 'Required'),
  emergencyContactName:   z.string().max(200).optional().or(z.literal('')),
  emergencyContactPhone:  z.string().max(20).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

// ── Field wrapper ─────────────────────────────────────────────────────────────

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

// ── Section header ────────────────────────────────────────────────────────────

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

export default function StudentFormPage() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const isEdit    = Boolean(id);

  const [academicYears,   setAcademicYears]   = useState<AcademicYear[]>([]);
  const [classes,         setClasses]         = useState<ClassOption[]>([]);
  const [sections,        setSections]        = useState<SectionOption[]>([]);
  const [loadingClasses,  setLoadingClasses]  = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [submitError,     setSubmitError]     = useState<string | null>(null);
  const [loadingStudent,  setLoadingStudent]  = useState(isEdit);
  const [created,         setCreated]         = useState<{ id: number; enrollment: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const watchedAcademicYear = watch('academicYearId');
  const watchedClass        = watch('classId');

  // ── Load academic years on mount ──────────────────────────────────────────

  useEffect(() => {
    admissionService.getAcademicYears().then((res) => {
      if (res.data) setAcademicYears(res.data);
    });
  }, []);

  // ── Load classes when academic year changes ───────────────────────────────

  useEffect(() => {
    const yr = Number(watchedAcademicYear);
    if (!yr) { setClasses([]); setSections([]); return; }
    setLoadingClasses(true);
    admissionService.getClasses(yr)
      .then((res) => setClasses(res.data ?? []))
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));
    setValue('classId', 0 as never);
    setValue('sectionId', 0 as never);
    setSections([]);
  }, [watchedAcademicYear, setValue]);

  // ── Load sections when class changes ─────────────────────────────────────

  useEffect(() => {
    const cls = Number(watchedClass);
    if (!cls) { setSections([]); return; }
    setLoadingSections(true);
    admissionService.getSections(cls)
      .then((res) => setSections(res.data ?? []))
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false));
    setValue('sectionId', 0 as never);
  }, [watchedClass, setValue]);

  // ── Load existing student in edit mode ────────────────────────────────────

  useEffect(() => {
    if (!isEdit || !id) return;
    studentService.getById(Number(id))
      .then(async (res) => {
        const s = res.data;
        const names = s.fullName.split(' ');
        setValue('firstName',    names[0] ?? '');
        setValue('lastName',     (names.slice(1).join(' ') || names[0]) ?? '');
        setValue('dateOfBirth',  s.dateOfBirth?.split('T')[0] ?? '');
        setValue('gender',       s.gender as 'Male' | 'Female' | 'Other');
        setValue('email',        s.email ?? '');
        setValue('phone',        s.phone ?? '');
        setValue('address',      s.address ?? '');
        setValue('admissionDate', s.admissionDate?.split('T')[0] ?? '');
        setValue('emergencyContactName',  s.emergencyContactName ?? '');
        setValue('emergencyContactPhone', s.emergencyContactPhone ?? '');
        setValue('academicYearId', s.academicYearId);

        // Load classes for this academic year, then set classId + sectionId
        if (s.academicYearId) {
          const clsRes = await admissionService.getClasses(s.academicYearId).catch(() => null);
          setClasses(clsRes?.data ?? []);
          setValue('classId', s.classId);

          if (s.classId) {
            const secRes = await admissionService.getSections(s.classId).catch(() => null);
            setSections(secRes?.data ?? []);
            setValue('sectionId', s.sectionId);
          }
        }
      })
      .catch(() => setSubmitError('Could not load student data.'))
      .finally(() => setLoadingStudent(false));
  }, [isEdit, id, setValue]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      if (isEdit) {
        await studentService.update(Number(id), {
          firstName: values.firstName,
          lastName:  values.lastName,
          email:     values.email || undefined,
          phone:     values.phone || undefined,
          address:   values.address || undefined,
          classId:   values.classId,
          sectionId: values.sectionId,
          status:    'Active',
        });
        navigate(`/students/${id}`);
      } else {
        const res = await studentService.create({
          firstName:              values.firstName,
          lastName:               values.lastName,
          dateOfBirth:            values.dateOfBirth,
          gender:                 values.gender,
          email:                  values.email || undefined,
          phone:                  values.phone || undefined,
          address:                values.address || undefined,
          bloodGroup:             values.bloodGroup || undefined,
          academicYearId:         values.academicYearId,
          classId:                values.classId,
          sectionId:              values.sectionId,
          admissionDate:          values.admissionDate,
          emergencyContactName:   values.emergencyContactName || undefined,
          emergencyContactPhone:  values.emergencyContactPhone || undefined,
        });
        setCreated({ id: res.data.studentId, enrollment: res.data.enrollmentNumber });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg ?? 'Failed to save. Please try again.');
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (created) {
    return (
      <div className="-m-6 min-h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100 p-12 max-w-lg w-full text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon className="w-11 h-11 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Student Added!</h2>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            The student has been registered successfully.
          </p>
          <div className="mt-6 px-6 py-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Enrollment Number</p>
            <p className="mt-1 font-mono text-2xl font-bold text-indigo-700">{created.enrollment}</p>
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/students/${created.id}`)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              View Profile
            </button>
            <button
              onClick={() => navigate('/students/new')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Add Another
            </button>
            <button
              onClick={() => navigate('/students')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              All Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingStudent) {
    return <div className="-m-6 flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="-m-6 flex min-h-[calc(100vh-0px)] bg-gray-50">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-gradient-to-b from-indigo-600 to-blue-700 p-8 text-white">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm mb-8 transition-colors w-fit"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Students
        </button>

        <div className="mb-8">
          <div className="h-16 w-16 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center mb-4">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">{isEdit ? 'Edit Student' : 'Add New Student'}</h1>
          <p className="mt-2 text-indigo-200 text-sm leading-relaxed">
            {isEdit
              ? 'Update the student\'s information below.'
              : 'Fill in the details to register a new student in the system.'}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="space-y-4">
          {[
            { icon: <UserIcon className="h-4 w-4" />,           label: 'Personal Info' },
            { icon: <AcademicCapIcon className="h-4 w-4" />,    label: 'Academic Details' },
            { icon: <PhoneIcon className="h-4 w-4" />,          label: 'Contact & Address' },
            { icon: <IdentificationIcon className="h-4 w-4" />, label: 'Emergency Contact' },
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

      {/* ── Form area ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {/* Mobile back */}
        <div className="lg:hidden px-6 pt-5">
          <button onClick={() => navigate('/students')} className="flex items-center gap-1.5 text-blue-600 hover:underline text-sm">
            <ArrowLeftIcon className="h-4 w-4" /> Back to Students
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-6 py-8 space-y-8">

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* ── Section: Personal Info ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<UserIcon className="h-5 w-5" />} title="Personal Information" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required error={errors.firstName?.message}>
                <input {...register('firstName')} className={inputCls} placeholder="Arjun" />
              </Field>
              <Field label="Last Name" required error={errors.lastName?.message}>
                <input {...register('lastName')} className={inputCls} placeholder="Sharma" />
              </Field>
              <Field label="Date of Birth" required error={errors.dateOfBirth?.message}>
                <input {...register('dateOfBirth')} type="date" className={inputCls} />
              </Field>
              <Field label="Gender" required error={errors.gender?.message}>
                <select {...register('gender')} className={inputCls}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Blood Group" error={errors.bloodGroup?.message}>
                <select {...register('bloodGroup')} className={inputCls}>
                  <option value="">Select (optional)</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                    <option key={bg}>{bg}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* ── Section: Academic Details ─────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<AcademicCapIcon className="h-5 w-5" />} title="Academic Details" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Academic Year" required error={errors.academicYearId?.message}>
                <select {...register('academicYearId')} className={inputCls}>
                  <option value={0}>Select year</option>
                  {academicYears.map((y) => (
                    <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
                  ))}
                </select>
              </Field>
              <Field label="Class" required error={errors.classId?.message}>
                <select {...register('classId')} className={inputCls} disabled={loadingClasses || classes.length === 0}>
                  <option value={0}>{loadingClasses ? 'Loading…' : 'Select class'}</option>
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>{c.className}</option>
                  ))}
                </select>
              </Field>
              <Field label="Section" required error={errors.sectionId?.message}>
                <select {...register('sectionId')} className={inputCls} disabled={loadingSections || sections.length === 0}>
                  <option value={0}>{loadingSections ? 'Loading…' : 'Select section'}</option>
                  {sections.map((s) => (
                    <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                  ))}
                </select>
              </Field>
              <Field label="Admission Date" required error={errors.admissionDate?.message}>
                <input {...register('admissionDate')} type="date" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── Section: Contact ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<PhoneIcon className="h-5 w-5" />} title="Contact Information" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="student@example.com" className={inputCls} />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="+91 9876543210" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Address" error={errors.address?.message}>
                  <textarea {...register('address')} rows={2} placeholder="Street, City, State" className={`${inputCls} resize-none`} />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Section: Emergency Contact ───────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<IdentificationIcon className="h-5 w-5" />} title="Emergency Contact" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name" error={errors.emergencyContactName?.message}>
                <input {...register('emergencyContactName')} placeholder="Parent / Guardian name" className={inputCls} />
              </Field>
              <Field label="Contact Phone" error={errors.emergencyContactPhone?.message}>
                <input {...register('emergencyContactPhone')} placeholder="+91 9876543210" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <div className="flex gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="flex-1 py-3 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Spinner /> : null}
              {isEdit ? 'Save Changes' : 'Register Student'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

