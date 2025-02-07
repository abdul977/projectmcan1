import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Home, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  payment_status: string;
}

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  islamic_knowledge_level: string;
  dietary_preferences: string;
  prayer_requirements: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function loadDashboardData() {
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch user bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;
        setBookings(bookingsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      }
    }

    loadDashboardData();
  }, [user, navigate]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 rounded-full p-3">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{profile.full_name}</h3>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>
              <nav className="space-y-2">
                <Button
                  variant={activeTab === 'overview' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('overview')}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === 'bookings' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('bookings')}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  My Bookings
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </Button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Welcome Back, {profile.full_name}!</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-2">Active Bookings</h3>
                      <p className="text-3xl font-bold text-green-600">
                        {bookings.filter(b => b.status === 'active').length}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-2">Upcoming Check-ins</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {bookings.filter(b => b.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">My Bookings</h2>
                    <Button onClick={() => navigate('/book')}>New Booking</Button>
                  </div>
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">Booking #{booking.id.slice(0, 8)}</h3>
                            <div className="mt-2 space-y-1 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(booking.check_in_date).toLocaleDateString()} -{' '}
                                {new Date(booking.check_out_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Status: {booking.status}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${booking.total_price}</p>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {booking.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        value={profile.full_name}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        value={profile.email}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        value={profile.phone}
                        readOnly
                      />
                    </div>
                    <Button className="w-full">Update Profile</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}