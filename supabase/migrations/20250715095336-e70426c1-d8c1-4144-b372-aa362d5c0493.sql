-- Create rewards system tables
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reward transactions table
CREATE TABLE public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired')),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  referral_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('flat', 'percentage')),
  value NUMERIC NOT NULL,
  min_booking_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  merchant_id UUID REFERENCES public.profiles(id),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'new_users', 'returning_users')),
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  user_usage_limit INTEGER DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coupon usage table
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id),
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referral codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  successful_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referral rewards table
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  booking_id UUID REFERENCES public.bookings(id),
  referrer_reward_points INTEGER NOT NULL DEFAULT 0,
  referee_reward_points INTEGER NOT NULL DEFAULT 0,
  referrer_coupon_id UUID REFERENCES public.coupons(id),
  referee_coupon_id UUID REFERENCES public.coupons(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards
CREATE POLICY "Users can view their own rewards" ON public.rewards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own rewards" ON public.rewards
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can manage rewards" ON public.rewards
  FOR ALL USING (true);

-- RLS Policies for reward_transactions
CREATE POLICY "Users can view their own reward transactions" ON public.reward_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create reward transactions" ON public.reward_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all reward transactions" ON public.reward_transactions
  FOR SELECT USING (is_admin());

-- RLS Policies for coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (status = 'active' AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admins can manage all coupons" ON public.coupons
  FOR ALL USING (is_admin());

CREATE POLICY "Merchants can view relevant coupons" ON public.coupons
  FOR SELECT USING (merchant_id = auth.uid() OR merchant_id IS NULL);

-- RLS Policies for coupon_usage
CREATE POLICY "Users can view their own coupon usage" ON public.coupon_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create coupon usage" ON public.coupon_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
  FOR SELECT USING (is_admin());

CREATE POLICY "Merchants can view coupon usage for their study halls" ON public.coupon_usage
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM bookings b 
      JOIN study_halls sh ON b.study_hall_id = sh.id 
      WHERE sh.merchant_id = auth.uid()
    )
  );

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own referral codes" ON public.referral_codes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can manage referral codes" ON public.referral_codes
  FOR ALL USING (true);

CREATE POLICY "Admins can view all referral codes" ON public.referral_codes
  FOR SELECT USING (is_admin());

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view their referral rewards" ON public.referral_rewards
  FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "System can manage referral rewards" ON public.referral_rewards
  FOR ALL USING (true);

CREATE POLICY "Admins can view all referral rewards" ON public.referral_rewards
  FOR SELECT USING (is_admin());

-- Create indexes for performance
CREATE INDEX idx_rewards_user_id ON public.rewards(user_id);
CREATE INDEX idx_reward_transactions_user_id ON public.reward_transactions(user_id);
CREATE INDEX idx_reward_transactions_type ON public.reward_transactions(type);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_merchant_id ON public.coupons(merchant_id);
CREATE INDEX idx_coupons_status ON public.coupons(status);
CREATE INDEX idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_rewards_referrer_id ON public.referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referee_id ON public.referral_rewards(referee_id);

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Create function to initialize user rewards and referral code
CREATE OR REPLACE FUNCTION public.initialize_user_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create rewards record
  INSERT INTO public.rewards (user_id, total_points, available_points)
  VALUES (NEW.id, 0, 0);
  
  -- Create referral code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, public.generate_referral_code());
  
  RETURN NEW;
END;
$$;

-- Create trigger to initialize rewards for new users
CREATE TRIGGER initialize_user_rewards_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_rewards();

-- Create function to update reward points
CREATE OR REPLACE FUNCTION public.update_user_rewards(
  p_user_id UUID,
  p_points INTEGER,
  p_type TEXT,
  p_reason TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_referral_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert reward transaction
  INSERT INTO public.reward_transactions (user_id, type, points, reason, booking_id, referral_id)
  VALUES (p_user_id, p_type, p_points, p_reason, p_booking_id, p_referral_id);
  
  -- Update rewards table
  IF p_type = 'earned' THEN
    UPDATE public.rewards 
    SET 
      total_points = total_points + p_points,
      available_points = available_points + p_points,
      lifetime_earned = lifetime_earned + p_points,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF p_type = 'redeemed' THEN
    UPDATE public.rewards 
    SET 
      available_points = available_points - p_points,
      lifetime_redeemed = lifetime_redeemed + p_points,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Create function to award booking completion rewards
CREATE OR REPLACE FUNCTION public.award_booking_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  reward_points INTEGER;
  is_first_booking BOOLEAN;
BEGIN
  -- Only award rewards when booking is completed and paid
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' AND 
     (OLD.status != 'completed' OR OLD.payment_status != 'paid') THEN
    
    -- Calculate 5% of booking amount as reward points (minimum 50 points)
    reward_points := GREATEST(ROUND(NEW.total_amount * 0.05), 50);
    
    -- Check if this is user's first completed booking
    SELECT NOT EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE user_id = NEW.user_id 
        AND status = 'completed' 
        AND payment_status = 'paid'
        AND id != NEW.id
    ) INTO is_first_booking;
    
    -- Award booking completion reward
    PERFORM public.update_user_rewards(
      NEW.user_id, 
      reward_points, 
      'earned', 
      'Booking completion reward',
      NEW.id
    );
    
    -- Award first booking bonus
    IF is_first_booking THEN
      PERFORM public.update_user_rewards(
        NEW.user_id, 
        500, 
        'earned', 
        'First booking bonus',
        NEW.id
      );
    END IF;
    
    RAISE LOG 'Awarded % reward points to user % for booking %', reward_points, NEW.user_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for booking rewards
CREATE TRIGGER award_booking_rewards_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.award_booking_rewards();

-- Create updated_at triggers for new tables
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();