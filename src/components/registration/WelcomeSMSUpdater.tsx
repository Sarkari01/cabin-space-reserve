
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const WelcomeSMSUpdater = () => {
  useEffect(() => {
    // Update SMS templates with new welcome messages
    const updateTemplates = async () => {
      try {
        const templates = [
          {
            purpose: 'merchant_created',
            template_name: 'Merchant Welcome',
            message_template: 'Welcome {name}! Your merchant account has been created successfully. Please check your email to verify your account and complete the setup process. - {brand_name}',
            variables: '["name", "brand_name"]'
          },
          {
            purpose: 'user_created',
            template_name: 'User Welcome', 
            message_template: 'Hi {name}! Your account has been created successfully. Please check your email to verify your account and start exploring study spaces. - {brand_name}',
            variables: '["name", "brand_name"]'
          }
        ];

        for (const template of templates) {
          await supabase
            .from('sms_templates')
            .upsert(template, { onConflict: 'purpose' });
        }

        console.log('Updated welcome SMS templates');
      } catch (error) {
        console.error('Error updating SMS templates:', error);
      }
    };

    updateTemplates();
  }, []);

  return null;
};
