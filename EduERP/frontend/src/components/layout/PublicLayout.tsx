import { Outlet } from 'react-router-dom';

/** Full-screen wrapper for auth pages (Login, OTP login). */
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex">
      <Outlet />
    </div>
  );
}
