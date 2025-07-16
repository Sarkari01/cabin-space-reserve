import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRoleBasedDashboard } from "@/utils/roleRedirects";
import { useEffect } from "react";
import LandingNavigation from "@/components/landing/LandingNavigation";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import ContactSection from "@/components/landing/ContactSection";
import { useBrandSettings } from "@/hooks/useBrandSettings";

const Landing = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { brandSettings } = useBrandSettings();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!loading && user && userRole) {
      const dashboard = getRoleBasedDashboard(userRole);
      navigate(dashboard, { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the landing page if user is authenticated
  if (user && userRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <PricingSection />
      <ContactSection />
      
      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {brandSettings.logo_url ? (
                  <img 
                    src={brandSettings.logo_url} 
                    alt="Logo" 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-lg"></div>
                )}
                <h3 className="text-lg font-bold">
                  {brandSettings.brand_name || "StudySpace Platform"}
                </h3>
              </div>
              <p className="text-muted-foreground">
                {brandSettings.tagline || "Find your perfect study space"}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><button onClick={() => document.getElementById('home')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-foreground">Browse Study Halls</button></li>
                <li><a href="/login" className="hover:text-foreground">Sign In</a></li>
                <li><a href="/register" className="hover:text-foreground">Sign Up</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Merchants</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/register" className="hover:text-foreground">Become a Merchant</a></li>
                <li><a href="/login" className="hover:text-foreground">Merchant Dashboard</a></li>
                <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-foreground">View Pricing</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><button onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-foreground">Contact Us</button></li>
                <li><button onClick={() => document.getElementById('about')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-foreground">About Us</button></li>
                {brandSettings.support_email && (
                  <li>
                    <a href={`mailto:${brandSettings.support_email}`} className="hover:text-foreground">
                      Email Support
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 mt-8 text-center text-muted-foreground">
            <p>{brandSettings.copyright_text || `© ${new Date().getFullYear()} ${brandSettings.brand_name || "StudySpace Platform"}. All rights reserved.`}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;