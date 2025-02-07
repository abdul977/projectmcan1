-- Add emergency contact columns to profiles table
ALTER TABLE profiles
ADD COLUMN emergency_contact_phone_1 text,
ADD COLUMN emergency_contact_phone_2 text,
ADD COLUMN emergency_contact_address text,
ADD COLUMN emergency_contact_name text;