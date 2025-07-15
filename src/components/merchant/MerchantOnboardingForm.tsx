import { useState } from "react";
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

export const MerchantOnboardingForm = () => {
  const { user } = useAuth();
  const { profile, updateProfile, completeOnboarding } = useMerchantProfile();
  const [currentStep, setCurrentStep] = useState(profile?.onboarding_step || 1);
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Business Information",
      description: "Basic business details and trade license",
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

  const handleNext = async () => {
    setLoading(true);
    try {
      if (currentStep < steps.length) {
        const nextStep = currentStep + 1;
        await updateProfile({ onboarding_step: nextStep });
        setCurrentStep(nextStep);
      } else {
        await completeOnboarding();
        toast({
          title: "Onboarding Complete!",
          description: "Welcome to CabinSpace. Your profile is now being reviewed.",
        });
      }
    } catch (error) {
      console.error('Error progressing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      await updateProfile({ onboarding_step: prevStep });
      setCurrentStep(prevStep);
    }
  };

  const canProceed = () => {
    if (!profile) return false;
    
    switch (currentStep) {
      case 1:
        return !!(profile.phone && profile.business_address && profile.trade_license_number);
      case 2:
        return !!(profile.account_holder_name && profile.bank_name && profile.account_number && profile.ifsc_code);
      case 3:
        return true; // KYC step is optional
      default:
        return false;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Merchant Profile
          </h1>
          <p className="text-muted-foreground">
            Please provide the required information to start using CabinSpace as a merchant
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
            {currentStepData?.component && (
              <currentStepData.component profile={profile} updateProfile={updateProfile} />
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
          <p>Need help? Contact our support team at support@cabinspace.com</p>
        </div>
      </div>
    </div>
  );
};