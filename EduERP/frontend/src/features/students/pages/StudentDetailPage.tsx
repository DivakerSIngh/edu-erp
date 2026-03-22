import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { studentService } from '../services/studentService';
import type { StudentDetail, StudentStatus } from '../types/student.types';
import Spinner from '../../../components/ui/Spinner';
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  HomeIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StudentStatus, string> = {
  Active:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  Inactive:  'bg-red-100    text-red-800    border-red-200',
  Graduated: 'bg-blue-100   text-blue-800   border-blue-200',
};

// ── Edit Schema ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName:  z.string().min(1, 'Required').max(100),
  email:     z.string().email('Invalid email').max(256).optional().or(z.literal('')),
  phone:     z.string().max(20).optional().or(z.literal('')),
  address:   z.string().max(500).optional().or(z.literal('')),
  status:    z.enum(['Active', 'Inactive', 'Graduated']),
});
type EditValues = z.infer<typeof editSchema>;

// ── Info row helper ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();

  const [student,   setStudent]   = useState<StudentDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [showEdit,  setShowEdit]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState<string | null>(null);
  const [saveOk,    setSaveOk]    = useState(false);
  const [showDel,   setShowDel]   = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const form = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (!id) return;
    studentService.getById(Number(id))
      .then((res) => {
        setStudent(res.data);
        const names = res.data.fullName.split(' ');
        form.reset({
          firstName: names[0] ?? '',
          lastName:  (names.slice(1).join(' ') || names[0]) ?? '',
          email:     res.data.email ?? '',
          phone:     res.data.phone ?? '',
          address:   res.data.address ?? '',
          status:    res.data.status,
        });
      })
      .catch(() => setError('Student not found.'))
      .finally(() => setLoading(false));
  }, [id, form]);

  const onSave = async (values: EditValues) => {
    setSaveErr(null);
    setSaving(true);
    try {
      await studentService.update(Number(id), {
        firstName: values.firstName,
        lastName:  values.lastName,
        email:     values.email || undefined,
        phone:     values.phone || undefined,
        address:   values.address || undefined,
        status:    values.status,
      });
      // Refresh detail
      const res = await studentService.getById(Number(id));
      setStudent(res.data);
      setShowEdit(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveErr(msg ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentService.delete(Number(id));
      navigate('/students');
    } catch {
      setDeleting(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) return <div className="-m-6 flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  if (error || !student) return (
    <div className="-m-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-red-600 font-medium">{error ?? 'Student not found.'}</p>
      <button onClick={() => navigate('/students')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Students
      </button>
    </div>
  );

  const [firstName, ...restNames] = student.fullName.split(' ');
  const initials = `${firstName?.charAt(0) ?? ''}${restNames[0]?.charAt(0) ?? ''}`.toUpperCase() || student.fullName.charAt(0).toUpperCase();

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-0px)] bg-gray-50">

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 pt-6 pb-16 shrink-0">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-5 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Students
        </button>
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-white/20 ring-2 ring-white/40 flex items-center justify-center shrink-0">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white">{student.fullName}</h1>
            <p className="text-indigo-200 text-sm mt-0.5 font-mono">{student.enrollmentNumber}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[student.status]} bg-white`}>
                {student.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/20 text-white text-xs px-2.5 py-0.5 font-medium">
                {student.className} — {student.section}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/20 text-white text-xs px-2.5 py-0.5 font-medium">
                {student.academicYear}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { setShowEdit(true); setSaveErr(null); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <PencilSquareIcon className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => setShowDel(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <TrashIcon className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Cards grid ─────────────────────────────────────────────────────── */}
      <div className="px-8 -mt-10 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Personal info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 col-span-1">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-indigo-500" /> Personal Information
          </h3>
          <InfoRow icon={<CalendarDaysIcon className="h-4 w-4" />} label="Date of Birth"   value={student.dateOfBirth} />
          <InfoRow icon={<UserIcon         className="h-4 w-4" />} label="Gender"          value={student.gender} />
          <InfoRow icon={<StarIcon         className="h-4 w-4" />} label="Blood Group"     value={student.bloodGroup} />
          <InfoRow icon={<EnvelopeIcon     className="h-4 w-4" />} label="Email"           value={student.email} />
          <InfoRow icon={<PhoneIcon        className="h-4 w-4" />} label="Phone"           value={student.phone} />
          <InfoRow icon={<HomeIcon         className="h-4 w-4" />} label="Address"         value={student.address} />
        </div>

        {/* Academic info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 col-span-1">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <AcademicCapIcon className="h-4 w-4 text-blue-500" /> Academic Details
          </h3>
          <InfoRow icon={<AcademicCapIcon  className="h-4 w-4" />} label="Class"           value={`${student.className} — ${student.section}`} />
          <InfoRow icon={<CalendarDaysIcon className="h-4 w-4" />} label="Academic Year"   value={student.academicYear} />
          <InfoRow icon={<ClockIcon        className="h-4 w-4" />} label="Admission Date"  value={student.admissionDate} />
          <InfoRow icon={<CheckCircleIcon  className="h-4 w-4" />} label="Attendance"      value={`${student.attendancePercentage?.toFixed(1) ?? 0}%`} />

          {/* Attendance bar */}
          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Attendance</span>
              <span className="font-semibold">{student.attendancePercentage?.toFixed(1) ?? 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(student.attendancePercentage ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Emergency + Parents */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-red-500" /> Emergency Contact
            </h3>
            <InfoRow icon={<UserIcon  className="h-4 w-4" />} label="Name"  value={student.emergencyContactName} />
            <InfoRow icon={<PhoneIcon className="h-4 w-4" />} label="Phone" value={student.emergencyContactPhone} />
          </div>

          {student.parents && student.parents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-violet-500" /> Parents / Guardians
              </h3>
              <div className="space-y-3">
                {student.parents.map((p) => (
                  <div key={p.parentId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <span className="text-violet-700 font-semibold text-sm">{p.fullName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.fullName}</p>
                      <p className="text-xs text-gray-500">{p.relationship} · {p.phoneNumber || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Save success toast ─────────────────────────────────────────────── */}
      {saveOk && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
          <CheckCircleIcon className="h-5 w-5" />
          Student updated successfully.
        </div>
      )}

      {/* ── Edit panel (slide-over style) ─────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-40 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Student</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={form.handleSubmit(onSave)} className="flex-1 px-6 py-6 space-y-4">
              {saveErr && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{saveErr}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                  <input {...form.register('firstName')} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  {form.formState.errors.firstName && <p className="text-xs text-red-500 mt-1">{form.formState.errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                  <input {...form.register('lastName')} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  {form.formState.errors.lastName && <p className="text-xs text-red-500 mt-1">{form.formState.errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input {...form.register('email')} type="email" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                {form.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input {...form.register('phone')} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <textarea {...form.register('address')} rows={2} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status *</label>
                <select {...form.register('status')} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEdit(false)} disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ─────────────────────────────────────────────── */}
      {showDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                <TrashIcon className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">Delete Student</h2>
            <p className="text-sm text-gray-500 text-center mt-2">
              Are you sure you want to remove <strong>{student.fullName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDel(false)} disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

