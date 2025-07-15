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
  const { user } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [documents, setDocuments] = useState<MerchantDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*')
        .eq('merchant_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching merchant profile:', error);
      toast({
        title: "Error",
        description: "Failed to load merchant profile",
        variant: "destructive",
      });
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
      console.error('Error fetching documents:', error);
    }
  };

  const updateProfile = async (updates: Partial<MerchantProfile>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
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
    if (!user || !profile) throw new Error('No user or profile');

    // Upload file to storage
    const fileName = `${user.id}/${documentType}_${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('merchant-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('merchant-documents')
      .getPublicUrl(fileName);

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

    if (error) throw error;

    setDocuments(prev => [...prev, data]);
    return data;
  };

  const completeOnboarding = async () => {
    if (!profile) return;

    await updateProfile({
      is_onboarding_complete: true,
      onboarding_step: 4,
    });
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchDocuments();
      setLoading(false);
    }
  }, [profile]);

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