import { supabase } from '@/integrations/supabase/client';

export const createDemoUsers = async () => {
  try {
    // Get brand settings for dynamic email domains
    type PublicBusinessSettings = { brand_name?: string; website_url?: string };
    const { data: brandSettingsRaw } = await supabase
      .rpc('get_public_business_settings');
    
    const brandSettings = (brandSettingsRaw ?? {}) as Partial<PublicBusinessSettings>;
    const brandName = brandSettings.brand_name ?? 'StudySpace';
    let domain = 'studyspace.com';
    if (brandSettings.website_url) {
      try {
        domain = new URL(brandSettings.website_url).hostname;
      } catch (e) {
        console.warn('Invalid website_url in brand settings:', brandSettings.website_url);
      }
    }

    // Create Admin User
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: `admin@${domain}`,
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: `${brandName} Admin`,
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
      email: `merchant@${domain}`,
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
      email: `student@${domain}`,
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