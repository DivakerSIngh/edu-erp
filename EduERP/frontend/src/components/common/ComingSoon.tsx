/** Generic "coming soon" placeholder used for modules not yet implemented. */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
      <p className="text-gray-400 mt-2 text-sm">This module is under development.</p>
    </div>
  );
}
