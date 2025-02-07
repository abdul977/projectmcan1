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
          const pageHeight = doc.internal.pageSize.getHeight();
          let yPos = 20;

          // Background gradient
          doc.setFillColor(240, 255, 240); // Light green
          doc.rect(0, 0, pageWidth, pageHeight, 'F');

          // Border
          doc.setDrawColor(34, 139, 34); // Forest Green
          doc.setLineWidth(2);
          doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

          // Header with Gradient Effect
          doc.setFillColor(46, 139, 87); // Sea Green
          doc.rect(15, 15, pageWidth - 30, 30, 'F');
          
          doc.setTextColor(255, 255, 255); // White text
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text('MUSLIM CORPERS\' ASSOCIATION OF NIGERIA', pageWidth / 2, 35, { align: 'center' });

          doc.setTextColor(0, 0, 0); // Reset to black
          doc.setFontSize(16);
          doc.text('FCT CHAPTER - ACCOMMODATION CONFIRMATION', pageWidth / 2, 50, { align: 'center' });

          // Decorative Line
          doc.setDrawColor(34, 139, 34);
          doc.line(20, 55, pageWidth - 20, 55);

          // Date
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 50, 65, { align: 'right' });

          // Resident Details Section
          yPos = 80;
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(152, 251, 152); // Pale Green
          doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
          doc.setTextColor(0, 0, 0);
          doc.text('RESIDENT INFORMATION', 25, yPos);
          
          yPos += 15;
          doc.setFont('helvetica', 'normal');
          const residentDetails = [
            `Full Name: ${selectedProfile.full_name}`,
            `Email: ${selectedProfile.email}`,
            `Phone: ${selectedProfile.phone || 'Not provided'}`,
            `Gender: ${selectedProfile.gender || 'Not specified'}`,
            `Address: ${selectedProfile.address || 'Not provided'}`
          ];

          residentDetails.forEach(detail => {
            doc.text(detail, 25, yPos);
            yPos += 8;
          });

          // Rules and Regulations Section
          yPos += 10;
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(152, 251, 152); // Pale Green
          doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
          doc.text('LODGE RULES AND REGULATIONS', 25, yPos);

          yPos += 15;
          doc.setFont('helvetica', 'normal');
          const mcanRules = [
            '1. Religious Practice: Only Islamic religion is practiced within the lodge.',
            '2. Respect and Conduct: Treat all lodgers with utmost respect.',
            '3. Dress Code: Adhere strictly to modest Islamic dress guidelines.',
            '4. Sanitation: Actively participate in lodge cleanliness.',
            '5. Financial Obligations: Pay monthly dues before the 10th.',
            '6. No Illegal Activities: Strictly forbidden.',
            '7. Visitors: No unauthorized visitors allowed.',
            '8. Sound Systems: Maintain low volume.',
            '9. Personal Belongings: All MCAN materials remain MCAN property.',
            '10. Conduct: Embody Islamic teachings always.'
          ];

          mcanRules.forEach(rule => {
            doc.text(rule, 25, yPos);
            yPos += 8;
          });

          // Motto Section
          yPos += 10;
          doc.setFont('helvetica', 'italic');
          doc.text('"Say verily, my prayer, my sacrifice, my living, and my dying', 25, yPos, { maxWidth: pageWidth - 50 });
          doc.text('are for Allah, the lord of the worlds" (Q16:162)', 25, yPos + 6);

          // Acceptance Declaration
          yPos += 30;
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(152, 251, 152); // Pale Green
          doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
          doc.text('ACCEPTANCE DECLARATION', 25, yPos);

          yPos += 15;
          doc.setFont('helvetica', 'normal');
          doc.text('I hereby acknowledge that I have read, understood, and agree', 25, yPos);
          doc.text('to abide by all MCAN lodge rules and regulations.', 25, yPos + 6);

          yPos += 30;
          doc.text('Resident Signature: _____________________', 25, yPos);
          doc.text('Date: _____________________', pageWidth - 100, yPos);

          // Footer
          doc.setTextColor(105, 105, 105);
          doc.setFontSize(8);
          doc.text('MCAN FCT Chapter - Empowering Corpers through Islamic Principles', pageWidth / 2, pageHeight - 15, { align: 'center' });

          // Save the PDF
          doc.save(`mcan_confirmation_letter_${selectedProfile.id}.pdf`);
          toast.success('MCAN Confirmation letter generated successfully');
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast.error('Failed to generate MCAN confirmation letter');
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