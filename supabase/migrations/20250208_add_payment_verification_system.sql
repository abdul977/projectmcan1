BEGIN;

-- Create payment_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL,
    verified_by UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_verifications_booking_id ON public.payment_verifications(booking_id);

-- Create function to update booking payment status
CREATE OR REPLACE FUNCTION update_booking_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the booking's payment_status based on verification status
    UPDATE public.bookings
    SET 
        payment_status = CASE
            WHEN NEW.status = 'verified' THEN 'paid'
            WHEN NEW.status = 'rejected' THEN 'pending'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = NEW.booking_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update booking status
DROP TRIGGER IF EXISTS payment_verification_status_trigger ON public.payment_verifications;
CREATE TRIGGER payment_verification_status_trigger
    AFTER INSERT OR UPDATE OF status
    ON public.payment_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_payment_status();

-- Add RLS policies for payment_verifications
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- Allow admin and manager to see all verifications
CREATE POLICY "Admin and manager can see all payment verifications"
    ON public.payment_verifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'manager')
        )
    );

-- Allow admin and manager to insert/update verifications
CREATE POLICY "Admin and manager can manage payment verifications"
    ON public.payment_verifications
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'manager')
        )
    );

-- Create function to get latest verification status
CREATE OR REPLACE FUNCTION get_latest_verification_status(booking_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT status
        FROM payment_verifications
        WHERE booking_id = $1
        ORDER BY created_at DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

COMMIT;