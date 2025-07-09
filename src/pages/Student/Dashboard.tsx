import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Clock, Users, Heart, Search, Filter, Star } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const StudentDashboard = () => {
  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : { name: "Student", email: "student@demo.com" };
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const upcomingBookings = [
    {
      id: 1,
      cabin: "Forest Retreat",
      date: "2024-01-15",
      time: "09:00 - 17:00",
      location: "Woodland Hills",
      guests: 6,
      status: "confirmed",
      price: "$270"
    },
    {
      id: 2,
      cabin: "Mountain View",
      date: "2024-01-22",
      time: "10:00 - 16:00",
      location: "Alpine Valley",
      guests: 4,
      status: "pending",
      price: "$195"
    }
  ];

  const availableCabins = [
    {
      id: 1,
      name: "Forest Retreat",
      location: "Woodland Hills",
      price: 45,
      rating: 4.8,
      amenities: ["WiFi", "Coffee", "Projector"],
      capacity: 8
    },
    {
      id: 2,
      name: "Mountain View",
      location: "Alpine Valley",
      price: 65,
      rating: 4.9,
      amenities: ["WiFi", "Kitchen", "Whiteboard"],
      capacity: 6
    },
    {
      id: 3,
      name: "Lakeside Cabin",
      location: "Crystal Lake",
      price: 35,
      rating: 4.7,
      amenities: ["WiFi", "Coffee", "Printer"],
      capacity: 4
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

  const bookingHistory = [
    {
      id: 3,
      cabin: "Lakeside Cabin",
      date: "2024-01-08",
      time: "09:00 - 17:00",
      location: "Crystal Lake",
      guests: 8,
      status: "completed",
      rating: 5,
      price: "$280"
    }
  ];

  const filteredCabins = availableCabins.filter(cabin =>
    cabin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cabin.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardSidebar 
      userRole="student" 
      userName={user.name}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    >
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user.name}!</h2>
              <p className="text-muted-foreground">Manage your bookings and discover new workspaces</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Bookings</p>
                      <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Favorite Cabins</p>
                      <p className="text-2xl font-bold">{favoritesCabins.length}</p>
                    </div>
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Visits</p>
                      <p className="text-2xl font-bold">{bookingHistory.length + upcomingBookings.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled cabin visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBookings.slice(0, 2).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{booking.cabin}</h4>
                        <p className="text-sm text-muted-foreground">{booking.date} • {booking.time}</p>
                      </div>
                      <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Browse Cabins Tab */}
        {activeTab === "browse" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Browse Cabins</h3>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cabins by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Cabins Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCabins.map((cabin) => (
                <Card key={cabin.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-muted-foreground">{cabin.name}</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{cabin.name}</h4>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{cabin.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {cabin.location}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Up to {cabin.capacity} people
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cabin.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">${cabin.price}/day</span>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">My Bookings</h3>
            
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
                      <div className="text-right">
                        <p className="text-lg font-semibold mb-2">{booking.price}</p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Modify
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Your Favorite Cabins</h3>
            
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
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{cabin.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {cabin.location}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">${cabin.price}/day</span>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                        <Button size="sm">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardSidebar>
  );
};

export default StudentDashboard;