import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { MerchantOnboardingForm } from "./MerchantOnboardingForm";

interface MerchantOnboardingGuardProps {
  children: React.ReactNode;
}

export const MerchantOnboardingGuard = ({ children }: MerchantOnboardingGuardProps) => {
  const { userRole } = useAuth();
  const { profile, loading } = useMerchantProfile();

  // Show loading while fetching profile
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

  // Only apply guard to merchants
  if (userRole !== 'merchant') {
    return <>{children}</>;
  }

  // If merchant hasn't completed onboarding, show the form
  if (!profile?.is_onboarding_complete) {
    return <MerchantOnboardingForm />;
  }

  // Allow access to dashboard
  return <>{children}</>;
};