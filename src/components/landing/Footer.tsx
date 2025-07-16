import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Heart,
  ArrowUp
} from "lucide-react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useState } from "react";

export const Footer = () => {
  const { brandSettings } = useBrandSettings();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup logic here
    setIsSubscribed(true);
    setEmail("");
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Study Halls", href: "/study-halls" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
  ];

  const supportLinks = [
    { name: "Help Center", href: "/help" },
    { name: "FAQ", href: "/faq" },
    { name: "Booking Guide", href: "/booking-guide" },
    { name: "Support", href: "/support" },
    { name: "Status", href: "/status" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Refund Policy", href: "/refunds" },
  ];

  const socialLinks = [
    { 
      name: "Facebook", 
      icon: Facebook, 
      href: brandSettings.social_facebook || "#",
      color: "hover:text-blue-600"
    },
    { 
      name: "Twitter", 
      icon: Twitter, 
      href: brandSettings.social_twitter || "#",
      color: "hover:text-blue-400"
    },
    { 
      name: "Instagram", 
      icon: Instagram, 
      href: brandSettings.social_instagram || "#",
      color: "hover:text-pink-600"
    },
    { 
      name: "LinkedIn", 
      icon: Linkedin, 
      href: brandSettings.social_linkedin || "#",
      color: "hover:text-blue-700"
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-background via-muted/10 to-background border-t border-border/20">
      <div className="container mx-auto px-4">
        {/* Newsletter Section */}
        {brandSettings.newsletter_enabled && (
          <div className="py-12 border-b border-border/20">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Stay Updated
              </Badge>
              <h3 className="text-2xl font-bold mb-2">
                Subscribe to our newsletter
              </h3>
              <p className="text-muted-foreground mb-6">
                {brandSettings.newsletter_description || "Get the latest updates on new study spaces and special offers."}
              </p>
              
              {isSubscribed ? (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <Heart className="w-5 h-5" />
                  <span>Thanks for subscribing!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 border-2 focus:border-primary/50"
                  />
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg"
                  >
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center space-x-3 mb-6">
                {brandSettings.logo_url ? (
                  <img
                    src={brandSettings.logo_url}
                    alt={brandSettings.brand_name || "Logo"}
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {brandSettings.brand_name?.charAt(0) || "S"}
                    </span>
                  </div>
                )}
                <span className="text-xl font-bold">
                  {brandSettings.brand_name || "StudySpace"}
                </span>
              </Link>
              
              <p className="text-muted-foreground mb-6 max-w-md">
                {brandSettings.tagline || "Premium study spaces designed for focused learning and productivity. Book your perfect study environment today."}
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                {brandSettings.support_email && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>{brandSettings.support_email}</span>
                  </div>
                )}
                {brandSettings.support_phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{brandSettings.support_phone}</span>
                  </div>
                )}
                {brandSettings.business_address && (
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{brandSettings.business_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                {supportLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom Footer */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>
              {brandSettings.copyright_text || `© ${currentYear} ${brandSettings.brand_name || 'StudySpace'}. All rights reserved.`}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted-foreground ${social.color} transition-colors`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* Back to Top */}
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowUp className="w-4 h-4 mr-1" />
              Top
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};