import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { AdminLayout } from '@/components/layout/admin-layout';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  status: string;
  role: string;
}

export default function ConfirmationLetter() {
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  async function searchUser() {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setSearching(true);
    try {
      // Get user profile using POST method
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, address, gender, status, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile query error:', error);
        throw error;
      }

      if (!profileData) {
        toast.error('User not found');
        return;
      }

      setProfile(profileData);
      toast.success('User found');
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Failed to fetch user details');
    } finally {
      setSearching(false);
    }
  }

  async function generatePDF() {
    if (!profile) return;

    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('MCAN HOSTEL', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(16);
      doc.text('BEDSPACE CONFIRMATION LETTER', pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;

      // Date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 20;

      // Resident Details
      doc.setFont('helvetica', 'bold');
      doc.text('RESIDENT INFORMATION', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Full Name: ${profile.full_name}`, 20, yPos);
      yPos += 8;
      doc.text(`Email: ${profile.email}`, 20, yPos);
      yPos += 8;
      doc.text(`Phone: ${profile.phone || 'Not provided'}`, 20, yPos);
      yPos += 8;
      doc.text(`Gender: ${profile.gender || 'Not specified'}`, 20, yPos);
      yPos += 8;
      doc.text(`Address: ${profile.address || 'Not provided'}`, 20, yPos);
      yPos += 20;

      // Rules and Regulations
      doc.setFont('helvetica', 'bold');
      doc.text('HOSTEL RULES AND REGULATIONS', 20, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      const rules = [
        '1. Maintain cleanliness and orderliness in rooms and common areas.',
        '2. Observe quiet hours from 11:00 PM to 6:00 AM.',
        '3. No unauthorized visitors allowed in rooms.',
        '4. No smoking, alcohol, or illegal substances permitted.',
        '5. Report maintenance issues promptly.',
        '6. Follow waste disposal and recycling guidelines.',
        '7. No modification of room furniture or fixtures.',
        '8. Keep valuable items secure and locked.',
        '9. Respect other residents and staff.',
        '10. Follow check-in and check-out procedures.'
      ];

      rules.forEach(rule => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(rule, 20, yPos);
        yPos += 8;
      });

      yPos += 20;

      // Acceptance Form
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('ACCEPTANCE DECLARATION', 20, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.text('I hereby acknowledge that I have read and understood the hostel rules and', 20, yPos);
      yPos += 8;
      doc.text('regulations. I agree to abide by them during my stay at MCAN HOSTEL.', 20, yPos);
      yPos += 20;

      doc.text('Resident Signature: _____________________', 20, yPos);
      yPos += 15;
      doc.text('Date: _____________________', 20, yPos);

      // Save the PDF
      doc.save(`confirmation_letter_${profile.id}.pdf`);
      toast.success('Confirmation letter generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate confirmation letter');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <Button onClick={searchUser} disabled={searching}>
                <Search className="w-4 h-4 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </Card>

          {profile && (
            <Card className="p-6 space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">User Details</h3>
                <div className="grid gap-2">
                  <p><span className="font-medium">Name:</span> {profile.full_name}</p>
                  <p><span className="font-medium">Email:</span> {profile.email}</p>
                  <p><span className="font-medium">Phone:</span> {profile.phone || 'Not provided'}</p>
                  <p><span className="font-medium">Gender:</span> {profile.gender || 'Not specified'}</p>
                  <p><span className="font-medium">Address:</span> {profile.address || 'Not provided'}</p>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={generatePDF}
                  disabled={loading}
                >
                  Generate Confirmation Letter
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}