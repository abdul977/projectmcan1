BEGIN;

-- First, ensure there's a foreign key from payment_receipts to profiles through auth.users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_receipts_user_id_fkey'
    ) THEN
        ALTER TABLE public.payment_receipts
        ADD CONSTRAINT payment_receipts_user_id_fkey
        FOREIGN KEY (user_id)  -- Assuming user_id is the column in payment_receipts
        REFERENCES public.profiles(id)  -- Reference the profiles table
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create a view to join payment_receipts with profiles
CREATE OR REPLACE VIEW public.payment_receipts_with_profiles AS
SELECT 
    pr.*,
    p.full_name,
    p.email
FROM 
    public.payment_receipts pr
    JOIN public.profiles p ON pr.user_id = p.id;  -- Ensure user_id is the correct column

-- Grant appropriate permissions on the view
GRANT SELECT ON public.payment_receipts_with_profiles TO authenticated;
GRANT SELECT ON public.payment_receipts_with_profiles TO service_role;

COMMIT;