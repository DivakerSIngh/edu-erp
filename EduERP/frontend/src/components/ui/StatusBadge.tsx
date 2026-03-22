import clsx from 'clsx';
import type { AdmissionStatus } from '../../features/admission/types/admission.types';

const STYLES: Record<AdmissionStatus, string> = {
  Pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  Reviewed: 'bg-blue-100   text-blue-800   border-blue-200',
  Accepted: 'bg-green-100  text-green-800  border-green-200',
  Rejected: 'bg-red-100    text-red-800    border-red-200',
  Enrolled: 'bg-purple-100 text-purple-800 border-purple-200',
};

interface Props {
  status: AdmissionStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STYLES[status],
        className
      )}
    >
      {status}
    </span>
  );
}
