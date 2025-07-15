import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Save, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Edit,
  Shield,
  Award,
  Copy,
  Building,
  CreditCard,
  FileText,
  Hash,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { useReferrals } from "@/hooks/useReferrals";
import { useRewards } from "@/hooks/useRewards";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useValidatedForm, profileSchema, validateRequired, validatePhone, validateEmail } from "@/components/FormValidation";
import { z } from "zod";

// Enhanced profile schema with role-specific validation
const enhancedProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100, "Name too long"),
  phone: z.string().min(1, "Phone number is required").refine((phone) => {
    return /^\+?[\d\s\-\(\)]{10,15}$/.test(phone);
  }, "Invalid phone number format"),
  bio: z.string().max(500, "Bio too long").optional(),
  location: z.string().max(200, "Location too long").optional(),
});

const ProfileSection = () => {
  const { user, userProfile, userRole } = useAuth();
  const { settings, loading: settingsLoading, updateSettings, updateAvatar, updateNotificationPreferences, updateTheme } = useUserSettings();
  const { profile: merchantProfile, loading: merchantLoading, updateProfile: updateMerchantProfile } = useMerchantProfile();
  const { referralCode, referralStats } = useReferrals();
  const { rewards } = useRewards();
  
  const [editMode, setEditMode] = useState(false);
  const [businessEditMode, setBusinessEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || '',
    bio: settings?.bio || '',
    location: settings?.location || '',
  });
  
  const [businessFormData, setBusinessFormData] = useState({
    phone: merchantProfile?.phone || '',
    business_email: merchantProfile?.business_email || '',
    business_address: merchantProfile?.business_address || '',
    trade_license_number: merchantProfile?.trade_license_number || '',
    gstin_pan: merchantProfile?.gstin_pan || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>({});

  // Update form data when user profile or settings change
  useEffect(() => {
    setFormData({
      full_name: userProfile?.full_name || '',
      phone: userProfile?.phone || '',
      bio: settings?.bio || '',
      location: settings?.location || '',
    });
  }, [userProfile, settings]);

  // Update business form data when merchant profile changes
  useEffect(() => {
    if (merchantProfile) {
      setBusinessFormData({
        phone: merchantProfile.phone || '',
        business_email: merchantProfile.business_email || '',
        business_address: merchantProfile.business_address || '',
        trade_license_number: merchantProfile.trade_license_number || '',
        gstin_pan: merchantProfile.gstin_pan || '',
      });
    }
  }, [merchantProfile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    // Optional field validation
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio cannot exceed 500 characters";
    }

    if (formData.location && formData.location.length > 200) {
      newErrors.location = "Location cannot exceed 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBusinessForm = () => {
    const newErrors: Record<string, string> = {};

    // Business phone validation
    if (businessFormData.phone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(businessFormData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    // Business email validation
    if (businessFormData.business_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessFormData.business_email)) {
      newErrors.business_email = "Invalid email format";
    }

    // Field length validations
    if (businessFormData.business_address && businessFormData.business_address.length > 500) {
      newErrors.business_address = "Address cannot exceed 500 characters";
    }

    if (businessFormData.trade_license_number && businessFormData.trade_license_number.length > 100) {
      newErrors.trade_license_number = "Trade license number too long";
    }

    if (businessFormData.gstin_pan && businessFormData.gstin_pan.length > 50) {
      newErrors.gstin_pan = "GSTIN/PAN too long";
    }

    setBusinessErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBusinessInputChange = (field: string, value: string) => {
    setBusinessFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (businessErrors[field]) {
      setBusinessErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file || !user) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(filePath);

      await updateAvatar(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update profile in auth profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update settings
      await updateSettings({
        bio: formData.bio?.trim() || '',
        location: formData.location?.trim() || ''
      });

      setEditMode(false);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!validateBusinessForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateMerchantProfile({
        phone: businessFormData.phone?.trim() || null,
        business_email: businessFormData.business_email?.trim() || null,
        business_address: businessFormData.business_address?.trim() || null,
        trade_license_number: businessFormData.trade_license_number?.trim() || null,
        gstin_pan: businessFormData.gstin_pan?.trim() || null,
      });

      setBusinessEditMode(false);
      toast({
        title: "Success",
        description: "Business information updated successfully"
      });
    } catch (error) {
      console.error('Error updating business information:', error);
      toast({
        title: "Error",
        description: "Failed to update business information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const copyReferralCode = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralCode.code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy referral code",
        variant: "destructive"
      });
    }
  };

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

  if (settingsLoading || (userRole === 'merchant' && merchantLoading)) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={settings?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {userProfile?.full_name ? getInitials(userProfile.full_name) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{userProfile?.full_name || 'User'}</h3>
              <Badge variant="outline" className="capitalize">
                {userRole}
              </Badge>
              {userRole === 'merchant' && userProfile?.merchant_number && (
                <p className="text-sm text-muted-foreground">
                  ID: M{userProfile.merchant_number}
                </p>
              )}
              {userRole === 'student' && userProfile?.student_number && (
                <p className="text-sm text-muted-foreground">
                  ID: S{userProfile.student_number}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {user?.email}
              </p>
            </div>
          </div>

          <Separator />

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                disabled={!editMode}
                placeholder="Enter your full name"
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!editMode}
                placeholder="Enter your phone number"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!editMode}
                placeholder="Enter your location"
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={!editMode}
              placeholder="Tell us about yourself..."
              rows={3}
              className={errors.bio ? "border-red-500" : ""}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Sections */}
      {userRole === 'student' && (
        <>
          {/* Referral Section */}
          {referralCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Referral Program
                </CardTitle>
                <CardDescription>
                  Share your referral code and earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={referralCode.code}
                    readOnly
                    className="font-mono"
                  />
                  <Button size="sm" variant="outline" onClick={copyReferralCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{referralStats.total_referrals}</p>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-600">{referralStats.successful_referrals}</p>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-purple-600">₹{referralStats.total_earnings}</p>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rewards Section */}
          {rewards && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Reward Points
                </CardTitle>
                <CardDescription>
                  Your reward points and redemption history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{rewards.available_points}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-600">{rewards.lifetime_earned}</p>
                    <p className="text-sm text-muted-foreground">Lifetime Earned</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-orange-600">{rewards.lifetime_redeemed}</p>
                    <p className="text-sm text-muted-foreground">Redeemed</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-purple-600">{rewards.total_points}</p>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {userRole === 'merchant' && merchantProfile && (
        <>
          {/* Merchant Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Status
              </CardTitle>
              <CardDescription>
                Your merchant account verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-sm text-muted-foreground">
                    {merchantProfile.verification_status === 'approved' 
                      ? 'Your account is fully verified and active'
                      : 'Account verification in progress'
                    }
                  </p>
                </div>
                {getVerificationStatusBadge(merchantProfile.verification_status)}
              </div>
            </CardContent>
          </Card>

          {/* Business Information - Editable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Manage your business details and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    value={businessFormData.phone}
                    onChange={(e) => handleBusinessInputChange('phone', e.target.value)}
                    disabled={!businessEditMode}
                    placeholder="Enter business phone number"
                    className={businessErrors.phone ? "border-red-500" : ""}
                  />
                  {businessErrors.phone && (
                    <p className="text-sm text-red-500">{businessErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={businessFormData.business_email}
                    onChange={(e) => handleBusinessInputChange('business_email', e.target.value)}
                    disabled={!businessEditMode}
                    placeholder="Enter business email"
                    className={businessErrors.business_email ? "border-red-500" : ""}
                  />
                  {businessErrors.business_email && (
                    <p className="text-sm text-red-500">{businessErrors.business_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade_license_number">Trade License Number</Label>
                  <Input
                    id="trade_license_number"
                    value={businessFormData.trade_license_number}
                    onChange={(e) => handleBusinessInputChange('trade_license_number', e.target.value)}
                    disabled={!businessEditMode}
                    placeholder="Enter trade license number"
                    className={businessErrors.trade_license_number ? "border-red-500" : ""}
                  />
                  {businessErrors.trade_license_number && (
                    <p className="text-sm text-red-500">{businessErrors.trade_license_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin_pan">GSTIN/PAN</Label>
                  <Input
                    id="gstin_pan"
                    value={businessFormData.gstin_pan}
                    onChange={(e) => handleBusinessInputChange('gstin_pan', e.target.value)}
                    disabled={!businessEditMode}
                    placeholder="Enter GSTIN or PAN number"
                    className={businessErrors.gstin_pan ? "border-red-500" : ""}
                  />
                  {businessErrors.gstin_pan && (
                    <p className="text-sm text-red-500">{businessErrors.gstin_pan}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  value={businessFormData.business_address}
                  onChange={(e) => handleBusinessInputChange('business_address', e.target.value)}
                  disabled={!businessEditMode}
                  placeholder="Enter complete business address"
                  rows={3}
                  className={businessErrors.business_address ? "border-red-500" : ""}
                />
                {businessErrors.business_address && (
                  <p className="text-sm text-red-500">{businessErrors.business_address}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                {businessEditMode ? (
                  <>
                    <Button variant="outline" onClick={() => setBusinessEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBusinessInfo}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setBusinessEditMode(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Business Info
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {userRole === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Information
            </CardTitle>
            <CardDescription>
              Administrator role and system access information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <p className="font-medium">System Administrator</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Access Level</label>
                <Badge variant="default">Full Access</Badge>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Permissions</label>
                <p className="text-sm">User Management, Content Management, System Settings</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                <p className="text-sm">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Email Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <Switch
              checked={settings?.email_notifications}
              onCheckedChange={(checked) => updateNotificationPreferences(checked, settings?.push_notifications || false)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Push Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive push notifications in your browser
              </div>
            </div>
            <Switch
              checked={settings?.push_notifications}
              onCheckedChange={(checked) => updateNotificationPreferences(settings?.email_notifications || false, checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Account Created:</span>
              <div className="font-medium">
                {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <div className="font-medium">
                {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Phone Verified:</span>
              <div className="font-medium">
                <Badge variant={settings?.phone_verified ? 'default' : 'secondary'}>
                  {settings?.phone_verified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Account Status:</span>
              <div className="font-medium">
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSection;