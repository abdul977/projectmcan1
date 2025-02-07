import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendEmail, EmailTemplate } from '@/lib/notifications';

interface BankDetails {
  bank: string;
  account: string;
  name: string;
}

interface PaymentDetails {
  amount: string;
  transactionDate: string;
  transactionReference: string;
  bankUsed: string;
  accountPaidFrom: string;
  receiptFile: File | null;
}

const BANK_DETAILS: BankDetails = {
  bank: 'Jaiz Bank Nigeria',
  account: '0001194315',
  name: 'MCAN AMAC',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

export default function PaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amount: location.state?.amount || '',
    transactionDate: '',
    transactionReference: '',
    bankUsed: '',
    accountPaidFrom: '',
    receiptFile: null,
  });

  // Redirect if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const validateInputs = () => {
    if (!paymentDetails.amount || isNaN(parseFloat(paymentDetails.amount))) {
      toast.error('Please enter a valid amount');
      return false;
    }

    if (!paymentDetails.transactionDate) {
      toast.error('Please enter the transaction date');
      return false;
    }

    if (!paymentDetails.transactionReference) {
      toast.error('Please enter the transaction reference');
      return false;
    }

    if (!paymentDetails.bankUsed) {
      toast.error('Please enter the bank used');
      return false;
    }

    if (!paymentDetails.accountPaidFrom) {
      toast.error('Please enter the account number used');
      return false;
    }

    if (!paymentDetails.receiptFile) {
      toast.error('Please upload your payment receipt');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size should not exceed 10MB');
        return;
      }

      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }

      setPaymentDetails({
        ...paymentDetails,
        receiptFile: file,
      });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to continue');
      navigate('/login');
      return;
    }

    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);

      // Verify state parameters
      if (!location.state?.bookingId) {
        console.error('No booking ID provided in location state');
        toast.error('Missing booking information. Please try booking again.');
        navigate('/booking');
        return;
      }

      // Upload receipt to storage
      const fileExt = paymentDetails.receiptFile!.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading receipt file:', {
        bucket: 'payment-receipts',
        fileName,
        fileSize: paymentDetails.receiptFile!.size,
        fileType: paymentDetails.receiptFile!.type
      });

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, paymentDetails.receiptFile!);

      if (uploadError) {
        console.error('Receipt upload failed:', uploadError);
        toast.error(`Failed to upload receipt: ${uploadError.message}`);
        return;
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      console.log('Creating payment receipt record:', {
        bookingId: location.state.bookingId,
        amount: parseFloat(paymentDetails.amount),
        receiptUrl: publicUrl
      });

      // Create payment receipt record
      const { error: receiptError } = await supabase
        .from('payment_receipts')
        .insert({
          user_id: user.id,
          booking_id: location.state.bookingId,
          amount: parseFloat(paymentDetails.amount),
          transaction_date: new Date(paymentDetails.transactionDate).toISOString(),
          transaction_reference: paymentDetails.transactionReference,
          bank_name: paymentDetails.bankUsed,
          account_number: paymentDetails.accountPaidFrom,
          receipt_url: publicUrl,
        });

      if (receiptError) {
        console.error('Payment receipt creation failed:', receiptError);
        // If receipt creation fails, clean up the uploaded file
        await supabase.storage
          .from('payment-receipts')
          .remove([fileName]);
        toast.error(`Failed to create payment record: ${receiptError.message}`);
        return;
      }

      let emailSent = true;
      try {
        // Get user's name for the email
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (!userError) {
          // Try to send confirmation email
          await sendEmail(EmailTemplate.PAYMENT_RECEIVED, user.email!, {
            userName: userData.full_name,
            bookingId: location.state?.bookingId,
            amount: paymentDetails.amount,
            transactionDate: paymentDetails.transactionDate,
            reference: paymentDetails.transactionReference,
          });
        } else {
          emailSent = false;
          console.error('Failed to fetch user data for email:', userError);
        }
      } catch (emailError) {
        emailSent = false;
        console.error('Failed to send confirmation email:', emailError);
      }

      // Show success message with email status
      if (emailSent) {
        toast.success('Payment details submitted successfully!');
      } else {
        toast.success('Payment details submitted successfully! (Email notification failed)');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Payment submission failed:', error);
      toast.error('Failed to submit payment details');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {/* Bank Transfer Details */}
            <div className="text-center mb-8">
              <CreditCard className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Bank Transfer Payment</h2>
              <p className="mt-2 text-gray-600">
                Complete your booking by making a transfer to our bank account
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-semibold mb-4">Bank Account Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Bank:</span> {BANK_DETAILS.bank}</p>
                <p><span className="font-medium">Account Number:</span> {BANK_DETAILS.account}</p>
                <p><span className="font-medium">Account Name:</span> {BANK_DETAILS.name}</p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount Paid
                </label>
                <Input
                  type="number"
                  id="amount"
                  value={paymentDetails.amount}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, amount: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  required
                  disabled={!!location.state?.amount}
                />
              </div>

              <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
                  Transaction Date
                </label>
                <Input
                  type="datetime-local"
                  id="transactionDate"
                  value={paymentDetails.transactionDate}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, transactionDate: e.target.value })
                  }
                  max={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <label htmlFor="transactionReference" className="block text-sm font-medium text-gray-700">
                  Transaction Reference
                </label>
                <Input
                  type="text"
                  id="transactionReference"
                  value={paymentDetails.transactionReference}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, transactionReference: e.target.value })
                  }
                  placeholder="Enter the transaction reference from your bank"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label htmlFor="bankUsed" className="block text-sm font-medium text-gray-700">
                  Bank Used
                </label>
                <Input
                  type="text"
                  id="bankUsed"
                  value={paymentDetails.bankUsed}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, bankUsed: e.target.value })
                  }
                  placeholder="Enter the bank you transferred from"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="accountPaidFrom" className="block text-sm font-medium text-gray-700">
                  Account Number Used
                </label>
                <Input
                  type="text"
                  id="accountPaidFrom"
                  value={paymentDetails.accountPaidFrom}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, accountPaidFrom: e.target.value })
                  }
                  placeholder="Enter the account number you transferred from"
                  required
                  maxLength={20}
                  pattern="[0-9]*"
                  title="Please enter only numbers"
                />
              </div>

              <div>
                <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
                  Upload Payment Receipt
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt"
                          name="receipt"
                          type="file"
                          accept={ALLOWED_FILE_TYPES.join(',')}
                          className="sr-only"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </p>
                    {paymentDetails.receiptFile && (
                      <p className="text-sm text-green-600">
                        Selected: {paymentDetails.receiptFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Payment Details'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}