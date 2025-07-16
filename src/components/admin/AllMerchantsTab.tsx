import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  Eye, 
  Edit, 
  Crown, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Building,
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useAllMerchants } from "@/hooks/useAllMerchants";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const AllMerchantsTab = () => {
  const { merchants, stats, loading, assignPlanToMerchant, updateMerchantStatus } = useAllMerchants();
  const { plans } = useSubscriptionPlans();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [assignPlanModalOpen, setAssignPlanModalOpen] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Plan assignment form state
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  const getSubscriptionStatusBadge = (merchant: any) => {
    if (!merchant.current_subscription) {
      return <Badge variant="outline">No Subscription</Badge>;
    }
    
    if (merchant.current_subscription.is_trial) {
      return <Badge variant="secondary">Trial</Badge>;
    }
    
    if (merchant.current_subscription.status === 'active') {
      return <Badge variant="default">Active</Badge>;
    }
    
    return <Badge variant="destructive">Inactive</Badge>;
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Unverified</Badge>;
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = 
      merchant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.merchant_number?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "subscribed" && merchant.current_subscription?.status === 'active' && !merchant.current_subscription?.is_trial) ||
      (statusFilter === "trial" && merchant.current_subscription?.is_trial) ||
      (statusFilter === "unsubscribed" && (!merchant.current_subscription || merchant.current_subscription.status !== 'active'));
    
    const matchesVerification = verificationFilter === "all" ||
      merchant.merchant_profile?.verification_status === verificationFilter;
    
    return matchesSearch && matchesStatus && matchesVerification;
  });

  const handleAssignPlan = async () => {
    if (!selectedMerchant || !selectedPlanId) return;
    
    try {
      setAssignmentLoading(true);
      await assignPlanToMerchant(
        selectedMerchant.id,
        selectedPlanId,
        customDuration ? parseInt(customDuration) : undefined,
        assignmentNotes
      );
      
      // Reset form
      setSelectedPlanId("");
      setCustomDuration("");
      setAssignmentNotes("");
      setAssignPlanModalOpen(false);
      setSelectedMerchant(null);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setAssignmentLoading(false);
    }
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
        <h3 className="text-2xl font-semibold">All Merchants Management</h3>
        <p className="text-muted-foreground">
          Complete merchant overview with manual subscription management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMerchants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.subscribedMerchants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Trial</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.trialMerchants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unsubscribedMerchants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.verifiedMerchants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingVerification}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants by name, email, or number..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Subscription Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="subscribed">Subscribed</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Verification Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Merchants List */}
      <div className="space-y-4">
        {filteredMerchants.map((merchant) => (
          <Card key={merchant.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  {/* Merchant Basic Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {merchant.full_name || 'Unknown Merchant'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {merchant.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Merchant #{merchant.merchant_number} • Joined {safeFormatDate(merchant.created_at, "MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {getSubscriptionStatusBadge(merchant)}
                      {getVerificationStatusBadge(merchant.merchant_profile?.verification_status || 'unverified')}
                    </div>
                  </div>

                  {/* Subscription & Business Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">
                          {merchant.current_subscription?.plan.name || 'No Plan'}
                        </span>
                      </div>
                      {merchant.current_subscription && (
                        <p className="text-muted-foreground">
                          ₹{merchant.current_subscription.plan.price.toLocaleString()}/{merchant.current_subscription.plan.duration}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{merchant.study_halls_count} Study Halls</span>
                      </div>
                      <p className="text-muted-foreground">
                        Onboarding: {merchant.merchant_profile?.onboarding_step || 1}/5
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">₹{merchant.total_revenue.toLocaleString()}</span>
                      </div>
                      <p className="text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  {merchant.current_subscription && (
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Started: {safeFormatDate(merchant.current_subscription.start_date, "PPP")}</span>
                      {merchant.current_subscription.end_date && (
                        <span>
                          Expires: {safeFormatDate(merchant.current_subscription.end_date, "PPP")}
                        </span>
                      )}
                      {merchant.current_subscription.is_trial && merchant.current_subscription.trial_end_date && (
                        <Badge variant="secondary" className="text-xs">
                          Trial ends {safeFormatDate(merchant.current_subscription.trial_end_date, "MMM dd")}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedMerchant(merchant);
                      setAssignPlanModalOpen(true);
                    }}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Assign Plan
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Study Halls</DropdownMenuItem>
                      <DropdownMenuItem>View Transactions</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {merchant.current_subscription && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => updateMerchantStatus(merchant.id, 'cancelled')}
                            className="text-red-600"
                          >
                            Cancel Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateMerchantStatus(merchant.id, 'active')}
                          >
                            Reactivate Subscription
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Assignment Modal */}
      <Dialog open={assignPlanModalOpen} onOpenChange={setAssignPlanModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Subscription Plan</DialogTitle>
            <DialogDescription>
              Manually assign a subscription plan to {selectedMerchant?.full_name || selectedMerchant?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subscription plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price}/{plan.duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">Custom Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Leave empty for plan default"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Administrative Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this assignment..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleAssignPlan}
                disabled={!selectedPlanId || assignmentLoading}
                className="flex-1"
              >
                {assignmentLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                Assign Plan
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAssignPlanModalOpen(false)}
                disabled={assignmentLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};