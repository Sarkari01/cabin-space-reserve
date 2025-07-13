import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, Clock, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRoleBasedDashboard } from "@/utils/roleRedirects";
import { useEffect } from "react";

const Landing = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

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

  const featuredCabins = [
    {
      id: 1,
      name: "Forest Retreat",
      location: "Woodland Hills",
      capacity: 8,
      price: 45,
      image: "/api/placeholder/400/300",
      amenities: ["WiFi", "Projector", "Kitchen"],
      rating: 4.8,
    },
    {
      id: 2,
      name: "Mountain View",
      location: "Alpine Valley",
      capacity: 12,
      price: 65,
      image: "/api/placeholder/400/300",
      amenities: ["WiFi", "Whiteboard", "Coffee"],
      rating: 4.9,
    },
    {
      id: 3,
      name: "Lakeside Cabin",
      location: "Crystal Lake",
      capacity: 6,
      price: 35,
      image: "/api/placeholder/400/300",
      amenities: ["WiFi", "Terrace", "Fireplace"],
      rating: 4.7,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg"></div>
              <h1 className="text-xl font-bold text-foreground">CabinSpace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Find Your Perfect
            <span className="text-primary block">Coworking Cabin</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover serene workspaces in nature. Book premium cabins for your team retreats, 
            meetings, or focused work sessions.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2 p-2 bg-card rounded-lg border shadow-sm">
              <div className="flex-1 flex items-center gap-2 px-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Where do you want to work?" 
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-l">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Team size" 
                  className="border-0 shadow-none focus-visible:ring-0 w-24"
                />
              </div>
              <Button size="lg" className="px-8">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cabins */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Featured Cabins</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Handpicked workspaces that combine productivity with nature's tranquility
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCabins.map((cabin) => (
              <Card key={cabin.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-muted-foreground">{cabin.name}</span>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{cabin.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {cabin.location}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">★ {cabin.rating}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cabin.capacity} people
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">₹{cabin.price}</span>
                      <span className="text-sm text-muted-foreground">/day</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cabin.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                  
                  <Link to="/register">
                    <Button className="w-full" variant="outline">
                      Sign Up to View
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/register">
              <Button size="lg" variant="outline">
                Sign Up to Browse All
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Why Choose CabinSpace?</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Easy Booking</h4>
              <p className="text-muted-foreground">Simple online booking with instant confirmation</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Team Focused</h4>
              <p className="text-muted-foreground">Spaces designed for collaboration and productivity</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Flexible Hours</h4>
              <p className="text-muted-foreground">Book by the hour, day, or week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg"></div>
                <h3 className="text-lg font-bold">CabinSpace</h3>
              </div>
              <p className="text-muted-foreground">Find your perfect workspace in nature</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Guests</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/register" className="hover:text-foreground">Browse Cabins</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-foreground">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Hosts</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/register" className="hover:text-foreground">Become a Host</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Host Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/register" className="hover:text-foreground">Help Center</Link></li>
                <li><Link to="/register" className="hover:text-foreground">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 mt-8 text-center text-muted-foreground">
            <p>&copy; 2024 CabinSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;