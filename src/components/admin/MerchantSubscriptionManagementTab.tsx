import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Eye, Edit, Ban, Crown, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeFormatDate } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MerchantSubscription {
  id: string;
  merchant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  payment_method: string;
  last_payment_date: string | null;
  created_at: string;
  merchant: {
    id: string;
    full_name: string;
    email: string;
    merchant_number: number;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    duration: string;
    max_study_halls: number | null;
    max_bookings_per_month: number | null;
  };
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  subscriptionGrowth: number;
}

export const MerchantSubscriptionManagementTab = () => {
  const [subscriptions, setSubscriptions] = useState<MerchantSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    subscriptionGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] = useState<MerchantSubscription | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .select(`
          *,
          merchant:profiles!merchant_id(id, full_name, email, merchant_number),
          plan:subscription_plans(id, name, price, duration, max_study_halls, max_bookings_per_month)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
      
      // Calculate stats
      const totalSubscriptions = data?.length || 0;
      const activeSubscriptions = data?.filter(sub => sub.status === 'active').length || 0;
      const monthlyRevenue = data?.filter(sub => sub.status === 'active')
        .reduce((total, sub) => total + (sub.plan?.price || 0), 0) || 0;

      setStats({
        totalSubscriptions,
        activeSubscriptions,
        monthlyRevenue,
        subscriptionGrowth: 15 // Mock growth percentage
      });

    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscriptionStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("merchant_subscriptions")
        .update({ status: newStatus })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });

      await fetchSubscriptions();
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.merchant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const calculateDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold">Subscription Management</h3>
        <p className="text-muted-foreground">
          Manage merchant subscriptions and monitor revenue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.subscriptionGrowth}%</div>
            <p className="text-xs text-muted-foreground">from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by merchant name, email, or plan..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {filteredSubscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-semibold">
                        {subscription.merchant.full_name || 'Unknown Merchant'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {subscription.merchant.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Merchant #{subscription.merchant.merchant_number}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">{subscription.plan.name}</span>
                      <span className="text-muted-foreground">
                        ₹{subscription.plan.price.toLocaleString()}/{subscription.plan.duration}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Started: {safeFormatDate(subscription.start_date, "PPP")}</span>
                    {subscription.end_date && (
                      <span>
                        {subscription.status === 'active' 
                          ? `${calculateDaysRemaining(subscription.end_date)} days remaining`
                          : `Ended: ${safeFormatDate(subscription.end_date, "PPP")}`
                        }
                      </span>
                    )}
                    <span>Payment: {subscription.payment_method.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(subscription);
                      setDetailModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateSubscriptionStatus(
                      subscription.id, 
                      subscription.status === 'active' ? 'cancelled' : 'active'
                    )}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : subscription.status === 'active' ? (
                      <>
                        <Ban className="h-4 w-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              Detailed information about the merchant subscription
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-6">
              {/* Merchant Info */}
              <div>
                <h4 className="font-medium mb-2">Merchant Information</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedSubscription.merchant.full_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedSubscription.merchant.email}
                  </div>
                  <div>
                    <span className="font-medium">Merchant #:</span> {selectedSubscription.merchant.merchant_number}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge variant={getStatusColor(selectedSubscription.status)}>
                      {selectedSubscription.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div>
                <h4 className="font-medium mb-2">Plan Details</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Plan:</span> {selectedSubscription.plan.name}
                  </div>
                  <div>
                    <span className="font-medium">Price:</span> ₹{selectedSubscription.plan.price.toLocaleString()}/{selectedSubscription.plan.duration}
                  </div>
                  <div>
                    <span className="font-medium">Max Study Halls:</span> {selectedSubscription.plan.max_study_halls || "Unlimited"}
                  </div>
                  <div>
                    <span className="font-medium">Max Bookings/Month:</span> {selectedSubscription.plan.max_bookings_per_month || "Unlimited"}
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              <div>
                <h4 className="font-medium mb-2">Subscription Information</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Start Date:</span> {safeFormatDate(selectedSubscription.start_date, "PPP")}
                  </div>
                  {selectedSubscription.end_date && (
                    <div>
                      <span className="font-medium">End Date:</span> {safeFormatDate(selectedSubscription.end_date, "PPP")}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Payment Method:</span> {selectedSubscription.payment_method.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">Auto Renew:</span> {selectedSubscription.auto_renew ? "Yes" : "No"}
                  </div>
                  {selectedSubscription.last_payment_date && (
                    <div>
                      <span className="font-medium">Last Payment:</span> {safeFormatDate(selectedSubscription.last_payment_date, "PPP")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};