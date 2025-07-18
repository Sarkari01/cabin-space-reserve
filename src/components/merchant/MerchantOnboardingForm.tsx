
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { useAuth } from "@/hooks/useAuth";
import { BusinessInfoStep } from "./onboarding/BusinessInfoStep";
import { BankDetailsStep } from "./onboarding/BankDetailsStep";
import { KYCDocumentsStep } from "./onboarding/KYCDocumentsStep";
import { CheckCircle, Building, CreditCard, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBrandSettings } from "@/hooks/useBrandSettings";

export const MerchantOnboardingForm = () => {
  console.log('MerchantOnboardingForm: Component starting to render');
  
  const { user } = useAuth();
  const { profile, updateProfile, completeOnboarding, refetch } = useMerchantProfile();
  const { brandSettings } = useBrandSettings();
  const [currentStep, setCurrentStep] = useState(profile?.onboarding_step || 1);
  const [loading, setLoading] = useState(false);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});

  console.log('MerchantOnboardingForm: State initialized', {
    user: user ? { id: user.id, email: user.email } : null,
    profile: profile ? {
      id: profile.id,
      onboarding_step: profile.onboarding_step,
      is_onboarding_complete: profile.is_onboarding_complete
    } : null,
    currentStep,
    loading
  });

  const steps = [
    {
      id: 1,
      title: "Business Information",
      description: "Basic business details and contact information",
      icon: Building,
      component: BusinessInfoStep,
    },
    {
      id: 2,
      title: "Bank Account Details",
      description: "Banking information for payments",
      icon: CreditCard,
      component: BankDetailsStep,
    },
    {
      id: 3,
      title: "KYC & Documents",
      description: "Identity verification and additional documents",
      icon: FileText,
      component: KYCDocumentsStep,
    },
  ];

  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = ((currentStep - 1) / steps.length) * 100;

  console.log('MerchantOnboardingForm: Current step data', {
    currentStep,
    currentStepData: currentStepData ? {
      id: currentStepData.id,
      title: currentStepData.title
    } : null,
    progress
  });

  const handleNext = async () => {
    console.log('MerchantOnboardingForm: handleNext called', { currentStep, stepsLength: steps.length });
    setLoading(true);
    try {
      if (currentStep < steps.length) {
        const nextStep = currentStep + 1;
        await updateProfile({ onboarding_step: nextStep });
        await refetch(); // Ensure profile is up to date
        setCurrentStep(nextStep);
        console.log('MerchantOnboardingForm: Moved to step', nextStep);
      } else {
        console.log('MerchantOnboardingForm: Completing onboarding');
        await completeOnboarding();
        toast({
          title: "Onboarding Complete!",
          description: "Your profile has been submitted for review. You'll be notified once approved.",
        });
      }
    } catch (error) {
      console.error('MerchantOnboardingForm: Error progressing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = async () => {
    console.log('MerchantOnboardingForm: handlePrevious called', { currentStep });
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      try {
        await updateProfile({ onboarding_step: prevStep });
        await refetch(); // Ensure profile is up to date
        setCurrentStep(prevStep);
        console.log('MerchantOnboardingForm: Moved to step', prevStep);
      } catch (error) {
        console.error('MerchantOnboardingForm: Error going to previous step:', error);
      }
    }
  };

  const canProceed = () => {
    // Use step validation state if available, otherwise fall back to profile check
    if (stepValidation[currentStep] !== undefined) {
      return stepValidation[currentStep];
    }
    
    if (!profile) return false;
    
    switch (currentStep) {
      case 1:
        return !!(profile.phone?.trim() && profile.business_address?.trim());
      case 2:
        return !!(profile.account_holder_name?.trim() && profile.bank_name?.trim() && profile.account_number?.trim() && profile.ifsc_code?.trim());
      case 3:
        return true; // KYC step is optional
      default:
        return false;
    }
  };

  const handleStepValidation = (step: number) => (isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [step]: isValid }));
  };

  // Update current step when profile changes
  useEffect(() => {
    if (profile?.onboarding_step && profile.onboarding_step !== currentStep) {
      console.log('MerchantOnboardingForm: Updating currentStep from profile', {
        from: currentStep,
        to: profile.onboarding_step
      });
      setCurrentStep(profile.onboarding_step);
    }
  }, [profile?.onboarding_step]);

  if (!user) {
    console.log('MerchantOnboardingForm: No user found, returning null');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  console.log('MerchantOnboardingForm: Rendering main form');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Merchant Profile
          </h1>
          <p className="text-muted-foreground">
            Please provide the required information to start using {brandSettings.brand_name || 'CabinSpace'} as a merchant
          </p>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {currentStepData?.icon && <currentStepData.icon className="h-5 w-5 text-primary" />}
                  {currentStepData?.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {currentStepData?.description}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}
              </div>
            </div>

            <Progress value={progress} className="h-2" />

            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 ${
                    step.id <= currentStep ? 'text-primary font-medium' : ''
                  }`}
                >
                  {step.id < currentStep && <CheckCircle className="h-3 w-3" />}
                  {step.title}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {currentStepData?.component ? (
              <currentStepData.component 
                profile={profile} 
                updateProfile={updateProfile} 
                onDataChange={handleStepValidation(currentStep)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading step component...</p>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || loading}
              >
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="px-8"
              >
                {loading ? "Saving..." : currentStep === steps.length ? "Complete Onboarding" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Need help? Contact our support team at {brandSettings.support_email || 'support@cabinspace.com'}</p>
        </div>
      </div>
    </div>
  );
};
