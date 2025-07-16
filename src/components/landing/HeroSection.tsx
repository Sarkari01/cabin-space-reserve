import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useBrandSettings } from "@/hooks/useBrandSettings";

const HeroSection = () => {
  const { brandSettings, loading } = useBrandSettings();

  return (
    <section id="home" className="pt-20 bg-gradient-to-b from-primary/10 to-background py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Welcome to
          <span className="text-primary block">
            {loading ? "Loading..." : brandSettings.brand_name || "StudySpace Platform"}
          </span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {brandSettings.tagline || "Discover premium study halls and coworking spaces. Book your perfect workspace for focused studying, meetings, or collaborative sessions."}
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2 p-2 bg-card rounded-lg border shadow-sm">
            <div className="flex-1 flex items-center gap-2 px-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Where do you want to study?" 
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-2 px-3 border-l">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Capacity" 
                className="border-0 shadow-none focus-visible:ring-0 w-24"
              />
            </div>
            <Link to="/register">
              <Button size="lg" className="px-8">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Button size="lg" variant="outline" onClick={() => {
            const element = document.getElementById('features');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}>
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;