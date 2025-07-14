import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import { useSubscriptionPlans, CreatePlanData, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';

interface PlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: SubscriptionPlan | null;
}

export const PlanModal = ({ open, onOpenChange, plan }: PlanModalProps) => {
  const { createPlan, updatePlan } = useSubscriptionPlans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlanData>({
    name: '',
    price: 0,
    duration: 'monthly',
    features: [],
    max_study_halls: 5,
    max_bookings_per_month: 100,
    priority_support: false,
    analytics_access: false,
    status: 'active',
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        features: [...plan.features],
        max_study_halls: plan.max_study_halls,
        max_bookings_per_month: plan.max_bookings_per_month,
        priority_support: plan.priority_support,
        analytics_access: plan.analytics_access,
        status: plan.status,
      });
    } else {
      setFormData({
        name: '',
        price: 0,
        duration: 'monthly',
        features: [],
        max_study_halls: 5,
        max_bookings_per_month: 100,
        priority_support: false,
        analytics_access: false,
        status: 'active',
      });
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (plan) {
        await updatePlan(plan.id, formData);
      } else {
        await createPlan(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
          </DialogTitle>
          <DialogDescription>
            {plan ? 'Update the subscription plan details' : 'Create a new subscription plan for merchants'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Basic, Professional, Enterprise"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value: 'monthly' | 'yearly') => 
                  setFormData(prev => ({ ...prev, duration: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_study_halls">Max Study Halls</Label>
              <Input
                id="max_study_halls"
                type="number"
                min="1"
                max="999"
                value={formData.max_study_halls}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_study_halls: parseInt(e.target.value) || 1 
                }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_bookings">Max Bookings/Month</Label>
              <Input
                id="max_bookings"
                type="number"
                min="1"
                value={formData.max_bookings_per_month}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_bookings_per_month: parseInt(e.target.value) || 1 
                }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Priority Support</Label>
                <p className="text-sm text-muted-foreground">
                  Provide priority customer support for this plan
                </p>
              </div>
              <Switch
                checked={formData.priority_support}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, priority_support: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Analytics Access</Label>
                <p className="text-sm text-muted-foreground">
                  Grant access to advanced analytics features
                </p>
              </div>
              <Switch
                checked={formData.analytics_access}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, analytics_access: checked }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="flex-1 text-sm">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};