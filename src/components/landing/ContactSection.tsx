import { Mail, Phone, MapPin, Globe } from "lucide-react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import ContactForm from "./ContactForm";

const ContactSection = () => {
  const { brandSettings, loading } = useBrandSettings();

  return (
    <section id="contact" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Contact Us</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get in touch with us for any questions, support, or business inquiries
          </p>
          <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div>
            <h4 className="text-2xl font-semibold mb-6 text-foreground">Get In Touch</h4>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We're here to help you with any questions or support you need. Reach out to us 
              through any of the following channels and we'll get back to you as soon as possible.
            </p>
            
            <div className="space-y-6">
              {brandSettings.support_email && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Email</div>
                    <a 
                      href={`mailto:${brandSettings.support_email}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {brandSettings.support_email}
                    </a>
                  </div>
                </div>
              )}
              
              {brandSettings.support_phone && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Phone</div>
                    <a 
                      href={`tel:${brandSettings.support_phone}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {brandSettings.support_phone}
                    </a>
                  </div>
                </div>
              )}
              
              {brandSettings.website_url && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Website</div>
                    <a 
                      href={brandSettings.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {brandSettings.website_url}
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Address</div>
                  <div className="text-muted-foreground">
                    Available for registered merchants
                  </div>
                </div>
              </div>
            </div>
            
            {!loading && (!brandSettings.support_email && !brandSettings.support_phone) && (
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Contact information will be displayed here once configured by the administrator.
                </p>
              </div>
            )}
          </div>
          
          {/* Contact Form */}
          <div>
            <h4 className="text-2xl font-semibold mb-6 text-foreground">Send Us a Message</h4>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;