import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, CheckCircleIcon, AlertTriangleIcon } from "lucide-react";
import { MerchantProfile } from "@/hooks/useMerchantProfile";

interface MerchantUnderReviewProps {
  profile: MerchantProfile;
}

export const MerchantUnderReview = ({ profile }: MerchantUnderReviewProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon(profile.verification_status)}
            </div>
            <CardTitle className="text-2xl">
              {profile.verification_status === 'approved' 
                ? 'Account Approved!' 
                : profile.verification_status === 'rejected'
                ? 'Account Requires Attention'
                : 'Account Under Review'
              }
            </CardTitle>
            <CardDescription>
              {profile.verification_status === 'approved'
                ? 'Your merchant account has been approved and is ready to use.'
                : profile.verification_status === 'rejected'
                ? 'Your account needs some updates before approval.'
                : 'Thank you for completing your onboarding. Our team is reviewing your information.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">Verification Status</h3>
                <p className="text-sm text-muted-foreground">Current status of your merchant account</p>
              </div>
              {getStatusBadge(profile.verification_status)}
            </div>

            {profile.verification_status === 'pending' && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Our team will review your business information</li>
                  <li>• We'll verify your bank account details</li>
                  <li>• Any uploaded documents will be validated</li>
                  <li>• You'll receive an email notification once approved</li>
                </ul>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-3 font-medium">
                  This process typically takes 1-2 business days.
                </p>
              </div>
            )}

            {profile.verification_status === 'rejected' && (
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Action Required</h4>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Please contact our support team to understand what needs to be updated for your account approval.
                </p>
              </div>
            )}

            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">
                Questions about your application?
              </p>
              <p className="text-sm font-medium">
                Contact us at{" "}
                <a 
                  href="mailto:support@cabinspace.com" 
                  className="text-primary hover:underline"
                >
                  support@cabinspace.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};