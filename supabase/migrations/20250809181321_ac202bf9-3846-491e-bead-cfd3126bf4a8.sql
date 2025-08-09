
-- 1) Add assigned_private_halls to incharges
ALTER TABLE public.incharges
ADD COLUMN IF NOT EXISTS assigned_private_halls JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) Allow incharges to view cabin bookings for assigned private halls
CREATE POLICY "Incharges can view cabin bookings for assigned private halls"
ON public.cabin_bookings
FOR SELECT
USING (
  private_hall_id IN (
    SELECT jsonb_array_elements_text(assigned_private_halls)::uuid
    FROM public.incharges
    WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      AND status = 'active'
  )
);

-- 3) Allow incharges to update cabin bookings for assigned private halls
CREATE POLICY "Incharges can update cabin bookings for assigned private halls"
ON public.cabin_bookings
FOR UPDATE
USING (
  private_hall_id IN (
    SELECT jsonb_array_elements_text(assigned_private_halls)::uuid
    FROM public.incharges
    WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      AND status = 'active'
  )
);

-- 4) Allow incharges to view transactions linked to cabin bookings in assigned private halls
CREATE POLICY "Incharges can view transactions for assigned private halls"
ON public.transactions
FOR SELECT
USING (
  cabin_booking_id IN (
    SELECT cb.id
    FROM public.cabin_bookings cb
    WHERE cb.private_hall_id IN (
      SELECT jsonb_array_elements_text(assigned_private_halls)::uuid
      FROM public.incharges
      WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        AND status = 'active'
    )
  )
);
