-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'merchant', 'student');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create study halls table with custom row names and pricing
CREATE TABLE public.study_halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  total_seats INTEGER NOT NULL,
  rows INTEGER NOT NULL,
  seats_per_row INTEGER NOT NULL,
  custom_row_names TEXT[] NOT NULL DEFAULT ARRAY['A','B','C','D','E','F','G','H','I','J'],
  daily_price DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  weekly_price DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create seats table for individual seat management
CREATE TABLE public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_hall_id UUID NOT NULL REFERENCES public.study_halls(id) ON DELETE CASCADE,
  seat_id TEXT NOT NULL, -- e.g., 'A1', 'B2', etc.
  row_name TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(study_hall_id, seat_id)
);

-- Create booking periods enum
CREATE TYPE public.booking_period AS ENUM ('daily', 'weekly', 'monthly');

-- Create bookings table for reservation management
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_hall_id UUID NOT NULL REFERENCES public.study_halls(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  booking_period booking_period NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create storage bucket for study hall images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study-hall-images', 'study-hall-images', true);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for study_halls
CREATE POLICY "Anyone can view active study halls" ON public.study_halls FOR SELECT USING (status = 'active');
CREATE POLICY "Merchants can manage own study halls" ON public.study_halls FOR ALL USING (merchant_id = auth.uid());
CREATE POLICY "Merchants can insert study halls" ON public.study_halls FOR INSERT WITH CHECK (merchant_id = auth.uid());

-- RLS Policies for seats
CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Merchants can manage seats in their study halls" ON public.seats FOR ALL USING (
  study_hall_id IN (SELECT id FROM public.study_halls WHERE merchant_id = auth.uid())
);

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own bookings" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Merchants can view bookings for their study halls" ON public.bookings FOR SELECT USING (
  study_hall_id IN (SELECT id FROM public.study_halls WHERE merchant_id = auth.uid())
);

-- Storage policies for study hall images
CREATE POLICY "Anyone can view study hall images" ON storage.objects FOR SELECT USING (bucket_id = 'study-hall-images');
CREATE POLICY "Authenticated users can upload study hall images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'study-hall-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their own study hall images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'study-hall-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_halls_updated_at BEFORE UPDATE ON public.study_halls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create seats when study hall is created
CREATE OR REPLACE FUNCTION public.create_seats_for_study_hall()
RETURNS TRIGGER AS $$
DECLARE
  row_index INTEGER;
  seat_index INTEGER;
  row_name TEXT;
BEGIN
  -- Create seats based on the study hall configuration
  FOR row_index IN 1..NEW.rows LOOP
    -- Get the custom row name or default to A, B, C...
    IF array_length(NEW.custom_row_names, 1) >= row_index THEN
      row_name := NEW.custom_row_names[row_index];
    ELSE
      row_name := chr(64 + row_index); -- A, B, C...
    END IF;
    
    FOR seat_index IN 1..NEW.seats_per_row LOOP
      INSERT INTO public.seats (study_hall_id, seat_id, row_name, seat_number)
      VALUES (NEW.id, row_name || seat_index::text, row_name, seat_index);
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create seats
CREATE TRIGGER create_seats_after_study_hall_insert
  AFTER INSERT ON public.study_halls
  FOR EACH ROW EXECUTE FUNCTION public.create_seats_for_study_hall();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();