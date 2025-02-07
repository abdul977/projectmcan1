import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/use-admin';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();
  const { isAdminUser, loading } = useAdmin();
  const location = useLocation();

  if (!user) {
    // Redirect them to the login page with a return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    // Show loading spinner while checking admin status
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAdminUser) {
    // If not admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  // If admin, render the protected content
  return <>{children}</>;
}