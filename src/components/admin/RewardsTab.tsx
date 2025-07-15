import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, ArrowUpDown, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { useCoupons } from "@/hooks/useCoupons";
import { useReferrals } from "@/hooks/useReferrals";
import { LoadingSpinner } from "@/components/ui/loading";

export const RewardsTab = () => {
  const { allRewards, adminStats: rewardStats, loading: rewardsLoading } = useRewards();
  const { coupons, couponUsage, loading: couponsLoading } = useCoupons("admin");
  const { allReferralCodes, referralRewards, loading: referralsLoading } = useReferrals("admin");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (rewardsLoading || couponsLoading || referralsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Rewards & Referrals Management</h3>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Rewards Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewardStats?.total_distributed || 0}</div>
            <p className="text-xs text-muted-foreground">Points given out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Referral Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(allReferralCodes || []).filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Users sharing codes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(referralRewards || []).filter(r => r.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Coupon Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(couponUsage || []).reduce((sum, usage) => sum + usage.discount_amount, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total discounts given</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">Rewards Overview</TabsTrigger>
          <TabsTrigger value="referrals">Referral Program</TabsTrigger>
          <TabsTrigger value="coupons">Coupon Analytics</TabsTrigger>
        </TabsList>

        {/* Rewards Overview */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Recent Reward Activity
              </CardTitle>
              <CardDescription>
                Latest reward transactions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allRewards.length > 0 ? (
                <div className="space-y-3">
                  {allRewards.slice(0, 10).map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">User ID: {reward.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Available: {reward.available_points} • Total: {reward.total_points}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {formatDate(reward.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {reward.available_points} pts
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Earned: {reward.lifetime_earned}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reward activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Program */}
        <TabsContent value="referrals" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowUpDown className="h-5 w-5 mr-2" />
                  Top Referrers
                </CardTitle>
                <CardDescription>
                  Users with most successful referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(allReferralCodes || []).length > 0 ? (
                  <div className="space-y-3">
                    {(allReferralCodes || [])
                      .sort((a, b) => b.successful_referrals - a.successful_referrals)
                      .slice(0, 5)
                      .map((code, index) => (
                      <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{code.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {code.successful_referrals} successful • ₹{code.total_earnings.toLocaleString()} earned
                            </p>
                          </div>
                        </div>
                        <Badge variant={code.status === 'active' ? 'default' : 'secondary'}>
                          {code.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No referral activity yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Referrals */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
                <CardDescription>
                  Latest referral rewards processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(referralRewards || []).length > 0 ? (
                  <div className="space-y-3">
                    {(referralRewards || []).slice(0, 5).map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Referral Reward</p>
                          <p className="text-sm text-muted-foreground">
                            Referrer: {reward.referrer_reward_points} pts • Referee: {reward.referee_reward_points} pts
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(reward.created_at)}
                          </p>
                        </div>
                        <Badge variant={
                          reward.status === 'completed' ? 'default' : 
                          reward.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {reward.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No referral rewards yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Coupon Analytics */}
        <TabsContent value="coupons" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Most Used Coupons */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Coupons</CardTitle>
                <CardDescription>
                  Coupons with highest usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(coupons || []).length > 0 ? (
                  <div className="space-y-3">
                    {(coupons || [])
                      .sort((a, b) => b.usage_count - a.usage_count)
                      .slice(0, 5)
                      .map((coupon) => (
                      <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{coupon.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Code: {coupon.code} • Used {coupon.usage_count} times
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`} OFF
                          </p>
                        </div>
                        <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                          {coupon.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No coupons created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Coupon Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Coupon Usage</CardTitle>
                <CardDescription>
                  Latest coupon redemptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(couponUsage || []).length > 0 ? (
                  <div className="space-y-3">
                    {(couponUsage || []).slice(0, 5).map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{usage.coupon?.title || 'Coupon'}</p>
                          <p className="text-sm text-muted-foreground">
                            Code: {usage.coupon?.code} • Saved ₹{usage.discount_amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(usage.used_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ₹{usage.discount_amount}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Saved
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No coupon usage yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};