import { supabase } from './supabase';

interface EmailParams {
  to: string;
  subject: string;
  content: string;
}

export enum EmailTemplate {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_APPROVED = 'PAYMENT_APPROVED',
  PAYMENT_REJECTED = 'PAYMENT_REJECTED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_STATUS_CHANGE = 'ACCOUNT_STATUS_CHANGE',
}

const emailTemplates = {
  [EmailTemplate.PAYMENT_RECEIVED]: {
    subject: 'Payment Receipt Submitted',
    content: (data: any) => `
      Dear ${data.userName},

      We have received your payment receipt for booking #${data.bookingId}. 
      Our team will verify your payment shortly.

      Payment Details:
      - Amount: ₦${data.amount}
      - Transaction Date: ${new Date(data.transactionDate).toLocaleDateString()}
      - Reference: ${data.reference}

      We will notify you once the verification is complete.

      Thank you for your business.
    `,
  },
  [EmailTemplate.PAYMENT_APPROVED]: {
    subject: 'Payment Verified Successfully',
    content: (data: any) => `
      Dear ${data.userName},

      Your payment for booking #${data.bookingId} has been verified and approved.

      Payment Details:
      - Amount: ₦${data.amount}
      - Transaction Date: ${new Date(data.transactionDate).toLocaleDateString()}
      - Reference: ${data.reference}

      Your booking is now confirmed. Thank you for choosing our service.
    `,
  },
  [EmailTemplate.PAYMENT_REJECTED]: {
    subject: 'Payment Verification Failed',
    content: (data: any) => `
      Dear ${data.userName},

      Unfortunately, we could not verify your payment for booking #${data.bookingId}.

      Reason: ${data.rejectionReason}

      Please submit a new payment receipt or contact our support team for assistance.

      Payment Details:
      - Amount: ₦${data.amount}
      - Transaction Date: ${new Date(data.transactionDate).toLocaleDateString()}
      - Reference: ${data.reference}
    `,
  },
  [EmailTemplate.PASSWORD_RESET]: {
    subject: 'Password Reset Request',
    content: (data: any) => `
      Dear ${data.userName},

      A password reset has been initiated for your account.
      Please use the following link to reset your password:

      ${data.resetLink}

      This link will expire in 1 hour.

      If you did not request this password reset, please ignore this email.
    `,
  },
  [EmailTemplate.ACCOUNT_STATUS_CHANGE]: {
    subject: 'Account Status Update',
    content: (data: any) => `
      Dear ${data.userName},

      Your account status has been updated to: ${data.status}

      ${data.status === 'disabled' 
        ? 'If you believe this was done in error, please contact our support team.' 
        : 'Your account is now active and you can access all features.'}

      For any questions, please contact our support team.
    `,
  },
};

export async function sendEmail(
  template: EmailTemplate,
  to: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const templateConfig = emailTemplates[template];
    if (!templateConfig) {
      throw new Error(`Email template "${template}" not found`);
    }

    const emailParams: EmailParams = {
      to,
      subject: templateConfig.subject,
      content: templateConfig.content(data),
    };

    // Use Supabase Edge Function to send email
    const { error } = await supabase.functions.invoke('send-email', {
      body: emailParams,
    });

    if (error) throw error;

    // Log the email send attempt
    await supabase.from('email_logs').insert({
      template,
      recipient: to,
      status: 'sent',
      data,
    });

  } catch (error) {
    console.error('Failed to send email:', error);
    
    // Log the failed attempt
    await supabase.from('email_logs').insert({
      template,
      recipient: to,
      status: 'failed',
      data,
      error: JSON.stringify(error),
    });

    throw error;
  }
}