import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award, Target, Heart, Zap } from "lucide-react";

const AboutSection = () => {
  const { brandSettings, loading } = useBrandSettings();

  const { data: realStats } = useQuery({
    queryKey: ["about-stats"],
    queryFn: async () => {
      const [
        { count: studyHallsCount },
        { count: usersCount },
        { count: bookingsCount }
      ] = await Promise.all([
        supabase.from("study_halls").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true })
      ]);

      return {
        users: usersCount || 0,
        studyHalls: studyHallsCount || 0,
        bookings: bookingsCount || 0
      };
    }
  });

  const values = [
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in every aspect of our service delivery"
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Continuously improving our platform with cutting-edge technology"
    },
    {
      icon: Heart,
      title: "Community",
      description: "Building a supportive community of learners and professionals"
    },
    {
      icon: Zap,
      title: "Efficiency",
      description: "Making workspace booking fast, simple, and hassle-free"
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              About {loading ? "Us" : brandSettings.brand_name || "StudySpace Platform"}
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Empowering students and professionals with premium workspace solutions
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mt-8"></div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
            <div className="space-y-6">
              <h4 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Our Mission
              </h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We're dedicated to revolutionizing the way students and professionals access quality workspace. 
                Our platform connects learners with premium study halls and coworking spaces, fostering 
                productivity, collaboration, and academic success.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're preparing for competitive exams, working on group projects, or need a quiet 
                space for focused work, we provide a seamless booking experience with modern amenities, 
                flexible pricing, and 24/7 support.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 pt-8">
                <div className="text-center p-4 bg-card/50 rounded-xl border">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {realStats ? `${Math.max(realStats.users, 1000)}+` : "1000+"}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Happy Users</div>
                </div>
                <div className="text-center p-4 bg-card/50 rounded-xl border">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {realStats ? `${Math.max(realStats.studyHalls, 50)}+` : "50+"}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Study Halls</div>
                </div>
                <div className="text-center p-4 bg-card/50 rounded-xl border">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground font-medium">Support</div>
                </div>
                <div className="text-center p-4 bg-card/50 rounded-xl border">
                  <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                  <div className="text-sm text-muted-foreground font-medium">Uptime</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                {brandSettings.logo_url ? (
                  <img 
                    src={brandSettings.logo_url} 
                    alt="About Us" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-primary/30 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                      <span className="text-4xl font-bold text-primary">
                        {brandSettings.brand_name?.charAt(0) || "S"}
                      </span>
                    </div>
                    <p className="text-xl font-semibold text-muted-foreground">
                      {brandSettings.brand_name || "StudySpace Platform"}
                    </p>
                  </div>
                )}
              </div>
              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-xl" />
            </div>
          </div>

          {/* Our Values */}
          <div className="text-center mb-12">
            <h4 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Our Values</h4>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center p-6 bg-card/50 backdrop-blur-sm border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h5 className="text-lg font-semibold mb-3 text-foreground">{value.title}</h5>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;