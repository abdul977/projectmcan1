import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendEmail, EmailTemplate } from '@/lib/notifications';

interface PaymentReceipt {
  id: string;
  user_id: string;
  booking_id: string;
  amount: number;
  transaction_date: string;
  transaction_reference: string;
  bank_name: string;
  account_number: string;
  receipt_url: string;
  created_at: string;
  full_name: string;
  email: string;
}

interface PaymentVerification {
  id: string;
  payment_receipt_id: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_date: string | null;
  rejection_reason: string | null;
}

export function PaymentVerification() {
  const [pendingPayments, setPendingPayments] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReceipt | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  async function loadPendingPayments() {
    try {
      setLoading(true);
      
      // First get payment receipts from our view that need verification
      const { data, error } = await supabase
        .from('payment_receipts_with_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) {
        setPendingPayments([]);
        return;
      }

      // Then get all payment verification statuses
      const { data: verifications, error: verificationError } = await supabase
        .from('payment_verifications')
        .select('payment_receipt_id, status');

      if (verificationError) throw verificationError;

      // Filter receipts to only include those without verifications or with pending status
      const pendingReceiptIds = new Set(
        (verifications || [])
          .filter(v => v.status === 'pending')
          .map(v => v.payment_receipt_id)
      );

      const verifiedReceiptIds = new Set(
        (verifications || [])
          .filter(v => v.status === 'approved' || v.status === 'rejected')
          .map(v => v.payment_receipt_id)
      );

      const filteredReceipts = data.filter(receipt => 
        !verifiedReceiptIds.has(receipt.id) || pendingReceiptIds.has(receipt.id)
      );

      setPendingPayments(filteredReceipts);
    } catch (error) {
      console.error('Error loading pending payments:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprovePayment(payment: PaymentReceipt) {
    try {
      // Create verification record
      const { error: verificationError } = await supabase
        .from('payment_verifications')
        .upsert({
          payment_receipt_id: payment.id,
          status: 'approved',
          verification_date: new Date().toISOString(),
        });

      if (verificationError) throw verificationError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          status: 'active'
        })
        .eq('id', payment.booking_id);

      if (bookingError) throw bookingError;

      // Send approval email
      await sendEmail(EmailTemplate.PAYMENT_APPROVED, payment.email, {
        userName: payment.full_name,
        bookingId: payment.booking_id,
        amount: payment.amount,
        transactionDate: payment.transaction_date,
        reference: payment.transaction_reference,
      });

      toast.success('Payment approved successfully');
      loadPendingPayments();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    }
  }

  async function handleRejectPayment() {
    if (!selectedPayment || !rejectionReason) return;

    try {
      const { error } = await supabase
        .from('payment_verifications')
        .upsert({
          payment_receipt_id: selectedPayment.id,
          status: 'rejected',
          verification_date: new Date().toISOString(),
          rejection_reason: rejectionReason,
        });

      if (error) throw error;

      // Send rejection email
      await sendEmail(EmailTemplate.PAYMENT_REJECTED, selectedPayment.email, {
        userName: selectedPayment.full_name,
        bookingId: selectedPayment.booking_id,
        amount: selectedPayment.amount,
        transactionDate: selectedPayment.transaction_date,
        reference: selectedPayment.transaction_reference,
        rejectionReason,
      });

      toast.success('Payment rejected successfully');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedPayment(null);
      loadPendingPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pending Payment Verifications</h2>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingPayments.length ? (
              pendingPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.full_name}</p>
                      <p className="text-sm text-gray-500">{payment.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(payment.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell>{payment.transaction_reference}</TableCell>
                  <TableCell>{payment.bank_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowReceiptDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Receipt
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprovePayment(payment)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRejectDialog(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No pending payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Receipt View Dialog */}
      <AlertDialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Payment Receipt</AlertDialogTitle>
          </AlertDialogHeader>
          {selectedPayment && (
            <div className="aspect-[3/4] relative">
              <img
                src={selectedPayment.receipt_url}
                alt="Payment Receipt"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Payment Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-gray-200 p-2"
              placeholder="Enter rejection reason..."
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRejectionReason('');
              setSelectedPayment(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectPayment}
              disabled={!rejectionReason.trim()}
            >
              Reject Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}