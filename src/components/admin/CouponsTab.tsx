import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Calendar, Users, Target } from 'lucide-react';
import { useCoupons, Coupon } from '@/hooks/useCoupons';
import { useToast } from '@/hooks/use-toast';
import { safeFormatDate } from "@/lib/dateUtils";

export const CouponsTab = () => {
  const { coupons, couponUsage, loading, createCoupon, updateCoupon, deleteCoupon } = useCoupons('admin');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    type: 'flat' as 'flat' | 'percentage',
    value: 0,
    min_booking_amount: 0,
    max_discount: 0,
    target_audience: 'all' as 'all' | 'new_users' | 'returning_users',
    usage_limit: 0,
    user_usage_limit: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active' as 'active' | 'inactive' | 'expired'
  });

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'flat' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      description: '',
      type: 'flat',
      value: 0,
      min_booking_amount: 0,
      max_discount: 0,
      target_audience: 'all',
      usage_limit: 0,
      user_usage_limit: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'active'
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.code || !formData.value) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const success = await createCoupon({
      ...formData,
      end_date: formData.end_date || undefined,
      max_discount: formData.max_discount || undefined,
      usage_limit: formData.usage_limit || undefined
    });

    if (success) {
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      min_booking_amount: coupon.min_booking_amount,
      max_discount: coupon.max_discount || 0,
      target_audience: coupon.target_audience,
      usage_limit: coupon.usage_limit || 0,
      user_usage_limit: coupon.user_usage_limit,
      start_date: coupon.start_date.split('T')[0],
      end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
      status: coupon.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCoupon) return;

    const success = await updateCoupon(editingCoupon.id, {
      ...formData,
      end_date: formData.end_date || undefined,
      max_discount: formData.max_discount || undefined,
      usage_limit: formData.usage_limit || undefined
    });

    if (success) {
      setIsEditDialogOpen(false);
      setEditingCoupon(null);
      resetForm();
    }
  };

  const handleDelete = async (couponId: string) => {
    if (confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      await deleteCoupon(couponId);
    }
  };

  if (loading) {
    return <div className="p-6">Loading coupons...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coupon Management</h2>
          <p className="text-muted-foreground">Create and manage promotional coupons</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summer Sale 50% Off"
                />
              </div>
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER50"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the coupon offer..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value: 'flat' | 'percentage') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.type === 'flat' ? "100" : "50"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_amount">Min Booking Amount</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    value={formData.min_booking_amount}
                    onChange={(e) => setFormData({ ...formData, min_booking_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="max_discount">Max Discount</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })}
                    placeholder="1000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="target_audience">Target Audience</Label>
                <Select value={formData.target_audience} onValueChange={(value: any) => setFormData({ ...formData, target_audience: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="new_users">New Users Only</SelectItem>
                    <SelectItem value="returning_users">Returning Users Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Total Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="user_usage_limit">Per User Limit</Label>
                  <Input
                    id="user_usage_limit"
                    type="number"
                    value={formData.user_usage_limit}
                    onChange={(e) => setFormData({ ...formData, user_usage_limit: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create Coupon
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search coupons by code or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Coupons Grid */}
      <div className="grid gap-4">
        {filteredCoupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{coupon.title}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className="font-mono text-xs">{coupon.code}</Badge>
                    <Badge className={getStatusColor(coupon.status)}>{coupon.status}</Badge>
                    <Badge className={getTypeColor(coupon.type)}>
                      {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(coupon)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {coupon.description && (
                <p className="text-sm text-muted-foreground">{coupon.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{coupon.usage_count}/{coupon.usage_limit || '∞'} used</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span>{coupon.target_audience.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{safeFormatDate(coupon.start_date, 'MMM dd, yyyy')}</span>
                </div>
                {coupon.end_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Until {safeFormatDate(coupon.end_date, 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
              {coupon.min_booking_amount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum booking: ₹{coupon.min_booking_amount}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No coupons found</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div>
              <Label htmlFor="edit_title">Title *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Summer Sale 50% Off"
              />
            </div>
            <div>
              <Label htmlFor="edit_code">Code *</Label>
              <Input
                id="edit_code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER50"
              />
            </div>
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Update Coupon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};