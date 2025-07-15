import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  TrendingUp, 
  Building, 
  Users, 
  AlertTriangle,
  Calendar,
  IndianRupee,
  Crown,
  Clock
} from "lucide-react";
import { useWithdrawals } from "@/hooks/useWithdrawals";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useBookings } from "@/hooks/useBookings";
import { useSidebar } from "@/components/ui/sidebar";

interface QuickActionButtonProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: "default" | "outline";
}

const QuickActionButton = ({ onClick, icon: Icon, label, variant = "outline" }: QuickActionButtonProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className="w-full justify-start text-xs h-8"
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      {!isCollapsed && <span className="ml-2 truncate">{label}</span>}
    </Button>
  );
};

interface MerchantSidebarWidgetProps {
  onTabChange?: (tab: string) => void;
}

export const MerchantSidebarWidget = ({ onTabChange }: MerchantSidebarWidgetProps) => {
  const { balance, loading: balanceLoading } = useWithdrawals();
  const { limits, loading: limitsLoading } = useSubscriptionLimits();
  const { bookings } = useBookings("merchant");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Calculate quick stats
  const activeBookings = bookings.filter(booking => 
    booking.status === "confirmed" || booking.status === "pending"
  ).length;

  const todayBookings = bookings.filter(booking => {
    const today = new Date().toISOString().split('T')[0];
    return booking.created_at.split('T')[0] === today;
  }).length;

  const usagePercentage = limits ? (limits.currentStudyHalls / limits.maxStudyHalls) * 100 : 0;

  const handleQuickAction = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  if (isCollapsed) {
    return (
      <div className="px-2 py-3 space-y-3">
        {/* Collapsed Balance Indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
            <IndianRupee className="h-4 w-4 text-white" />
          </div>
        </div>
        
        {/* Collapsed Usage Indicator */}
        {limits && (
          <div className="flex justify-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              usagePercentage >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Building className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Collapsed Active Indicator */}
        {activeBookings > 0 && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-green-700" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-4 space-y-4">
      {/* Balance Card */}
      <Card className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <IndianRupee className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-700 font-medium">Available Balance</p>
            <p className="text-lg font-bold text-emerald-900 truncate">
              {balanceLoading ? "..." : `₹${balance?.available_balance?.toLocaleString() || 0}`}
            </p>
          </div>
        </div>
        {balance && balance.available_balance > 500 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => handleQuickAction("settlements")}
          >
            Request Withdrawal
          </Button>
        )}
      </Card>

      {/* Subscription Status Card */}
      {limits && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">{limits.planName}</span>
              </div>
              <Badge 
                variant={limits.isTrial ? "secondary" : limits.status === "active" ? "default" : "destructive"}
                className="text-[10px] px-2 py-0.5"
              >
                {limits.isTrial ? "Trial" : limits.status}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Study Halls</span>
                <span className="font-medium">{limits.currentStudyHalls}/{limits.maxStudyHalls}</span>
              </div>
              <Progress value={usagePercentage} className="h-1.5" />
            </div>

            {limits.isTrial && (
              <div className="flex items-center space-x-1 text-xs text-amber-600">
                <Clock className="h-3 w-3" />
                <span>Trial expires soon</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <Card className="p-3">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium">Quick Stats</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{activeBookings}</p>
              <p className="text-[10px] text-muted-foreground">Active Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{todayBookings}</p>
              <p className="text-[10px] text-muted-foreground">Today's Bookings</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-3">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium">Quick Actions</span>
          </div>
          
          <div className="space-y-2">
            {limits?.canCreateStudyHall && (
              <QuickActionButton
                onClick={() => handleQuickAction("studyhalls")}
                icon={Building}
                label="Create Study Hall"
                variant="default"
              />
            )}
            <QuickActionButton
              onClick={() => handleQuickAction("bookings")}
              icon={Calendar}
              label="View Bookings"
            />
            <QuickActionButton
              onClick={() => handleQuickAction("analytics")}
              icon={TrendingUp}
              label="Analytics"
            />
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {balance && balance.available_balance < 100 && (
        <Card className="p-3 bg-amber-50 border-amber-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-xs font-medium text-amber-800">Low Balance</p>
              <p className="text-[10px] text-amber-600">Your balance is running low</p>
            </div>
          </div>
        </Card>
      )}

      {limits && !limits.canCreateStudyHall && (
        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs font-medium text-red-800">Limit Reached</p>
              <p className="text-[10px] text-red-600">Upgrade to add more study halls</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};