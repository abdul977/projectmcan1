-- Create bookings table
create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  room_id uuid not null,
  check_in_date date not null,
  check_out_date date not null,
  total_price decimal(10,2) not null,
  status varchar(20) default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status varchar(20) default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create trigger for updated_at
create trigger set_timestamp_bookings
    before update on bookings
    for each row
    execute function update_updated_at_column();

-- Create indexes for better query performance
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_bookings_room_id on bookings(room_id);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_payment_status on bookings(payment_status);
create index if not exists idx_bookings_check_in_date on bookings(check_in_date);

-- Enable RLS
alter table bookings enable row level security;

-- RLS policies
create policy "Users can view their own bookings"
on bookings for select
using (auth.uid() = user_id);

create policy "Users can create their own bookings"
on bookings for insert
with check (auth.uid() = user_id);

create policy "Users can update their own pending bookings"
on bookings for update
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id);

create policy "Admins can view all bookings"
on bookings for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

create policy "Admins can update any booking"
on bookings for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);