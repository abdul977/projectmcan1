BEGIN;

-- Ensure there's a foreign key from bookings to profiles
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_user_id_fkey'
    ) THEN
        ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure there's a foreign key from bookings to rooms
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_room_id_fkey'
    ) THEN
        ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_room_id_fkey
        FOREIGN KEY (room_id)
        REFERENCES public.rooms(id)
        ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;