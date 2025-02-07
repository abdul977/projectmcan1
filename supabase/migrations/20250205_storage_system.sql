-- Enable storage if not already enabled
create extension if not exists "uuid-ossp";

-- Create storage bucket for payment receipts if it doesn't exist
insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

-- Remove any existing storage policies for payment-receipts bucket
drop policy if exists "Users can upload their own payment receipts" on storage.objects;
drop policy if exists "Users can view their own payment receipts" on storage.objects;
drop policy if exists "Admins can view all payment receipts" on storage.objects;

-- Create storage policies
create policy "Users can upload their own payment receipts"
on storage.objects for insert
with check (
  bucket_id = 'payment-receipts' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own payment receipts"
on storage.objects for select
using (
  bucket_id = 'payment-receipts'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins can view all payment receipts"
on storage.objects for select
using (
  bucket_id = 'payment-receipts'
  and auth.role() = 'authenticated'
  and exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

-- Grant usage on storage schema
grant usage on schema storage to service_role, authenticated, anon;

-- Grant access to bucket
grant all on storage.objects to authenticated;
grant all on storage.buckets to authenticated;