import { 
  Calendar, 
  CreditCard, 
  Gift, 
  Users, 
  DollarSign, 
  Star, 
  Bell, 
  Share 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Calendar,
      title: "Live Seat Availability",
      description: "Real-time seat tracking and booking system with instant confirmation"
    },
    {
      icon: CreditCard,
      title: "Multiple Payment Options",
      description: "Razorpay, UPI, and offline payment support for seamless transactions"
    },
    {
      icon: Gift,
      title: "Rewards & Coupons",
      description: "Earn points on every booking and redeem exclusive discounts"
    },
    {
      icon: Users,
      title: "Role-Based Dashboards",
      description: "Customized interfaces for admins, merchants, and users"
    },
    {
      icon: DollarSign,
      title: "Settlement Management",
      description: "Automated payment processing and settlement tracking"
    },
    {
      icon: Star,
      title: "Ratings & Reviews",
      description: "Community-driven feedback system for quality assurance"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Pop-up notifications and reminders for bookings and updates"
    },
    {
      icon: Share,
      title: "Referral System",
      description: "Invite friends and earn rewards for successful referrals"
    }
  ];

  return (
    <section id="features" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Platform Features</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the powerful features that make our platform the best choice for study hall bookings
          </p>
          <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-3 text-foreground">{feature.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;