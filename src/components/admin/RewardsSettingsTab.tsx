import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift, Settings, DollarSign, Trophy, UserCheck } from "lucide-react";

export const RewardsSettingsTab = () => {
  const { settings, loading, updateSettings } = useBusinessSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    rewards_enabled: true,
    rewards_conversion_rate: 0.10,
    points_per_booking: 50,
    points_per_referral: 500,
    points_profile_complete: 100,
    min_redemption_points: 10,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        rewards_enabled: settings.rewards_enabled ?? true,
        rewards_conversion_rate: settings.rewards_conversion_rate ?? 0.10,
        points_per_booking: settings.points_per_booking ?? 50,
        points_per_referral: settings.points_per_referral ?? 500,
        points_profile_complete: settings.points_profile_complete ?? 100,
        min_redemption_points: settings.min_redemption_points ?? 10,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSettings({
        rewards_enabled: formData.rewards_enabled,
        rewards_conversion_rate: formData.rewards_conversion_rate,
        points_per_booking: formData.points_per_booking,
        points_per_referral: formData.points_per_referral,
        points_profile_complete: formData.points_profile_complete,
        min_redemption_points: formData.min_redemption_points,
      });

      if (success) {
        toast({
          title: "Success",
          description: "Rewards settings updated successfully",
        });
      }
    } catch (error) {
      console.error('Error saving rewards settings:', error);
      toast({
        title: "Error",
        description: "Failed to update rewards settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateConversionExample = () => {
    const rate = formData.rewards_conversion_rate;
    const points = 100;
    const rupees = points * rate;
    return `${points} points = ₹${rupees.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Rewards System Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure the rewards system, conversion rates, and earning rules
          </p>
        </div>
        <Badge variant={formData.rewards_enabled ? "default" : "secondary"}>
          {formData.rewards_enabled ? "Active" : "Disabled"}
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* System Toggle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Rewards System
              </CardTitle>
              <CardDescription>
                Enable or disable the rewards system platform-wide
              </CardDescription>
            </div>
            <Switch
              checked={formData.rewards_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, rewards_enabled: checked }))
              }
            />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {formData.rewards_enabled ? (
                <p>✅ Users can earn and redeem reward points</p>
              ) : (
                <p>⛔ Rewards system is disabled - users cannot earn or redeem points</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
            <CardDescription>
              Set how much each reward point is worth in rupees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conversion-rate">Points to Rupees Rate</Label>
                <Input
                  id="conversion-rate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10"
                  value={formData.rewards_conversion_rate}
                  onChange={(e) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      rewards_conversion_rate: parseFloat(e.target.value) || 0.01 
                    }))
                  }
                  disabled={!formData.rewards_enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1 point = ₹{formData.rewards_conversion_rate.toFixed(2)}
                </p>
              </div>
              <div>
                <Label htmlFor="min-redemption">Minimum Redemption Points</Label>
                <Input
                  id="min-redemption"
                  type="number"
                  min="1"
                  value={formData.min_redemption_points}
                  onChange={(e) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      min_redemption_points: parseInt(e.target.value) || 1 
                    }))
                  }
                  disabled={!formData.rewards_enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum ₹{(formData.min_redemption_points * formData.rewards_conversion_rate).toFixed(2)} discount
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                Example: {calculateConversionExample()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Earning Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Point Earning Rules
            </CardTitle>
            <CardDescription>
              Configure how users earn reward points
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="booking-points" className="flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Points per Booking
                </Label>
                <Input
                  id="booking-points"
                  type="number"
                  min="0"
                  value={formData.points_per_booking}
                  onChange={(e) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      points_per_booking: parseInt(e.target.value) || 0 
                    }))
                  }
                  disabled={!formData.rewards_enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Worth ₹{(formData.points_per_booking * formData.rewards_conversion_rate).toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="referral-points" className="flex items-center gap-2">
                  <UserCheck className="h-3 w-3" />
                  Points per Referral
                </Label>
                <Input
                  id="referral-points"
                  type="number"
                  min="0"
                  value={formData.points_per_referral}
                  onChange={(e) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      points_per_referral: parseInt(e.target.value) || 0 
                    }))
                  }
                  disabled={!formData.rewards_enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Worth ₹{(formData.points_per_referral * formData.rewards_conversion_rate).toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="profile-points" className="flex items-center gap-2">
                  <Gift className="h-3 w-3" />
                  Profile Complete
                </Label>
                <Input
                  id="profile-points"
                  type="number"
                  min="0"
                  value={formData.points_profile_complete}
                  onChange={(e) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      points_profile_complete: parseInt(e.target.value) || 0 
                    }))
                  }
                  disabled={!formData.rewards_enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Worth ₹{(formData.points_profile_complete * formData.rewards_conversion_rate).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Changes to earning rules will apply to new activities only. 
                Existing earned points remain unchanged.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
};