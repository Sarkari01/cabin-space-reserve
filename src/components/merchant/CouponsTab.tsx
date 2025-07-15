import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Ticket, Plus, Eye, Calendar, Users, TrendingUp } from "lucide-react";
import { useCoupons } from "@/hooks/useCoupons";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";

export const CouponsTab = () => {
  const { merchantCoupons, couponStats, loading, createCoupon } = useCoupons();
  const { toast } = useToast();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    type: "percentage",
    value: "",
    min_booking_amount: "",
    max_discount: "",
    usage_limit: "",
    user_usage_limit: "",
    start_date: "",
    end_date: "",
        target_audience: "all" as "all" | "new_users" | "returning_users"
  });

  const handleCreateCoupon = async () => {
    if (!formData.title || !formData.code || !formData.value) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      await createCoupon({
        ...formData,
        type: formData.type as 'percentage' | 'flat',
        value: parseFloat(formData.value),
        min_booking_amount: formData.min_booking_amount ? parseFloat(formData.min_booking_amount) : 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        user_usage_limit: formData.user_usage_limit ? parseInt(formData.user_usage_limit) : 1,
      });
      
      setFormData({
        title: "",
        description: "",
        code: "",
        type: "percentage",
        value: "",
        min_booking_amount: "",
        max_discount: "",
        usage_limit: "",
        user_usage_limit: "",
        start_date: "",
        end_date: "",
        target_audience: "all" as "all" | "new_users" | "returning_users"
      });
      setShowCreateForm(false);
      
      toast({
        title: "Coupon Created!",
        description: "Your coupon has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create coupon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateCouponCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Coupon Management</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupon Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couponStats?.total_coupons || 0}</div>
            <p className="text-xs text-muted-foreground">Created by you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couponStats?.active_coupons || 0}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couponStats?.total_usage || 0}</div>
            <p className="text-xs text-muted-foreground">Times used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Discount Given</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(couponStats?.total_discount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total savings</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Coupon Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Coupon</CardTitle>
            <CardDescription>
              Create promotional coupons for your study halls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Weekend Special"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., WEEKEND20"
                    className="font-mono"
                  />
                  <Button variant="outline" onClick={generateCouponCode}>
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your coupon offer..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Discount Value *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={formData.type === 'percentage' ? "e.g., 20" : "e.g., 500"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_booking_amount">Minimum Booking (₹)</Label>
                <Input
                  id="min_booking_amount"
                  type="number"
                  value={formData.min_booking_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_booking_amount: e.target.value }))}
                  placeholder="e.g., 1000"
                />
              </div>
            </div>

            {formData.type === 'percentage' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Maximum Discount (₹)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_discount: e.target.value }))}
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Total Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                  placeholder="e.g., 100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_usage_limit">Per User Limit</Label>
                <Input
                  id="user_usage_limit"
                  type="number"
                  value={formData.user_usage_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_usage_limit: e.target.value }))}
                  placeholder="e.g., 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience</Label>
                <Select value={formData.target_audience} onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value as "all" | "new_users" | "returning_users" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="new_users">New Users Only</SelectItem>
                    <SelectItem value="returning_users">Existing Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateCoupon} disabled={creating}>
                {creating ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Coupon
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Coupons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="h-5 w-5 mr-2" />
            Your Coupons
          </CardTitle>
          <CardDescription>
            Manage your promotional coupons
          </CardDescription>
        </CardHeader>
        <CardContent>
          {merchantCoupons.length > 0 ? (
            <div className="space-y-4">
              {merchantCoupons.map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{coupon.title}</h4>
                      <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                        {coupon.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Code: <span className="font-mono font-medium">{coupon.code}</span></span>
                      <span>Used: {coupon.usage_count}/{coupon.usage_limit || '∞'}</span>
                      {coupon.end_date && (
                        <span>Expires: {formatDate(coupon.end_date)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`} OFF
                    </div>
                    {coupon.min_booking_amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Min: ₹{coupon.min_booking_amount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No coupons created yet</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Coupon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
