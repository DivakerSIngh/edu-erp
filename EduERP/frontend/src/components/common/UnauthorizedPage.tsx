import { Link } from 'react-router-dom';
import { ROUTES } from '../../router/routeConstants';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <div className="text-6xl font-bold text-red-400 mb-4">403</div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h1>
      <p className="text-gray-500 mb-6">
        You don't have permission to view this page.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
