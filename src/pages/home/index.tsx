import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Coffee, Moon, SprayCan as Pray, Users } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div
        className="relative h-[600px] bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to MCAN Lodge
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl">
              Your peaceful retreat in the heart of the community. Experience comfort and
              tranquility while staying true to Islamic values.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="text-lg px-8 py-3"
            >
              Book Your Stay
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose MCAN Lodge?</h2>
            <p className="mt-4 text-xl text-gray-600">
              Experience a stay that caters to your spiritual and practical needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Pray className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Prayer Facilities</h3>
              <p className="text-gray-600">
                Dedicated prayer rooms and Qibla direction in every room
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Coffee className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Halal Dining</h3>
              <p className="text-gray-600">
                Certified halal food options and kitchen facilities
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Community Events</h3>
              <p className="text-gray-600">
                Regular Islamic lectures and community gatherings
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Moon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Peaceful Environment</h3>
              <p className="text-gray-600">
                Quiet spaces for reflection and spiritual growth
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Preview */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Our Accommodations</h2>
            <p className="mt-4 text-xl text-gray-600">
              Comfortable rooms designed for your peace of mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                alt="Single Room"
                className="h-48 w-full object-cover"
              />
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Single Room</h3>
                <p className="text-gray-600 mb-4">
                  Perfect for individual travelers seeking comfort and privacy
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/book')}>
                  View Details
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                alt="Family Suite"
                className="h-48 w-full object-cover"
              />
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Family Suite</h3>
                <p className="text-gray-600 mb-4">
                  Spacious accommodation for families with all amenities
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/book')}>
                  View Details
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                alt="Group Room"
                className="h-48 w-full object-cover"
              />
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Group Room</h3>
                <p className="text-gray-600 mb-4">
                  Ideal for study groups or small gatherings
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/book')}>
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience MCAN Lodge?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Book your stay today and become part of our community
          </p>
          <Button
            size="lg"
            className="bg-white text-green-600 hover:bg-green-50"
            onClick={() => navigate('/register')}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}