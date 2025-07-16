import { 
  Calendar, 
  CreditCard, 
  Gift, 
  Users, 
  DollarSign, 
  Star, 
  Bell, 
  Share,
  Zap,
  Shield,
  Clock,
  MapPin 
} from "lucide-react";
import studyHall1 from "@/assets/study-hall-1.jpg";
import studyHall2 from "@/assets/study-hall-2.jpg";
import studyHall3 from "@/assets/study-hall-3.jpg";

const FeaturesSection = () => {
  const features = [
    {
      icon: Calendar,
      title: "Live Seat Availability",
      description: "Real-time seat tracking and booking system with instant confirmation",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: CreditCard,
      title: "Multiple Payment Options",
      description: "Razorpay, UPI, and offline payment support for seamless transactions",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Gift,
      title: "Rewards & Coupons",
      description: "Earn points on every booking and redeem exclusive discounts",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      title: "Role-Based Dashboards",
      description: "Customized interfaces for admins, merchants, and users",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: DollarSign,
      title: "Settlement Management",
      description: "Automated payment processing and settlement tracking",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: Star,
      title: "Ratings & Reviews",
      description: "Community-driven feedback system for quality assurance",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Pop-up notifications and reminders for bookings and updates",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Share,
      title: "Referral System",
      description: "Invite friends and earn rewards for successful referrals",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const primaryFeatures = [
    {
      icon: Zap,
      title: "Instant Booking",
      description: "Book your perfect study space in seconds with our lightning-fast platform",
      image: studyHall1
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data and payments are protected with enterprise-grade security",
      image: studyHall2
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Access study halls round the clock with flexible timing options",
      image: studyHall3
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Main Features Grid */}
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Powerful Features for Modern Learning
          </h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover the innovative features that make our platform the ultimate choice for study hall bookings and workspace management
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mt-8"></div>
        </div>

        {/* Primary Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {primaryFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group relative overflow-hidden rounded-2xl bg-card border shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;