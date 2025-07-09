import { supabase } from '@/integrations/supabase/client';

export const createDemoUsers = async () => {
  try {
    // Create Admin User
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@studyspace.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (adminError) {
      console.error('Admin user creation failed:', adminError);
    } else {
      console.log('Admin user created:', adminData);
    }

    // Create Merchant User
    const { data: merchantData, error: merchantError } = await supabase.auth.admin.createUser({
      email: 'merchant@studyspace.com',
      password: 'merchant123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Sarah Merchant',
        role: 'merchant'
      }
    });

    if (merchantError) {
      console.error('Merchant user creation failed:', merchantError);
    } else {
      console.log('Merchant user created:', merchantData);
    }

    // Create Student User
    const { data: studentData, error: studentError } = await supabase.auth.admin.createUser({
      email: 'student@studyspace.com',
      password: 'student123',
      email_confirm: true,
      user_metadata: {
        full_name: 'John Student',
        role: 'student'
      }
    });

    if (studentError) {
      console.error('Student user creation failed:', studentError);
    } else {
      console.log('Student user created:', studentData);
    }

  } catch (error) {
    console.error('Error creating demo users:', error);
  }
};