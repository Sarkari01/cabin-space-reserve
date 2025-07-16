import { useBrandSettings } from "@/hooks/useBrandSettings";

const AboutSection = () => {
  const { brandSettings, loading } = useBrandSettings();

  return (
    <section id="about" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-6">
              About {loading ? "Us" : brandSettings.brand_name || "StudySpace Platform"}
            </h3>
            <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h4 className="text-2xl font-semibold mb-6 text-foreground">Our Mission</h4>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We're dedicated to providing premium study halls and coworking spaces that foster 
                productivity, collaboration, and success. Our platform connects students and professionals 
                with the perfect workspace environment for their needs.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Whether you're preparing for exams, working on group projects, or need a quiet space 
                for focused work, we offer a seamless booking experience with modern amenities and 
                flexible pricing options.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">1000+</div>
                  <div className="text-sm text-muted-foreground">Happy Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">50+</div>
                  <div className="text-sm text-muted-foreground">Study Halls</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                {brandSettings.logo_url ? (
                  <img 
                    src={brandSettings.logo_url} 
                    alt="About Us" 
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {brandSettings.brand_name?.charAt(0) || "S"}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {brandSettings.brand_name || "StudySpace Platform"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;