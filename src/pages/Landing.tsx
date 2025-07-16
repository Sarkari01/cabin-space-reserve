import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRoleBasedDashboard } from "@/utils/roleRedirects";
import { useEffect } from "react";
import LandingNavigation from "@/components/landing/LandingNavigation";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import NewsletterSection from "@/components/landing/NewsletterSection";
import ContactSection from "@/components/landing/ContactSection";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { usePolicyPages } from "@/hooks/usePolicyPages";

const Landing = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { brandSettings } = useBrandSettings();
  const { data: policyPages } = usePolicyPages(true);

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
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <NewsletterSection />
      <ContactSection />
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-background via-muted/30 to-background border-t">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-5 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                {brandSettings.logo_url ? (
                  <img 
                    src={brandSettings.logo_url} 
                    alt="Logo" 
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/10"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg"></div>
                )}
                <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {brandSettings.brand_name || "StudySpace Platform"}
                </h3>
              </div>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                {brandSettings.tagline || "Connecting students with premium study spaces across the country. Join thousands of successful bookings every month."}
              </p>
              
              {/* Social Media Links */}
              <div className="flex items-center space-x-4">
                {brandSettings.social_facebook && (
                  <a 
                    href={brandSettings.social_facebook}
                    className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-sm font-bold">f</span>
                  </a>
                )}
                {brandSettings.social_twitter && (
                  <a 
                    href={brandSettings.social_twitter}
                    className="w-10 h-10 bg-sky-50 dark:bg-sky-950/30 rounded-lg flex items-center justify-center text-sky-600 dark:text-sky-400 hover:scale-110 transition-transform duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-sm font-bold">𝕏</span>
                  </a>
                )}
                {brandSettings.social_instagram && (
                  <a 
                    href={brandSettings.social_instagram}
                    className="w-10 h-10 bg-pink-50 dark:bg-pink-950/30 rounded-lg flex items-center justify-center text-pink-600 dark:text-pink-400 hover:scale-110 transition-transform duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-sm font-bold">📷</span>
                  </a>
                )}
                {brandSettings.social_linkedin && (
                  <a 
                    href={brandSettings.social_linkedin}
                    className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-700 dark:text-blue-300 hover:scale-110 transition-transform duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-sm font-bold">in</span>
                  </a>
                )}
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-6">For Students</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <button 
                    onClick={() => document.getElementById('home')?.scrollIntoView({behavior: 'smooth'})} 
                    className="hover:text-primary transition-colors duration-200 text-left"
                  >
                    Browse Study Halls
                  </button>
                </li>
                <li>
                  <a href="/login" className="hover:text-primary transition-colors duration-200">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="/register" className="hover:text-primary transition-colors duration-200">
                    Create Account
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})} 
                    className="hover:text-primary transition-colors duration-200 text-left"
                  >
                    Features
                  </button>
                </li>
              </ul>
            </div>
            
            {/* For Merchants */}
            <div>
              <h4 className="font-bold text-lg mb-6">For Merchants</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <a href="/register" className="hover:text-primary transition-colors duration-200">
                    Become a Partner
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-primary transition-colors duration-200">
                    Merchant Dashboard
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})} 
                    className="hover:text-primary transition-colors duration-200 text-left"
                  >
                    View Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('about')?.scrollIntoView({behavior: 'smooth'})} 
                    className="hover:text-primary transition-colors duration-200 text-left"
                  >
                    Success Stories
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Support & Resources */}
            <div>
              <h4 className="font-bold text-lg mb-6">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <button 
                    onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})} 
                    className="hover:text-primary transition-colors duration-200 text-left"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('faq')?.scrollIntoView({behavior: 'smooth'})} 
                    className="hover:text-primary transition-colors duration-200 text-left"
                  >
                    FAQ
                  </button>
                </li>
                {brandSettings.support_email && (
                  <li>
                    <a 
                      href={`mailto:${brandSettings.support_email}`} 
                      className="hover:text-primary transition-colors duration-200"
                    >
                      Email Support
                    </a>
                  </li>
                )}
                {policyPages?.map((page) => (
                  <li key={page.id}>
                    <a 
                      href={`/policies/${page.slug}`} 
                      className="hover:text-primary transition-colors duration-200"
                    >
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Newsletter Signup */}
          {brandSettings.newsletter_enabled && (
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 mb-12">
              <div className="text-center max-w-2xl mx-auto">
                <h4 className="text-2xl font-bold mb-4">Stay Updated</h4>
                <p className="text-muted-foreground mb-6 text-lg">
                  {brandSettings.newsletter_description || "Get the latest updates on new study halls, features, and exclusive offers."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-border focus:border-primary/50 bg-background"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-primary transition-all duration-200">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom Bar */}
          <div className="border-t border-border/40 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-muted-foreground text-center md:text-left">
                {brandSettings.copyright_text || `© ${new Date().getFullYear()} ${brandSettings.brand_name || "StudySpace Platform"}. All rights reserved.`}
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>Made with ❤️ for students & merchants</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;