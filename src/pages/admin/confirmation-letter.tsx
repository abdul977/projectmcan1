import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Printer, ChevronDown, ChevronUp, FileText, UserCheck, Shield, Calendar, MapPin } from 'lucide-react';
import { AdminLayout } from '@/components/layout/admin-layout';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

// Custom Styles for Enhanced Design
const customStyles = `
  /* Global Enhancements */
  .mcan-form-container {
    @apply bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out;
  }

  .mcan-form-header {
    @apply bg-gradient-to-r from-green-600 to-green-800 text-white py-4 px-6 rounded-t-xl flex items-center justify-between;
  }

  .mcan-form-section {
    @apply bg-white/80 backdrop-blur-sm border border-green-100 rounded-xl shadow-md p-6 mb-6 transition-all duration-200 hover:shadow-lg;
  }

  .mcan-input-group {
    @apply space-y-4 mb-6 grid grid-cols-2 gap-6;
  }

  .mcan-input-label {
    @apply block text-sm font-semibold text-green-800 mb-2 flex items-center;
  }

  .mcan-input-field {
    @apply w-full px-4 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200;
  }

  .mcan-checkbox-group {
    @apply space-y-3 bg-green-50 p-4 rounded-lg border border-green-100;
  }

  .mcan-checkbox-item {
    @apply flex items-start space-x-3 text-green-900;
  }

  .mcan-validation-section {
    @apply bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-300 rounded-xl p-6 text-center;
  }

  /* Responsive Typography */
  .mcan-title {
    @apply text-3xl font-extrabold text-green-900 tracking-tight;
  }

  .mcan-subtitle {
    @apply text-xl font-bold text-green-700 mb-4;
  }

  /* Hover and Interactive Effects */
  .mcan-hover-effect {
    @apply transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl;
  }

  /* Print Styles */
  @media print {
    .mcan-form-container {
      @apply bg-white border-none shadow-none;
    }
    .print-hidden {
      @apply hidden;
    }
  }

  /* Accessibility Enhancements */
  .mcan-focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2;
  }

  /* Decorative Elements */
  .mcan-divider {
    @apply border-t-2 border-green-300 my-6;
  }

  .mcan-badge {
    @apply inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold;
  }
`;

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
  const [showRules, setShowRules] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (formRef.current) {
      const printContents = formRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = printContents;
      window.print();
      
      // Restore the original page content
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const mcanRules = [
    {
      title: 'Religious Practice',
      description: 'Every lodger must practice the Islamic religion exclusively. No other religion is allowed to be practiced or proclaimed within the lodge.'
    },
    {
      title: 'Respect and Conduct',
      description: 'Lodgers must treat each other with utmost respect, following the example of Prophet Muhammad. Fighting or engaging in any form of vocal or physical combat is strictly prohibited.'
    },
    {
      title: 'Dress Code',
      description: 'Lodgers must dress modestly, adhering to Islamic dress codes. Any dressing style that exposes a significant part of the body is considered inappropriate. Brothers are not expected to wear boxers outside the lodge, and sisters must be fully covered.'
    },
    {
      title: 'Sanitation',
      description: 'Lodgers must actively participate in maintaining cleanliness within the lodge, including environmental sanitation activities. Failure to participate may result in being asked to leave after three instances.'
    },
    {
      title: 'Financial Obligations',
      description: 'Lodgers must pay their monthly dues promptly before the 10th of each month. Failure to pay dues for two consecutive months will result in eviction.'
    },
    {
      title: 'Illegal Activities',
      description: 'Engaging in illegal business activities, including selling contraband, is strictly forbidden. Only lawful means of earning are encouraged.'
    },
    {
      title: 'Visitors',
      description: 'No visitors are allowed unless approved by MCAN FCT or authorized management officials. Occupants must not invite family or friends to retain their space.'
    },
    {
      title: 'Sound Systems',
      description: 'The use of loud sound systems, including phone loudspeakers, is strictly prohibited if it causes discomfort to other lodgers.'
    },
    {
      title: 'Hair and Grooming',
      description: 'Lodgers must maintain neat and presentable hair in line with Islamic guidelines. Un-Islamic hairstyles will not be accepted.'
    },
    {
      title: 'Ownership of Materials',
      description: 'All materials and items belonging to MCAN remain the property of MCAN. Lodgers cannot claim ownership or acquire them under any circumstances.'
    }
  ];

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
          // Detailed MCAN Rules with Icons
          const mcanRules = [
            {
              icon: '🕌',
              title: 'Religious Practice',
              description: 'Only Islamic religion is practiced within the lodge. No other religion is allowed to be practiced or proclaimed.'
            },
            {
              icon: '🤝',
              title: 'Respect and Conduct',
              description: 'Treat all lodgers with utmost respect, following the example of Prophet Muhammad. Fighting or any form of vocal/physical combat is strictly prohibited.'
            },
            {
              icon: '👗',
              title: 'Dress Code',
              description: 'Dress modestly, adhering to Islamic dress codes. Exposing significant body parts is inappropriate. Brothers avoid boxers outside, sisters must be fully covered.'
            },
            {
              icon: '🧹',
              title: 'Sanitation',
              description: 'Actively participate in lodge cleanliness and environmental sanitation. Non-participation may result in eviction after three instances.'
            },
            {
              icon: '💰',
              title: 'Financial Obligations',
              description: 'Pay monthly dues before the 10th of each month. Failure to pay for two consecutive months will result in eviction.'
            },
            {
              icon: '🚫',
              title: 'Illegal Activities',
              description: 'No illegal business activities, including selling contraband. Only lawful means of earning are encouraged.'
            },
            {
              icon: '👥',
              title: 'Visitors',
              description: 'No visitors allowed without approval from MCAN FCT or authorized management. Do not invite family or friends to retain space.'
            },
            {
              icon: '🔊',
              title: 'Sound Systems',
              description: 'Strictly prohibit loud sound systems, including phone loudspeakers, that cause discomfort to other lodgers.'
            },
            {
              icon: '💇‍♂️',
              title: 'Hair and Grooming',
              description: 'Maintain neat and presentable hair in line with Islamic guidelines. Un-Islamic hairstyles are not accepted.'
            },
            {
              icon: '📜',
              title: 'Ownership of Materials',
              description: 'All MCAN materials remain MCAN property. Lodgers cannot claim ownership or acquire them under any circumstances.'
            }
          ];

          mcanRules.forEach(rule => {
            doc.text(`${rule.icon} ${rule.title}`, 25, yPos);
            yPos += 10;
            doc.setFontSize(9);
            doc.text(rule.description, 35, yPos, { maxWidth: pageWidth - 70 });
            yPos += 15;
            doc.setFontSize(10);
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
            <Card className="p-6 space-y-6 bg-white shadow-lg" ref={formRef}>
              {/* Letterhead with Logo Placeholders */}
              <div className="relative flex items-center justify-between border-b-2 border-green-600 pb-4">
                {/* NYSC Logo - Left Side */}
                <div className="absolute left-0 top-0 w-24 h-24 flex items-center justify-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/NYSC_LOGO.svg/367px-NYSC_LOGO.svg.png?20221108085710" 
                    alt="NYSC Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* MCAN Logo Placeholder - Right Side */}
                <div className="absolute right-0 top-0 w-24 h-24 bg-gray-100 flex items-center justify-center border border-green-200 rounded-lg">
                  <span className="text-xs text-gray-500">MCAN Logo</span>
                </div>

                {/* Centered Letterhead Content */}
                <div className="mx-auto text-center">
                  <h1 className="text-2xl font-bold text-green-800">
                    MUSLIM CORPERS' ASSOCIATION OF NIGERIA
                  </h1>
                  <h2 className="text-xl text-green-600">FCT CHAPTER</h2>
                  <p className="italic text-sm mt-2">
                    "Say verily, my prayer, my sacrifice, my living, and my dying are for Allah, the lord of the worlds" (Q16:162)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 print:hidden">
                <Button 
                  onClick={() => setShowRules(!showRules)}
                  variant="outline"
                  className="flex items-center"
                >
                  {showRules ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                  {showRules ? 'Hide Rules' : 'View Rules'}
                </Button>
                <Button 
                  onClick={handlePrint}
                  variant="outline"
                  className="flex items-center"
                >
                  <Printer className="mr-2 h-4 w-4" /> Print Form
                </Button>
              </div>

              {/* Rules Section */}
              {showRules && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-center text-green-800">
                    MCAN LODGE RULES AND REGULATIONS
                  </h3>
                  {mcanRules.map((rule, index) => (
                    <div key={index} className="mb-4">
                      <h4 className="font-semibold text-green-700 mb-2">
                        {rule.title}
                      </h4>
                      <p className="text-gray-700">
                        {rule.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Accommodation Form */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-center">
                  ACCOMMODATION FORM
                </h3>
                <p className="text-sm italic text-center mb-4">
                  NOTE: Kindly go through the rules and regulations before filling the form.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input 
                      type="text" 
                      value={selectedProfile.full_name} 
                      readOnly 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input 
                      type="text" 
                      value={selectedProfile.address || ''} 
                      readOnly 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input 
                      type="text" 
                      value={selectedProfile.email} 
                      readOnly 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                    <input 
                      type="text" 
                      value={selectedProfile.phone || ''} 
                      readOnly 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <input 
                      type="text" 
                      value={selectedProfile.gender || ''} 
                      readOnly 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                </div>

                {/* Additional Form Fields */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Call-Up Number</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State of Origin</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                </div>

                {/* Emergency Contact and Next of Kin */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input 
                        type="text" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Numbers</label>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          className="mt-1 block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                        <input 
                          type="text" 
                          className="mt-1 block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              {/* Comprehensive Acceptance Form */}
              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg shadow-xl">
                <h3 className="text-xl font-bold text-green-800 mb-6 text-center">
                  ACCEPTANCE OF TERMS AND CONDITIONS
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      className="mr-3 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-gray-700">
                      I have carefully read and fully understand the MCAN Lodge Rules and Regulations.
                    </label>
                  </div>
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      className="mr-3 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-gray-700">
                      I agree to abide by all rules and regulations set forth by MCAN FCT Chapter.
                    </label>
                  </div>
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      className="mr-3 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-gray-700">
                      I understand that violation of these rules may result in disciplinary action, including potential eviction.
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resident Signature
                    </label>
                    <div className="border-b-2 border-green-600 pb-2 w-full"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Acceptance
                    </label>
                    <input 
                      type="date" 
                      className="block w-full border-2 border-green-300 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm italic text-gray-600">
                    By signing below, you acknowledge that this document represents a binding agreement 
                    valued at $40,000 in administrative and accommodation services.
                  </p>
                </div>
              </div>

              {/* Official Seal and Validation */}
              <div className="mt-6 border-t-2 border-green-600 pt-4 text-center">
                <div className="inline-block border-4 border-green-800 px-4 py-2 rounded-lg">
                  <p className="text-lg font-bold text-green-900">
                    OFFICIAL MCAN VALIDATION
                  </p>
                  <p className="text-sm text-gray-700">
                    Accommodation Services Certification
                  </p>
                </div>
              </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}