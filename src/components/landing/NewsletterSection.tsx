import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsLoading(false);
    setEmail("");
    
    toast({
      title: "Successfully Subscribed!",
      description: "You'll receive updates about new features and offers.",
    });
  };

  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-8 shadow-lg">
            <Mail className="h-12 w-12 text-primary mx-auto mb-6" />
            
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Stay Updated
            </h3>
            
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Subscribe to our newsletter and be the first to know about new study halls, 
              special offers, and platform updates.
            </p>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  className="h-12 px-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center text-green-600 animate-fade-in">
                <Check className="h-6 w-6 mr-2" />
                <span className="text-lg font-semibold">Thank you for subscribing!</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;