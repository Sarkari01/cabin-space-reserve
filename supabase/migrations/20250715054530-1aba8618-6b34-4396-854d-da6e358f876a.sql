-- Test admin booking update permissions and add debugging
SELECT 
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy 
WHERE polrelid = 'bookings'::regclass
ORDER BY polname;