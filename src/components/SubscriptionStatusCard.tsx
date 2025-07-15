import { Calendar, Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

export const SubscriptionStatusCard = () => {
  const { limits, loading } = useSubscriptionLimits();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-muted-foreground">No subscription found</p>
            <Button className="mt-3" size="sm">
              Subscribe Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (limits.isTrial) return 'secondary';
    if (limits.status === 'active') return 'default';
    return 'destructive';
  };

  const getStatusIcon = () => {
    if (limits.isTrial) return <Calendar className="h-4 w-4" />;
    if (limits.status === 'active') return <CheckCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const trialDaysRemaining = limits.isTrial && limits.trialExpiresAt 
    ? Math.max(0, Math.ceil((new Date(limits.trialExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const studyHallProgress = limits.maxStudyHalls === 999999 
    ? 100 
    : (limits.currentStudyHalls / limits.maxStudyHalls) * 100;

  const isTrialExpired = limits.isTrial && trialDaysRemaining !== null && trialDaysRemaining <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{limits.planName}</span>
          </div>
          <Badge variant={getStatusColor()}>
            {limits.isTrial ? 'Trial' : limits.status}
          </Badge>
        </div>

        {/* Trial Info */}
        {limits.isTrial && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trial Days Remaining</span>
              <span className={`font-medium ${isTrialExpired ? 'text-destructive' : trialDaysRemaining && trialDaysRemaining <= 3 ? 'text-warning' : 'text-foreground'}`}>
                {isTrialExpired ? 'Expired' : `${trialDaysRemaining} days`}
              </span>
            </div>
            {!isTrialExpired && trialDaysRemaining !== null && (
              <Progress value={(trialDaysRemaining / 30) * 100} className="h-2" />
            )}
            {isTrialExpired && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                Your trial has expired. Please upgrade to continue using all features.
              </div>
            )}
          </div>
        )}

        {/* Study Hall Limits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Study Halls</span>
            <span className="font-medium">
              {limits.currentStudyHalls} / {limits.maxStudyHalls === 999999 ? '∞' : limits.maxStudyHalls}
            </span>
          </div>
          {limits.maxStudyHalls !== 999999 && (
            <Progress value={studyHallProgress} className="h-2" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {limits.isTrial && (
            <Button className="w-full" size="sm">
              Upgrade Now
            </Button>
          )}
          {!limits.isTrial && limits.planName?.toLowerCase().includes('basic') && (
            <Button variant="outline" className="w-full" size="sm">
              Upgrade to Premium
            </Button>
          )}
          {limits.status !== 'active' && !limits.isTrial && (
            <Button className="w-full" size="sm">
              Reactivate Subscription
            </Button>
          )}
        </div>

        {/* Feature Limitations */}
        {!limits.canCreateStudyHall && (
          <div className="text-sm text-warning bg-warning/10 p-2 rounded">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            {isTrialExpired 
              ? 'Trial expired - upgrade to create study halls'
              : 'Study hall limit reached - upgrade for more'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};