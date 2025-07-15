import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { MerchantOnboardingForm } from "./MerchantOnboardingForm";
import ProfileSection from "@/components/ProfileSection";
import { 
  Edit, 
  Building, 
  CreditCard, 
  FileText, 
  Phone, 
  MapPin, 
  Hash,
  Shield,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

export const MerchantProfileTab = () => {
  const { profile, documents, loading } = useMerchantProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Show enhanced profile section if user wants detailed view
  if (showDetailedProfile) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Profile Settings</h2>
            <p className="text-muted-foreground">
              Manage your profile information and settings
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowDetailedProfile(false)}
          >
            Back to Business Profile
          </Button>
        </div>
        <ProfileSection />
      </div>
    );
  }

  if (!profile || !profile.is_onboarding_complete || isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Profile Setup</h2>
            <p className="text-muted-foreground">
              {isEditing ? "Update your merchant profile information" : "Complete your merchant profile to get started"}
            </p>
          </div>
          {profile?.is_onboarding_complete && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          )}
        </div>
        <MerchantOnboardingForm />
      </div>
    );
  }

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Profile Information</h2>
          <p className="text-muted-foreground">
            Your merchant profile and verification status
          </p>
        </div>
        <div className="flex gap-2">
          {getVerificationStatusBadge(profile.verification_status)}
          <Button variant="outline" onClick={() => setShowDetailedProfile(true)}>
            Profile Settings
          </Button>
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Business Info
          </Button>
        </div>
      </div>

      {profile.verification_status === 'pending' && (
        <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium">Profile Under Review</p>
                <p className="text-sm">Our team is reviewing your submitted information. This usually takes 1-2 business days.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.verification_status === 'rejected' && (
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Profile Needs Attention</p>
                <p className="text-sm">Some information needs to be updated. Please review and resubmit your profile.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Basic business details and trade license information
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.phone || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Trade License Number</label>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>{profile.trade_license_number || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Business Address</label>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{profile.business_address || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>
              Banking information for payment processing
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Account Holder Name</label>
              <span>{profile.account_holder_name || 'Not provided'}</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
              <span>{profile.bank_name || 'Not provided'}</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Account Number</label>
              <span>
                {profile.account_number || 'Not provided'}
              </span>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
              <span>{profile.ifsc_code || 'Not provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* KYC Information */}
        {(profile.gstin_pan || profile.business_email) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                KYC Information
              </CardTitle>
              <CardDescription>
                Additional verification and business details
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.gstin_pan && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">GSTIN/PAN</label>
                  <span>{profile.gstin_pan}</span>
                </div>
              )}
              
              {profile.business_email && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Business Email</label>
                  <span>{profile.business_email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Uploaded Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              Documents uploaded for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">
                        {doc.document_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationStatusBadge(doc.verification_status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No documents uploaded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};