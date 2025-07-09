-- Create demo users with authentication
-- Note: In production, these would be created through the auth signup process

-- First, let's create profiles for demo users
-- We'll use UUIDs that would typically come from auth.users

INSERT INTO public.profiles (id, email, full_name, role, phone) VALUES
-- Admin user
('11111111-1111-1111-1111-111111111111', 'admin@studyspace.com', 'Admin User', 'admin', '+91-9876543210'),
-- Merchant user  
('22222222-2222-2222-2222-222222222222', 'merchant@studyspace.com', 'Sarah Merchant', 'merchant', '+91-9876543211'),
-- Student user
('33333333-3333-3333-3333-333333333333', 'student@studyspace.com', 'John Student', 'student', '+91-9876543212');

-- Create a demo study hall for the merchant
INSERT INTO public.study_halls (
  id,
  merchant_id,
  name,
  description,
  location,
  total_seats,
  rows,
  seats_per_row,
  custom_row_names,
  daily_price,
  weekly_price,
  monthly_price,
  status
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'Downtown Study Center',
  'A quiet and comfortable study space in the heart of the city',
  'MG Road, Bangalore',
  25,
  5,
  5,
  ARRAY['A', 'B', 'C', 'D', 'E'],
  150.00,
  800.00,
  2500.00,
  'active'
);

-- Create a sample booking for the student
INSERT INTO public.bookings (
  id,
  user_id,
  study_hall_id,
  seat_id,
  booking_period,
  start_date,
  end_date,
  total_amount,
  status
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '33333333-3333-3333-3333-333333333333',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM public.seats WHERE study_hall_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' LIMIT 1),
  'daily',
  CURRENT_DATE,
  CURRENT_DATE,
  150.00,
  'active'
);