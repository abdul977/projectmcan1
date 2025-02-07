-- Create rooms table
create table if not exists rooms (
  id uuid default uuid_generate_v4() primary key,
  name varchar(100) not null,
  description text,
  capacity int not null check (capacity > 0),
  price_per_night decimal(10,2) not null check (price_per_night > 0),
  amenities text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create trigger for updated_at
create trigger set_timestamp_rooms
    before update on rooms
    for each row
    execute function update_updated_at_column();

-- Create indexes
create index if not exists idx_rooms_is_available on rooms(is_available);
create index if not exists idx_rooms_price on rooms(price_per_night);

-- Enable RLS
alter table rooms enable row level security;

-- RLS policies
create policy "Anyone can view available rooms"
on rooms for select
using (true);

create policy "Admins can manage rooms"
on rooms for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);

-- Add foreign key constraint to bookings table
alter table bookings 
add constraint fk_bookings_room_id 
foreign key (room_id) 
references rooms(id) 
on delete restrict;

-- Insert some sample rooms (optional, remove in production)
insert into rooms (name, description, capacity, price_per_night, amenities)
values 
  (
    'Standard Single Room',
    'Cozy room perfect for solo travelers',
    1,
    100.00,
    array['WiFi', 'Air Conditioning', 'TV', 'Private Bathroom']
  ),
  (
    'Deluxe Double Room',
    'Spacious room with modern amenities',
    2,
    150.00,
    array['WiFi', 'Air Conditioning', 'TV', 'Private Bathroom', 'Mini Fridge', 'Coffee Maker']
  ),
  (
    'Executive Suite',
    'Luxury suite with separate living area',
    3,
    250.00,
    array['WiFi', 'Air Conditioning', 'TV', 'Private Bathroom', 'Mini Fridge', 'Coffee Maker', 'Living Room', 'Work Desk']
  )
on conflict (id) do nothing;