import React, { useState, useEffect } from "react";
import { useMerchantSubscriptions } from "@/hooks/useMerchantSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useTrialPlan } from "@/hooks/useTrialPlan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Star, Zap, Check, X, Calendar, CreditCard, Settings, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { safeFormatDate } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export const MerchantSubscriptionTab = () => {
  const { subscription, loading, createSubscription, cancelSubscription } = useMerchantSubscriptions();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { trialSettings, isTrialEligible, activating, activateTrialPlan } = useTrialPlan();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribeToPlan = async (planId: string) => {
    try {
      setActionLoading(true);
      await createSubscription(planId, "razorpay");
      setUpgradeDialogOpen(false);
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      // Error is already handled by useMerchantSubscriptions hook
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true);
      await cancelSubscription();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "basic":
        return <Star className="h-5 w-5 text-blue-500" />;
      case "premium":
        return <Crown className="h-5 w-5 text-purple-500" />;
      case "enterprise":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrialIcon = () => {
    return <Gift className="h-5 w-5 text-green-500" />;
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Subscription Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and billing
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && subscription.status === "active" ? (
        <Card className={`border-2 ${subscription.is_trial ? 'border-green-200 bg-green-50' : 'border-primary/20'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {subscription.is_trial ? getTrialIcon() : getPlanIcon(subscription.plan.name)}
                <div>
                  <CardTitle className={`text-xl ${subscription.is_trial ? 'text-green-800' : ''}`}>
                    {subscription.is_trial ? trialSettings?.plan_name || 'Free Trial' : subscription.plan.name + ' Plan'}
                  </CardTitle>
                  <CardDescription className={subscription.is_trial ? 'text-green-600' : ''}>
                    {subscription.is_trial ? 
                      `Free Trial - ${calculateDaysRemaining(subscription.trial_end_date || subscription.end_date || '')} days remaining` :
                      `₹${subscription.plan.price.toLocaleString()}/${subscription.plan.duration}`
                    }
                  </CardDescription>
                </div>
              </div>
              <Badge variant={subscription.is_trial ? "secondary" : "default"} className={subscription.is_trial ? "bg-green-100 text-green-800 border-green-200" : ""}>
                {subscription.is_trial ? "Trial Active" : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Plan Features
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Max Study Halls: {subscription.plan.max_study_halls || "Unlimited"}</li>
                  <li>• Max Bookings/Month: {subscription.plan.max_bookings_per_month || "Unlimited"}</li>
                  {subscription.plan.analytics_access && <li>• Advanced Analytics</li>}
                  {subscription.plan.priority_support && <li>• Priority Support</li>}
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                  Billing Information
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Start Date: {safeFormatDate(subscription.start_date, "PPP")}</p>
                  {subscription.end_date && (
                    <p>End Date: {safeFormatDate(subscription.end_date, "PPP")}</p>
                  )}
                  <p>Payment Method: {subscription.payment_method.toUpperCase()}</p>
                  <p>Auto Renew: {subscription.auto_renew ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
            </div>

            {/* Subscription Progress */}
            {subscription.end_date && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subscription Period</span>
                  <span>{calculateDaysRemaining(subscription.end_date)} days remaining</span>
                </div>
                <Progress 
                  value={100 - (calculateDaysRemaining(subscription.end_date) / 30) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                    <DialogDescription>
                      Choose a plan that better fits your needs
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    {plans.map((plan) => (
                      <Card key={plan.id} className={`cursor-pointer transition-colors ${
                        subscription.plan_id === plan.id ? "border-primary" : "hover:border-primary/50"
                      }`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getPlanIcon(plan.name)}
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                            </div>
                            {subscription.plan_id === plan.id && (
                              <Badge variant="default">Current</Badge>
                            )}
                          </div>
                          <CardDescription>
                            ₹{plan.price.toLocaleString()}/{plan.duration}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1 mb-4">
                            <li>• Max Study Halls: {plan.max_study_halls || "Unlimited"}</li>
                            <li>• Max Bookings/Month: {plan.max_bookings_per_month || "Unlimited"}</li>
                            {plan.analytics_access && <li>• Advanced Analytics</li>}
                            {plan.priority_support && <li>• Priority Support</li>}
                          </ul>
                          <Button 
                            className="w-full" 
                            disabled={subscription.plan_id === plan.id || actionLoading}
                            onClick={() => handleSubscribeToPlan(plan.id)}
                          >
                            {actionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : subscription.plan_id === plan.id ? (
                              "Current Plan"
                            ) : (
                              "Pay with Razorpay"
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Billing Settings
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Plan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : subscription && subscription.status === "cancelled" ? (
        /* Cancelled Subscription - Show Reactivation Options */
        <div className="space-y-6">
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="pt-6 text-center">
              <X className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Subscription Cancelled</h3>
              <p className="text-muted-foreground mb-4">
                Your {subscription.plan.name} plan was cancelled. You can reactivate or choose a different plan.
              </p>
              <Button onClick={() => setUpgradeDialogOpen(true)}>
                Reactivate or Choose New Plan
              </Button>
            </CardContent>
          </Card>

          {/* Available Plans for Reactivation */}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {getPlanIcon(plan.name)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>
                    ₹{plan.price.toLocaleString()}/{plan.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>• Max Study Halls: {plan.max_study_halls || "Unlimited"}</li>
                    <li>• Max Bookings/Month: {plan.max_bookings_per_month || "Unlimited"}</li>
                    {plan.analytics_access && <li>• Advanced Analytics</li>}
                    {plan.priority_support && <li>• Priority Support</li>}
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribeToPlan(plan.id)}
                    disabled={actionLoading}
                    variant={subscription.plan_id === plan.id ? "default" : "outline"}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : subscription.plan_id === plan.id ? (
                      "Reactivate with Razorpay"
                    ) : (
                      "Subscribe with Razorpay"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* No Subscription - Show Plans */
        <div className="space-y-6">
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 text-center">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-4">
                Subscribe to a plan to unlock premium features and grow your study hall business
              </p>
              <Button onClick={() => setUpgradeDialogOpen(true)}>
                Choose a Plan
              </Button>
            </CardContent>
          </Card>

          {/* Free Trial Plan */}
          {isTrialEligible && trialSettings && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-6 w-6 text-green-600" />
                    <div>
                      <CardTitle className="text-lg text-green-800">{trialSettings.plan_name}</CardTitle>
                      <CardDescription className="text-green-600">
                        Free for {trialSettings.duration_days} days
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Limited Time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Maximum {trialSettings.max_study_halls} study hall{trialSettings.max_study_halls > 1 ? 's' : ''}</li>
                    <li>• Basic booking management</li>
                    <li>• Email support</li>
                    <li>• {trialSettings.duration_days} days trial period</li>
                    <li>• One-time offer per merchant</li>
                    <li>• No payment required</li>
                  </ul>
                  
                  <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium">
                      🎯 Perfect way to get started! Try our platform risk-free.
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={activateTrialPlan}
                    disabled={activating}
                  >
                    {activating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Activating Trial...
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Start Free Trial
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {getPlanIcon(plan.name)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>
                    ₹{plan.price.toLocaleString()}/{plan.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>• Max Study Halls: {plan.max_study_halls || "Unlimited"}</li>
                    <li>• Max Bookings/Month: {plan.max_bookings_per_month || "Unlimited"}</li>
                    {plan.analytics_access && <li>• Advanced Analytics</li>}
                    {plan.priority_support && <li>• Priority Support</li>}
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribeToPlan(plan.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Pay with Razorpay"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};