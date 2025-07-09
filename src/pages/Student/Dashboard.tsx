import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Users, Heart, Search, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const StudentDashboard = () => {
  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : { name: "Student", email: "student@demo.com" };
  });

  const [activeTab, setActiveTab] = useState("overview");

  const upcomingBookings = [
    {
      id: 1,
      cabin: "Forest Retreat",
      date: "2024-01-15",
      time: "09:00 - 17:00",
      location: "Woodland Hills",
      guests: 6,
      status: "confirmed"
    },
    {
      id: 2,
      cabin: "Mountain View",
      date: "2024-01-22",
      time: "10:00 - 16:00",
      location: "Alpine Valley",
      guests: 4,
      status: "pending"
    }
  ];

  const bookingHistory = [
    {
      id: 3,
      cabin: "Lakeside Cabin",
      date: "2024-01-08",
      time: "09:00 - 17:00",
      location: "Crystal Lake",
      guests: 8,
      status: "completed",
      rating: 5
    }
  ];

  const favoritesCabins = [
    {
      id: 1,
      name: "Forest Retreat",
      location: "Woodland Hills",
      price: 45,
      rating: 4.8
    },
    {
      id: 2,
      name: "Mountain View",
      location: "Alpine Valley",
      price: 65,
      rating: 4.9
    }
  ];

  return (
    <DashboardSidebar 
      userRole="student" 
      userName={user.name}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    >
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user.name}!</h2>
          <p className="text-muted-foreground">Manage your bookings and discover new workspaces</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link to="/cabins">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Browse Cabins</h3>
                    <p className="text-sm text-muted-foreground">Find your perfect workspace</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Quick Book</h3>
                  <p className="text-sm text-muted-foreground">Book your usual spot</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Favorites</h3>
                  <p className="text-sm text-muted-foreground">Your saved cabins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Bookings</h3>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-semibold">{booking.cabin}</h4>
                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{booking.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{booking.time}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.location}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{booking.guests} guests</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Modify
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Favorite Cabins</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritesCabins.map((cabin) => (
                  <Card key={cabin.id} className="hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-muted-foreground">{cabin.name}</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{cabin.name}</h4>
                        <Badge variant="secondary">★ {cabin.rating}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {cabin.location}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">${cabin.price}/day</span>
                        <Button size="sm" variant="outline">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Booking History</h3>
              <div className="space-y-4">
                {bookingHistory.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-semibold">{booking.cabin}</h4>
                            <Badge variant="outline">{booking.status}</Badge>
                            {booking.rating && (
                              <div className="flex items-center space-x-1">
                                <span className="text-sm">★</span>
                                <span className="text-sm">{booking.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{booking.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{booking.time}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.location}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Book Again
                          </Button>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardSidebar>
  );
};

export default StudentDashboard;