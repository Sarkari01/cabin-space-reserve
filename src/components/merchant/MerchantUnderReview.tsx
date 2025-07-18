
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { MerchantProfile } from "@/hooks/useMerchantProfile";
import { useBrandSettings } from "@/hooks/useBrandSettings";

interface MerchantUnderReviewProps {
  profile: MerchantProfile;
}

export const MerchantUnderReview = ({ profile }: MerchantUnderReviewProps) => {
  const { brandSettings } = useBrandSettings();

  console.log('MerchantUnderReview: Rendering with profile:', profile);

  const getStatusIcon = () => {
    switch (profile.verification_status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'under_review':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (profile.verification_status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusMessage = () => {
    switch (profile.verification_status) {
      case 'pending':
        return 'Your merchant account is pending review. Our team will verify your information shortly.';
      case 'under_review':
        return 'Your merchant account is currently under review. We are verifying your submitted information.';
      default:
        return 'Your merchant account is being processed. Please wait for approval.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold">
              Account Under Review
            </CardTitle>
            <CardDescription className="text-base">
              Thank you for completing your merchant onboarding
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge className={`${getStatusColor()} px-3 py-1 text-sm font-medium`}>
                {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1).replace('_', ' ')}
              </Badge>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-muted-foreground">
                {getStatusMessage()}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Our team will review your business information and documents
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    We may contact you if additional information is required
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Once approved, you'll receive an email notification and can access your dashboard
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team at{' '}
                <a 
                  href={`mailto:${brandSettings.support_email || 'support@cabinspace.com'}`}
                  className="text-primary hover:underline"
                >
                  {brandSettings.support_email || 'support@cabinspace.com'}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
