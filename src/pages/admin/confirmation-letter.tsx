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
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  async function searchUsers() {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearching(true);
    try {
      const searchTerm = searchQuery.toLowerCase().trim();
      
      // Search across multiple fields
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, address, gender, status, role')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Profile query error:', error);
        throw error;
      }

      if (!profilesData?.length) {
        toast.error('No users found');
        setProfiles([]);
        return;
      }

      setProfiles(profilesData);
      setSelectedProfile(null);
      toast.success(`Found ${profilesData.length} users`);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to fetch user details');
    } finally {
      setSearching(false);
    }
  }

  async function generatePDF() {
    if (!selectedProfile) return;

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
      doc.text(`Full Name: ${selectedProfile.full_name}`, 20, yPos);
      yPos += 8;
      doc.text(`Email: ${selectedProfile.email}`, 20, yPos);
      yPos += 8;
      doc.text(`Phone: ${selectedProfile.phone || 'Not provided'}`, 20, yPos);
      yPos += 8;
      doc.text(`Gender: ${selectedProfile.gender || 'Not specified'}`, 20, yPos);
      yPos += 8;
      doc.text(`Address: ${selectedProfile.address || 'Not provided'}`, 20, yPos);
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
      doc.save(`confirmation_letter_${selectedProfile.id}.pdf`);
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
                placeholder="Search by name, email, or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={searching}>
                <Search className="w-4 h-4 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </Card>

          {profiles.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Search Results</h3>
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedProfile?.id === profile.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    {profile.phone && (
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {selectedProfile && (
            <Card className="p-6 space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Selected User Details</h3>
                <div className="grid gap-2">
                  <p><span className="font-medium">Name:</span> {selectedProfile.full_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedProfile.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedProfile.phone || 'Not provided'}</p>
                  <p><span className="font-medium">Gender:</span> {selectedProfile.gender || 'Not specified'}</p>
                  <p><span className="font-medium">Address:</span> {selectedProfile.address || 'Not provided'}</p>
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