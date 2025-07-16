import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

const PricingSection = () => {
  const { plans, loading } = useSubscriptionPlans();
  const { settings } = useBusinessSettings();

  const activePlans = plans.filter(plan => plan.status === 'active');

  if (loading) {
    return (
      <section id="pricing" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Pricing Plans</h3>
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-96 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Pricing Plans</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your study hall business needs
          </p>
          <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
        </div>
        
        {activePlans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {activePlans.map((plan, index) => (
              <Card key={plan.id} className={`relative ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}>
                {index === 1 && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                {settings?.trial_plan_enabled && index === 0 && (
                  <Badge variant="secondary" className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Free Trial Available
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    Perfect for {plan.name.toLowerCase()} businesses
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">₹{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.duration === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Up to {plan.max_study_halls} study halls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{plan.max_bookings_per_month} bookings/month</span>
                    </div>
                    {plan.priority_support && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    )}
                    {plan.analytics_access && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Analytics dashboard</span>
                      </div>
                    )}
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-6">
                    <Link to="/register" className="w-full">
                      <Button 
                        className="w-full" 
                        variant={index === 1 ? "default" : "outline"}
                      >
                        {settings?.trial_plan_enabled && index === 0 ? "Start Free Trial" : "Get Started"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No pricing plans available at the moment.</p>
            <Link to="/register">
              <Button className="mt-4">Get Started</Button>
            </Link>
          </div>
        )}
        
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include basic features. Upgrade or downgrade anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;