import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { PlanModal } from './PlanModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const SubscriptionPlansTab = () => {
  const { plans, loading, deletePlan, togglePlanStatus } = useSubscriptionPlans();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    await deletePlan(planId);
  };

  const formatPrice = (price: number, duration: string) => {
    return `₹${price.toLocaleString('en-IN')}/${duration === 'monthly' ? 'month' : 'year'}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading subscription plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Manage pricing plans for merchant subscriptions
          </p>
        </div>
        <Button onClick={handleCreatePlan} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                    {plan.status}
                  </Badge>
                  <Switch
                    checked={plan.status === 'active'}
                    onCheckedChange={() => togglePlanStatus(plan.id)}
                  />
                </div>
              </div>
              <CardDescription className="text-2xl font-bold text-primary">
                {formatPrice(plan.price, plan.duration)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Up to {plan.max_study_halls} study halls</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.max_bookings_per_month} bookings/month</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {plan.priority_support && (
                    <Badge variant="outline" className="text-xs">Priority Support</Badge>
                  )}
                  {plan.analytics_access && (
                    <Badge variant="outline" className="text-xs">Analytics</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the "{plan.name}" plan? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePlan(plan.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        plan={editingPlan}
      />
    </div>
  );
};