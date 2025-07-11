-- Make chat-attachments bucket public for image display
UPDATE storage.buckets 
SET public = true 
WHERE id = 'chat-attachments';