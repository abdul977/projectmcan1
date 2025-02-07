-- Enable RLS on profiles table if not already enabled
alter table profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile"
on profiles for select
using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "Admins can view all profiles"
on profiles for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'manager')
  )
);