import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import type { UserRole } from '../../features/auth/types/auth.types';
import { ROUTES } from '../../router/routeConstants';

interface RoleGuardProps {
  /** One or more roles that are permitted to access the route */
  allowedRoles: UserRole[];
  children: React.ReactElement;
}

/**
 * Protects routes by role.
 *
 * Must be used INSIDE an AuthGuard — assumes user is already authenticated.
 * If the user's role is not in allowedRoles, redirects to /unauthorized.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const userRole = useAppSelector((s) => s.auth.user?.role);

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children;
};

export default RoleGuard;
