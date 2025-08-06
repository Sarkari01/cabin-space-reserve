
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface MerchantProfile {
  id: string;
  merchant_id: string;
  phone?: string;
  business_address?: string;
  trade_license_number?: string;
  trade_license_document_url?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  gstin_pan?: string;
  business_email?: string;
  is_onboarding_complete: boolean;
  onboarding_step: number;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantDocument {
  id: string;
  merchant_profile_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  verification_status: string;
  verification_notes?: string;
  uploaded_at: string;
}

export const useMerchantProfile = () => {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [documents, setDocuments] = useState<MerchantDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      console.log('useMerchantProfile: No user found');
      setLoading(false);
      return;
    }

    console.log('useMerchantProfile: Fetching profile for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*')
        .eq('merchant_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('useMerchantProfile: Error fetching profile:', error);
        throw error;
      }

      // If no profile exists, create one
      if (!data) {
        console.log('useMerchantProfile: No merchant profile found, creating one for user:', user.id);
        const { data: newProfile, error: createError } = await supabase
          .from('merchant_profiles')
          .insert({ 
            merchant_id: user.id,
            is_onboarding_complete: false,
            onboarding_step: 1,
            verification_status: 'pending'
          })
          .select()
          .single();

        if (createError) {
          console.error('useMerchantProfile: Error creating merchant profile:', createError);
          throw createError;
        }

        console.log('useMerchantProfile: Created new profile:', newProfile);
        setProfile(newProfile);
      } else {
        console.log('useMerchantProfile: Found existing profile:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('useMerchantProfile: Error in fetchProfile:', error);
      toast({
        title: "Error",
        description: "Failed to load merchant profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('merchant_documents')
        .select('*')
        .eq('merchant_profile_id', profile.id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('useMerchantProfile: Error fetching documents:', error);
    }
  };

  const updateProfile = async (updates: Partial<MerchantProfile>, showSuccessToast: boolean = true) => {
    if (!user || !profile) {
      console.error('useMerchantProfile: Cannot update - no user or profile');
      return;
    }

    try {
      console.log('useMerchantProfile: Updating profile with:', updates);
      
      const { data, error } = await supabase
        .from('merchant_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      console.log('useMerchantProfile: Profile updated successfully:', data);
      setProfile(data);
      
      if (showSuccessToast) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }

      return data;
    } catch (error) {
      console.error('useMerchantProfile: Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadDocument = async (
    file: File,
    documentType: string
  ): Promise<MerchantDocument> => {
    console.log('useMerchantProfile: Starting document upload', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      documentType,
      userExists: !!user,
      profileExists: !!profile,
      profileId: profile?.id
    });

    if (!user || !profile) {
      const error = 'User must be authenticated and profile must be loaded';
      console.error('useMerchantProfile:', error, { user: !!user, profile: !!profile });
      throw new Error(error);
    }

    try {
      // Upload file to storage
      const fileName = `${user.id}/${documentType}_${Date.now()}_${file.name}`;
      
      console.log('useMerchantProfile: Uploading to storage with fileName:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('merchant-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('useMerchantProfile: Storage upload error:', uploadError);
        
        // Provide more specific error messages
        if (uploadError.message.includes('policy')) {
          throw new Error('Storage permission denied. Please contact support.');
        } else if (uploadError.message.includes('size')) {
          throw new Error('File size exceeds the allowed limit.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      console.log('useMerchantProfile: Storage upload successful');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('merchant-documents')
        .getPublicUrl(fileName);

      console.log('useMerchantProfile: Generated public URL:', publicUrl);

      // Save document record
      const { data, error } = await supabase
        .from('merchant_documents')
        .insert({
          merchant_profile_id: profile.id,
          document_type: documentType,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (error) {
        console.error('useMerchantProfile: Database insert error:', error);
        
        // Clean up uploaded file if database insert fails
        console.log('useMerchantProfile: Cleaning up uploaded file due to DB error');
        await supabase.storage.from('merchant-documents').remove([fileName]);
        
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('useMerchantProfile: Document record created successfully:', data);

      setDocuments(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('useMerchantProfile: Upload process failed:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    if (!profile) {
      console.error('useMerchantProfile: No profile found for onboarding completion');
      return;
    }

    try {
      console.log('useMerchantProfile: Starting onboarding completion');
      
      // Update the profile with completion status (don't show toast in updateProfile)
      const updatedProfile = await updateProfile({
        is_onboarding_complete: true,
        onboarding_step: 4,
      }, false);

      console.log('useMerchantProfile: Profile updated successfully', updatedProfile);

      // Immediately update the local state to trigger re-render
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      
      console.log('useMerchantProfile: Profile state updated, current status:', {
        is_onboarding_complete: updatedProfile?.is_onboarding_complete,
        verification_status: updatedProfile?.verification_status,
        onboarding_step: updatedProfile?.onboarding_step
      });

    } catch (error) {
      console.error('useMerchantProfile: Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    console.log('useMerchantProfile: useEffect triggered', { user: !!user, userRole });
    
    if (!user) {
      console.log('useMerchantProfile: No user, setting loading to false');
      setLoading(false);
      return;
    }

    // Only fetch profile for merchants
    if (userRole === 'merchant') {
      console.log('useMerchantProfile: User is merchant, fetching profile');
      fetchProfile();
    } else {
      // For non-merchants, set loading to false immediately
      console.log('useMerchantProfile: User is not merchant, setting loading to false');
      setLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (profile?.id) {
      console.log('useMerchantProfile: Profile loaded, fetching documents');
      fetchDocuments();
    }
  }, [profile?.id]);

  return {
    profile,
    documents,
    loading,
    updateProfile,
    uploadDocument,
    completeOnboarding,
    refetch: fetchProfile,
  };
};
