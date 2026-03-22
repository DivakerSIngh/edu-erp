import clsx from 'clsx';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export default function Spinner({ className, size = 'md' }: Props) {
  return (
    <span
      aria-label="Loading"
      className={clsx(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        SIZE[size],
        className
      )}
    />
  );
}
