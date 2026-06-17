import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from './ui';

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-slate-400" />
    </div>
  );
}

/** Requires a logged-in user; otherwise redirects to /login. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Requires an admin; users without the role are sent to the submit page. */
export function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/submit" replace />;
  return <Outlet />;
}
