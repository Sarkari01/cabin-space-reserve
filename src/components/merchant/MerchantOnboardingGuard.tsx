import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { MerchantOnboardingForm } from "./MerchantOnboardingForm";

interface MerchantOnboardingGuardProps {
  children: React.ReactNode;
}

export const MerchantOnboardingGuard = ({ children }: MerchantOnboardingGuardProps) => {
  const { userRole } = useAuth();

  // Only apply guard to merchants - return children immediately for non-merchants
  if (userRole !== 'merchant') {
    return <>{children}</>;
  }

  // For merchants, use the hook to check onboarding status
  const { profile, loading } = useMerchantProfile();

  // Show loading while fetching merchant profile
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If merchant hasn't completed onboarding, show the form
  if (!profile?.is_onboarding_complete) {
    return <MerchantOnboardingForm />;
  }

  // Allow access to dashboard
  return <>{children}</>;
};