import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { UserList } from '@/components/admin/UserList';
import { PaymentVerification } from '@/components/admin/PaymentVerification';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { supabase } from '@/lib/supabase';
import {
  Users,
  BookOpen,
  CreditCard,
  MessageSquare,
  BarChart,
  Settings,
  LogOut,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'users' | 'bookings' | 'payments' | 'feedback' | 'settings' | 'letters';
type UserRole = 'admin' | 'manager' | 'user';

interface AdminUser {
  id: string;
  role: UserRole;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const navigateToConfirmationLetters = () => {
    navigate('/admin/confirmation-letter');
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Admin Dashboard</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                <Button
                  variant={activeTab === 'overview' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('overview')}
                >
                  <BarChart className="h-5 w-5 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Users
                </Button>
                <Button
                  variant={activeTab === 'bookings' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('bookings')}
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Bookings
                </Button>
                <Button
                  variant={activeTab === 'payments' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('payments')}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payments
                </Button>
                <Button
                  variant={activeTab === 'letters' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={navigateToConfirmationLetters}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Confirmation Letters
                </Button>
                {adminUser.role === 'admin' && (
                  <>
                    <Button
                      variant={activeTab === 'feedback' ? 'primary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('feedback')}
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Feedback
                    </Button>
                    <Button
                      variant={activeTab === 'settings' ? 'primary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('settings')}
                    >
                      <Settings className="h-5 w-5 mr-2" />
                      Settings
                    </Button>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Role indicator */}
            <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Logged in as:</span>
                <span className="text-sm font-medium capitalize">{adminUser.role}</span>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>

            {/* Tab content */}
            {activeTab === 'users' && <UserList />}
            {activeTab === 'payments' && <PaymentVerification />}
            {activeTab === 'overview' && <DashboardStats />}

            {activeTab === 'bookings' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Bookings Management</h2>
                <p className="text-gray-500">Bookings management will be available soon.</p>
              </div>
            )}

            {activeTab === 'feedback' && adminUser.role === 'admin' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Feedback</h2>
                <p className="text-gray-500">No feedback available.</p>
              </div>
            )}

            {activeTab === 'settings' && adminUser.role === 'admin' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Settings</h2>
                <p className="text-gray-500">Admin settings will be available soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}