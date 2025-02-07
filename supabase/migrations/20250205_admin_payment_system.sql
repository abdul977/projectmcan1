-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Add new columns to profiles table
alter table profiles 
add column if not exists status varchar(20) default 'active' check (status in ('active', 'disabled', 'deleted')),
add column if not exists role varchar(20) default 'user' check (role in ('user', 'admin', 'manager'));

-- Create payment_receipts table
create table if not exists payment_receipts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  booking_id uuid references bookings(id) not null,
  amount decimal(10,2) not null,
  transaction_date timestamp with time zone not null,
  transaction_reference varchar(255) not null,
  bank_name varchar(100) not null,
  account_number varchar(20) not null,
  receipt_url text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create payment_verifications table
create table if not exists payment_verifications (
  id uuid default uuid_generate_v4() primary key,
  payment_receipt_id uuid references payment_receipts(id) not null,
  verified_by uuid references auth.users(id),
  status varchar(20) not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verification_date timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create email_logs table
create table if not exists email_logs (
  id uuid default uuid_generate_v4() primary key,
  template varchar(50) not null,
  recipient varchar(255) not null,
  status varchar(20) not null check (status in ('sent', 'failed')),
  data jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamp with time zone default now()
);

-- Create indexes for performance
create index if not exists idx_payment_receipts_user_id on payment_receipts(user_id);
create index if not exists idx_payment_receipts_booking_id on payment_receipts(booking_id);
create index if not exists idx_payment_verifications_payment_receipt_id on payment_verifications(payment_receipt_id);
create index if not exists idx_payment_verifications_status on payment_verifications(status);
create index if not exists idx_email_logs_template on email_logs(template);
create index if not exists idx_email_logs_recipient on email_logs(recipient);
create index if not exists idx_email_logs_status on email_logs(status);
create index if not exists idx_profiles_status on profiles(status);
create index if not exists idx_profiles_role on profiles(role);

-- Create trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add triggers to tables
create trigger set_timestamp_payment_receipts
    before update on payment_receipts
    for each row
    execute function update_updated_at_column();

create trigger set_timestamp_payment_verifications
    before update on payment_verifications
    for each row
    execute function update_updated_at_column();

-- Create storage bucket for payment receipts if it doesn't exist
insert into storage.buckets (id, name)
values ('payment-receipts', 'payment-receipts')
on conflict (id) do nothing;

-- Set up storage policies for payment receipts
create policy "Users can upload their own payment receipts"
on storage.objects for insert
with check (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own payment receipts"
on storage.objects for select
using (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Admins can view all payment receipts"
on storage.objects for select
using (
  bucket_id = 'payment-receipts' AND
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

-- RLS Policies for tables

-- payment_receipts policies
alter table payment_receipts enable row level security;

create policy "Users can view their own payment receipts"
on payment_receipts for select
using (auth.uid() = user_id);

create policy "Admins can view all payment receipts"
on payment_receipts for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

create policy "Users can insert their own payment receipts"
on payment_receipts for insert
with check (auth.uid() = user_id);

-- payment_verifications policies
alter table payment_verifications enable row level security;

create policy "Users can view their own payment verifications"
on payment_verifications for select
using (
  exists (
    select 1 from payment_receipts
    where payment_receipts.id = payment_receipt_id
    and payment_receipts.user_id = auth.uid()
  )
);

create policy "Admins can view all payment verifications"
on payment_verifications for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

create policy "Only admins can insert/update payment verifications"
on payment_verifications for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

-- email_logs policies
alter table email_logs enable row level security;

create policy "Only admins can view email logs"
on email_logs for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

create policy "Only system can insert email logs"
on email_logs for insert
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);