import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminUser {
  id: string;
  role: 'admin' | 'manager' | 'user';
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      checkAdminAccess();
    }
  }, [authLoading]);

  async function checkAdminAccess() {
    try {
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!data || (data.role !== 'admin' && data.role !== 'manager')) {
        toast.error('Unauthorized access');
        navigate('/');
        return;
      }

      setAdminUser(data);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role indicator */}
        <div className="bg-white rounded-lg shadow px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Logged in as:</span>
            <span className="text-sm font-medium capitalize">{adminUser.role}</span>
          </div>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-lg shadow">
          {children}
        </div>
      </div>
    </div>
  );
}