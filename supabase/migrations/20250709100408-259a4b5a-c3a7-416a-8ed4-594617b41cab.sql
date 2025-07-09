-- Create demo merchants for testing
INSERT INTO profiles (id, email, full_name, role, phone) VALUES
  (gen_random_uuid(), 'merchant1@studyspace.com', 'John Merchant', 'merchant', '+1234567890'),
  (gen_random_uuid(), 'merchant2@studyspace.com', 'Sarah Business', 'merchant', '+1234567891'),
  (gen_random_uuid(), 'student1@studyspace.com', 'Alice Student', 'student', '+1234567892');