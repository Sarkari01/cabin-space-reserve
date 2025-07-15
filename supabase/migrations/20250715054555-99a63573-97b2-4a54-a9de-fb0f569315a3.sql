-- Add enhanced logging for booking updates and check policies
DO $$
BEGIN
  RAISE LOG 'Testing booking update permissions and policies...';
  
  -- Test if admin function works correctly
  IF is_admin() THEN
    RAISE LOG 'Current user has admin privileges';
  ELSE
    RAISE LOG 'Current user does not have admin privileges';
  END IF;
END
$$;

-- Also test the booking update triggers
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'bookings'::regclass
  AND tgname LIKE '%booking%'
ORDER BY tgname;