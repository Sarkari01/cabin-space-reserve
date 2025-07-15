-- Create review status enum
CREATE TYPE review_status AS ENUM ('approved', 'pending', 'hidden');

-- Create study_hall_reviews table
CREATE TABLE public.study_hall_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_hall_id UUID NOT NULL REFERENCES public.study_halls(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status review_status NOT NULL DEFAULT 'approved',
  merchant_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one review per user per study hall
  UNIQUE(user_id, study_hall_id),
  -- Ensure only completed bookings can be reviewed
  CONSTRAINT valid_booking CHECK (booking_id IN (
    SELECT id FROM bookings WHERE status = 'completed' AND payment_status = 'paid'
  ))
);

-- Add rating fields to study_halls table
ALTER TABLE public.study_halls 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Enable RLS on study_hall_reviews
ALTER TABLE public.study_hall_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_hall_reviews
CREATE POLICY "Users can view approved reviews" 
ON public.study_hall_reviews 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can create reviews for their completed bookings" 
ON public.study_hall_reviews 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  booking_id IN (
    SELECT id FROM bookings 
    WHERE user_id = auth.uid() 
    AND status = 'completed' 
    AND payment_status = 'paid'
  )
);

CREATE POLICY "Users can update their own reviews" 
ON public.study_hall_reviews 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Merchants can view reviews for their study halls" 
ON public.study_hall_reviews 
FOR SELECT 
USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can respond to reviews for their study halls" 
ON public.study_hall_reviews 
FOR UPDATE 
USING (merchant_id = auth.uid())
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Admins can manage all reviews" 
ON public.study_hall_reviews 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Function to update study hall average rating
CREATE OR REPLACE FUNCTION public.update_study_hall_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_avg DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate average rating and count for the study hall
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2),
    COUNT(*)::INTEGER
  INTO new_avg, review_count
  FROM public.study_hall_reviews 
  WHERE study_hall_id = COALESCE(NEW.study_hall_id, OLD.study_hall_id)
  AND status = 'approved';
  
  -- Update study hall with new rating
  UPDATE public.study_halls 
  SET 
    average_rating = new_avg,
    total_reviews = review_count,
    updated_at = now()
  WHERE id = COALESCE(NEW.study_hall_id, OLD.study_hall_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers to update study hall rating on review changes
CREATE TRIGGER update_study_hall_rating_on_insert
  AFTER INSERT ON public.study_hall_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_study_hall_rating();

CREATE TRIGGER update_study_hall_rating_on_update
  AFTER UPDATE ON public.study_hall_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_study_hall_rating();

CREATE TRIGGER update_study_hall_rating_on_delete
  AFTER DELETE ON public.study_hall_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_study_hall_rating();

-- Function to get eligible bookings for review
CREATE OR REPLACE FUNCTION public.get_eligible_bookings_for_review(p_user_id UUID)
RETURNS TABLE(
  booking_id UUID,
  study_hall_id UUID,
  study_hall_name TEXT,
  end_date DATE,
  already_reviewed BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.study_hall_id,
    sh.name,
    b.end_date,
    EXISTS(
      SELECT 1 FROM study_hall_reviews r 
      WHERE r.booking_id = b.id AND r.user_id = p_user_id
    ) as already_reviewed
  FROM bookings b
  JOIN study_halls sh ON b.study_hall_id = sh.id
  WHERE b.user_id = p_user_id
    AND b.status = 'completed'
    AND b.payment_status = 'paid'
    AND b.end_date >= CURRENT_DATE - INTERVAL '90 days' -- Can review within 90 days
  ORDER BY b.end_date DESC;
END;
$$;

-- Update trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.study_hall_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();