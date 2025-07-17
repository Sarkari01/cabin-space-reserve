-- Create the qr-codes storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-codes', 
  'qr-codes', 
  true, 
  1048576, -- 1MB limit
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg'];

-- Create storage policies for QR codes bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'qr-codes-public-read',
  'qr-codes',
  'QR codes are publicly readable',
  'true',
  'true',
  'SELECT',
  ARRAY['public', 'authenticated', 'anon']
)
ON CONFLICT (id) DO UPDATE SET
  definition = 'true',
  check = 'true';

INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'qr-codes-authenticated-write',
  'qr-codes',
  'Authenticated users can upload QR codes',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'INSERT',
  ARRAY['authenticated']
)
ON CONFLICT (id) DO UPDATE SET
  definition = 'auth.role() = ''authenticated''',
  check = 'auth.role() = ''authenticated''';

INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'qr-codes-authenticated-update',
  'qr-codes',
  'Authenticated users can update QR codes',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'UPDATE',
  ARRAY['authenticated']
)
ON CONFLICT (id) DO UPDATE SET
  definition = 'auth.role() = ''authenticated''',
  check = 'auth.role() = ''authenticated''';

INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'qr-codes-authenticated-delete',
  'qr-codes',
  'Authenticated users can delete QR codes',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'DELETE',
  ARRAY['authenticated']
)
ON CONFLICT (id) DO UPDATE SET
  definition = 'auth.role() = ''authenticated''',
  check = 'auth.role() = ''authenticated''';