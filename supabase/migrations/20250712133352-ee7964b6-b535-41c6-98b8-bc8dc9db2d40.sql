-- Create sample transaction data for testing
INSERT INTO transactions (user_id, booking_id, amount, payment_method, status, payment_data, created_at, updated_at)
SELECT 
  b.user_id,
  b.id,
  b.total_amount,
  CASE 
    WHEN random() < 0.33 THEN 'razorpay'
    WHEN random() < 0.66 THEN 'ekqr'
    ELSE 'offline'
  END,
  CASE 
    WHEN random() < 0.7 THEN 'completed'
    WHEN random() < 0.85 THEN 'pending'
    WHEN random() < 0.95 THEN 'processing'
    ELSE 'failed'
  END,
  CASE 
    WHEN random() < 0.5 THEN jsonb_build_object('payment_id', 'pay_' || generate_random_uuid()::text, 'order_id', 'order_' || generate_random_uuid()::text)
    ELSE jsonb_build_object('qr_id', 'qr_' || generate_random_uuid()::text, 'transaction_ref', 'txn_' || generate_random_uuid()::text)
  END,
  b.created_at + (random() * interval '2 hours'),
  b.updated_at + (random() * interval '2 hours')
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t WHERE t.booking_id = b.id
);