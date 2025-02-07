/*
  # Initial Schema for MCAN Lodge

  1. New Tables
    - `profiles`
      - Stores user profile information
      - Links to Supabase auth.users
    - `bookings`
      - Manages accommodation bookings
    - `rooms`
      - Stores room information
    - `feedback`
      - Stores user feedback and complaints

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  islamic_knowledge_level text,
  dietary_preferences text,
  prayer_requirements text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  capacity int NOT NULL,
  price_per_night decimal NOT NULL,
  amenities jsonb,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  room_id uuid REFERENCES rooms(id),
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  total_price decimal NOT NULL,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Anyone can view available rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Feedback policies
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());