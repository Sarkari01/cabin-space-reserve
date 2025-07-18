
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const WelcomeSMSUpdater = () => {
  useEffect(() => {
    // Update SMS templates with corrected welcome messages
    const updateTemplates = async () => {
      try {
        const templates = [
          {
            purpose: 'merchant_created',
            template_name: 'Merchant Welcome',
            template_id: '1707174404334858000', // Use your actual template ID if you have one
            message_template: 'Welcome {name}! Your DueDesk merchant account has been created. Please check your email to verify your account and complete setup. Login with your email and the password you created. - DueDesk',
            variables: '["name"]'
          },
          {
            purpose: 'user_created',
            template_name: 'User Welcome', 
            template_id: '1707174404334858001', // Use your actual template ID if you have one
            message_template: 'Hi {name}! Welcome to DueDesk! Your account is ready. Please check your email to verify and start exploring study spaces. Login with your email and password. - DueDesk',
            variables: '["name"]'
          }
        ];

        for (const template of templates) {
          const { error } = await supabase
            .from('sms_templates')
            .upsert(template, { onConflict: 'purpose' });
          
          if (error) {
            console.error('Error updating template:', template.purpose, error);
          }
        }

        console.log('Updated welcome SMS templates with correct format');
      } catch (error) {
        console.error('Error updating SMS templates:', error);
      }
    };

    updateTemplates();
  }, []);

  return null;
};
