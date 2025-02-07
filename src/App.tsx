import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/auth-context';
import { RequireAdmin } from '@/components/auth/require-admin';
import HomePage from '@/pages/home';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import DashboardPage from '@/pages/dashboard';
import BookingPage from '@/pages/booking';
import PaymentPage from '@/pages/payment';
import AdminDashboard from '@/pages/admin';
import ConfirmationLetter from '@/pages/admin/confirmation-letter';
import UserDetails from '@/pages/admin/user-details';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              
              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/confirmation-letter"
                element={
                  <RequireAdmin>
                    <ConfirmationLetter />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/users/:userId"
                element={
                  <RequireAdmin>
                    <UserDetails />
                  </RequireAdmin>
                }
              />

            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;