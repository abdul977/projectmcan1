import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Calendar, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price_per_night: number;
  amenities: string[];
  is_available: boolean;
}

export default function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function loadRooms() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('is_available', true);

        if (error) throw error;
        setRooms(data);
      } catch (error) {
        toast.error('Failed to load available rooms');
      }
    }

    loadRooms();
  }, [user, navigate]);

  const handleBooking = async () => {
    if (!selectedRoom || !checkIn || !checkOut) {
      toast.error('Please select room and dates');
      return;
    }

    try {
      setLoading(true);

      const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalPrice = selectedRoom.price_per_night * nights;

      // Create booking with detailed error handling
      const { data, error: bookingError } = await supabase.from('bookings')
        .insert([
          {
            user_id: user.id,
            room_id: selectedRoom.id,
            check_in_date: checkIn,
            check_out_date: checkOut,
            total_price: totalPrice,
            status: 'pending',
            payment_status: 'pending',
          },
        ])
        .select();

      if (bookingError) {
        console.error('Booking creation failed:', bookingError);
        toast.error(`Failed to create booking: ${bookingError.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No booking data returned after creation');
        toast.error('Failed to create booking: No data returned');
        return;
      }

      const booking = data[0];
      console.log('Booking created successfully:', booking);
      
      toast.success('Booking created successfully!');
      navigate('/payment', {
        state: {
          bookingId: booking.id,
          amount: totalPrice.toString()
        }
      });
    } catch (error) {
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Your Stay</h1>
            <p className="mt-2 text-gray-600">
              Select your room and dates to begin your peaceful stay at MCAN Lodge
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Room Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedRoom?.id === room.id
                            ? 'border-green-500 bg-green-50'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{room.name}</h3>
                            <p className="text-gray-600 mt-1">{room.description}</p>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Capacity: {room.capacity}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {room.amenities.map((amenity, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              ${room.price_per_night}
                            </p>
                            <p className="text-sm text-gray-500">per night</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Check-out Date
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                    </div>

                    {selectedRoom && (
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium">Selected Room</h3>
                        <p className="text-gray-600">{selectedRoom.name}</p>
                        <p className="text-lg font-bold text-green-600 mt-2">
                          ${selectedRoom.price_per_night} per night
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <Button
                        className="w-full"
                        disabled={!selectedRoom || !checkIn || !checkOut || loading}
                        onClick={handleBooking}
                      >
                        {loading ? 'Processing...' : 'Proceed to Payment'}
                      </Button>
                      <p className="mt-2 text-sm text-gray-500 flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Your booking will be confirmed after payment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}