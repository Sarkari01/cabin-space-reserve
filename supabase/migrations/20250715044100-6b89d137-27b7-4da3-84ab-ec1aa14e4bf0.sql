-- Fix the auto_recover_pending_ekqr_payments function with proper JSON handling
CREATE OR REPLACE FUNCTION public.auto_recover_pending_ekqr_payments()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE LOG 'Starting automatic EKQR payment recovery';
  
  -- Call the auto-ekqr-recovery edge function with proper headers
  PERFORM net.http_post(
    url := 'https://jseyxxsptcckjumjcljk.supabase.co/functions/v1/auto-ekqr-recovery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := jsonb_build_object()
  );
  
  RAISE LOG 'Automatic EKQR payment recovery completed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in auto_recover_pending_ekqr_payments: %', SQLERRM;
END;
$function$;