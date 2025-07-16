import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import heroBackground from "@/assets/hero-background.jpg";
import AnimatedStats from "./AnimatedStats";
import BannerCarousel from "./BannerCarousel";

const HeroSection = () => {
  const { brandSettings, loading } = useBrandSettings();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-20">
        {/* Banner Carousel */}
        <BannerCarousel />

        {/* Hero Content */}
        <div className="text-center mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {loading ? "Loading..." : brandSettings.brand_name || "StudySpace"}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              {brandSettings.tagline || "Discover premium study halls and coworking spaces. Book your perfect workspace for focused studying, meetings, or collaborative sessions."}
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3 shadow-xl">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl">
                    <MapPin className="h-5 w-5 text-white/70" />
                    <Input 
                      placeholder="Where do you want to study?" 
                      className="border-0 bg-transparent text-white placeholder:text-white/60 shadow-none focus-visible:ring-0 text-lg"
                    />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl">
                    <Users className="h-5 w-5 text-white/70" />
                    <Input 
                      placeholder="Capacity" 
                      className="border-0 bg-transparent text-white placeholder:text-white/60 shadow-none focus-visible:ring-0 text-lg w-full md:w-32"
                    />
                  </div>
                  <Link to="/register" className="w-full md:w-auto">
                    <Button size="lg" className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
                      <Search className="h-5 w-5 mr-2" />
                      Search Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/register">
                <Button size="lg" className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Animated Stats */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-xl">
          <AnimatedStats />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;