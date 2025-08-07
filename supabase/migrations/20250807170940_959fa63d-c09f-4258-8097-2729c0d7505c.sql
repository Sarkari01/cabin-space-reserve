-- Update all cabins across active private halls with realistic deposit amounts
UPDATE public.cabins 
SET refundable_deposit = CASE 
  WHEN cabin_number <= 3 THEN 1000.00  -- First 3 cabins: ₹1000 deposit
  WHEN cabin_number <= 6 THEN 1500.00  -- Next 3 cabins: ₹1500 deposit  
  WHEN cabin_number <= 9 THEN 2000.00  -- Next 3 cabins: ₹2000 deposit
  ELSE 500.00                          -- Remaining cabins: ₹500 deposit
END,
updated_at = now()
WHERE private_hall_id IN (
  SELECT id FROM public.private_halls 
  WHERE status = 'active'
);