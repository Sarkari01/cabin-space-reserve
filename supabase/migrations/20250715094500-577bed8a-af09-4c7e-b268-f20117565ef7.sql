-- Fix existing data consistency by triggering seat regeneration
-- This will force seat regeneration for all active study halls with mismatched seat counts
UPDATE study_halls 
SET updated_at = NOW() 
WHERE status = 'active' 
  AND id IN (
    SELECT sh.id 
    FROM study_halls sh
    LEFT JOIN (
      SELECT study_hall_id, COUNT(*) as actual_seats
      FROM seats 
      GROUP BY study_hall_id
    ) s ON sh.id = s.study_hall_id
    WHERE COALESCE(s.actual_seats, 0) != sh.total_seats
  );