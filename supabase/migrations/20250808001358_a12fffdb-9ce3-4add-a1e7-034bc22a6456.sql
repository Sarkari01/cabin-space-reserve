
-- 1) Ensure pg_cron and pg_net are available for scheduling (safe if already installed)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Default/normalization trigger for cabin bookings:
--    - If end_date is NULL, set end_date = start_date + 30 days
--    - Ensure is_vacated defaults to false when not provided
create or replace function public.set_cabin_booking_defaults()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.is_vacated is null then
    new.is_vacated := false;
  end if;

  -- Only normalize when start_date is provided and end_date is missing
  if new.start_date is not null and new.end_date is null then
    new.end_date := (new.start_date + interval '30 days')::date;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_cabin_booking_defaults on public.cabin_bookings;

create trigger trg_set_cabin_booking_defaults
before insert on public.cabin_bookings
for each row
execute function public.set_cabin_booking_defaults();

-- 3) Auto-expire function:
--    Marks all non-vacated cabin bookings whose end_date has passed as vacated
create or replace function public.auto_expire_cabin_bookings()
returns table(expired_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.cabin_bookings
     set is_vacated = true,
         vacated_at = now(),
         updated_at = now()
   where is_vacated = false
     and end_date < current_date;

  get diagnostics v_count = row_count;
  return query select coalesce(v_count, 0);
end;
$$;

-- 4) Schedule the auto-expiry to run hourly at minute 10
--    If a job with the same name exists, first unschedule it
select cron.unschedule(jobid)
from cron.job
where jobname = 'auto-expire-cabin-bookings-hourly';

select
  cron.schedule(
    'auto-expire-cabin-bookings-hourly',
    '10 * * * *',
    $$
    select public.auto_expire_cabin_bookings();
    $$
  );
