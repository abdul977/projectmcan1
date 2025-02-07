import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, BookOpen, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface Stats {
  totalUsers: number;
  activeBookings: number;
  pendingPayments: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeBookings: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);

      // Get current user session first
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData.user) throw new Error('Not authenticated');
      
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionData.user.id)
        .single();

      if (userError || !currentUser || !['admin', 'manager'].includes(currentUser.role)) {
        throw new Error('Unauthorized access - admin privileges required');
      }

      // Get all non-deleted users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .neq('status', 'deleted');

      
      if (usersError) {
        console.error('Users query error:', usersError);
        throw usersError;
      }

      // Get active bookings (confirmed and not cancelled)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .eq('payment_status', 'paid');

      if (bookingsError) {
        console.error('Bookings query error:', bookingsError);
        throw bookingsError;
      }

      // Get all payment receipts and their latest verification status
      const { data: receipts, error: receiptsError } = await supabase
        .from('payment_receipts')
        .select(`
          id,
          booking_id,
          payment_verifications!inner (
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false, foreignTable: 'payment_verifications' });

      if (receiptsError) {
        console.error('Receipts query error:', receiptsError);
        throw receiptsError;
      }

      // Count pending payments
      const pendingPaymentsCount = receipts?.filter(receipt => {
        const [latestVerification] = receipt.payment_verifications || [0];
        return !latestVerification || latestVerification.status === 'pending';
      }).length || 0;

      // Log the results for debugging
      console.log('Query results:', {
        usersCount,
        bookingsCount: bookings?.length,
        pendingPayments: pendingPaymentsCount
      });

      setStats({
        totalUsers: usersCount || 0,
        activeBookings: bookings?.length || 0,
        pendingPayments: pendingPaymentsCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: CreditCard,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((stat) => (
        <div key={stat.title} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{stat.title}</h3>
            <span className={`${stat.bgColor} ${stat.color} p-2 rounded-full`}>
              <stat.icon className="h-5 w-5" />
            </span>
          </div>
          <p className={`text-3xl font-bold ${stat.color}`}>
            {stat.value.toLocaleString()}
          </p>
          <div className="mt-2">
            <button
              onClick={loadStats}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}