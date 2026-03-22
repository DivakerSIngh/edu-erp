import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { ROUTES } from '../../router/routeConstants';

interface AuthGuardProps {
  children: React.ReactElement;
}

/**
 * Protects routes that require authentication.
 *
 * Behaviour:
 *  - While session is initializing (first app load): shows a loading spinner
 *  - If not authenticated: redirects to /login, preserving the intended destination
 *  - If authenticated: renders children
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location        = useLocation();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isInitializing  = useAppSelector((s) => s.auth.isInitializing);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the path user was trying to reach so we can redirect after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;
