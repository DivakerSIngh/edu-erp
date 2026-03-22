import clsx from 'clsx';

interface Props {
  page:       number;
  totalPages: number;
  totalCount: number;
  pageSize:   number;
  onPage:     (page: number) => void;
}

export default function Pagination({ page, totalPages, totalCount, pageSize, onPage }: Props) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, totalCount);

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{start}</span>–
          <span className="font-medium">{end}</span> of{' '}
          <span className="font-medium">{totalCount}</span> results
        </p>

        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            className={clsx(
              'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400',
              'ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            &laquo;
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span
                key={`ellipsis-${i}`}
                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
              >
                &hellip;
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                aria-current={p === page ? 'page' : undefined}
                className={clsx(
                  'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300',
                  p === page
                    ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2'
                    : 'text-gray-900 hover:bg-gray-50 focus:z-20'
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPage(page + 1)}
            disabled={page === totalPages}
            className={clsx(
              'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400',
              'ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            &raquo;
          </button>
        </nav>
      </div>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const around = [current - 1, current, current + 1].filter((p) => p > 1 && p < total);
  pages.push(...around);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
