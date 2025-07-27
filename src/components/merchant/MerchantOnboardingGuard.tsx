
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { MerchantOnboardingForm } from "./MerchantOnboardingForm";
import { MerchantUnderReview } from "./MerchantUnderReview";

interface MerchantOnboardingGuardProps {
  children: React.ReactNode;
}

export const MerchantOnboardingGuard = ({ children }: MerchantOnboardingGuardProps) => {
  const { userRole } = useAuth();

  console.log('MerchantOnboardingGuard: Rendering with userRole:', userRole);

  // Only apply guard to merchants - return children immediately for non-merchants
  if (userRole !== 'merchant') {
    console.log('MerchantOnboardingGuard: Non-merchant user, allowing access');
    return <>{children}</>;
  }

  // For merchants, use the hook to check onboarding status
  const { profile, loading } = useMerchantProfile();

  console.log('MerchantOnboardingGuard: Merchant profile data:', {
    profile: profile ? {
      id: profile.id,
      is_onboarding_complete: profile.is_onboarding_complete,
      onboarding_step: profile.onboarding_step,
      verification_status: profile.verification_status
    } : null,
    loading
  });

  // Show loading while fetching merchant profile
  if (loading) {
    console.log('MerchantOnboardingGuard: Showing loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If no profile exists or onboarding is not complete, show the onboarding form
  if (!profile || !profile.is_onboarding_complete) {
    console.log('MerchantOnboardingGuard: Onboarding not complete, showing MerchantOnboardingForm');
    return <MerchantOnboardingForm />;
  }

  // If onboarding is complete but not approved, show under review screen
  if (profile.verification_status !== 'approved') {
    console.log('MerchantOnboardingGuard: Onboarding complete but not approved, showing under review');
    return <MerchantUnderReview profile={profile} />;
  }

  // Allow access to dashboard only when approved
  console.log('MerchantOnboardingGuard: Merchant approved, allowing dashboard access');
  return <>{children}</>;
};
