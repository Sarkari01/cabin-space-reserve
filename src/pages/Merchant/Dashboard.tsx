import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, Calendar, Users, DollarSign, Star, LogOut, BarChart3, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { CabinModal } from "@/components/CabinModal";
import { useToast } from "@/hooks/use-toast";

const MerchantDashboard = () => {
  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : { name: "Merchant", email: "merchant@demo.com" };
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedCabin, setSelectedCabin] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const stats = [
    {
      title: "Total Cabins",
      value: "3",
      icon: Home,
      change: "+1 this month"
    },
    {
      title: "Active Bookings",
      value: "12",
      icon: Calendar,
      change: "+3 this week"
    },
    {
      title: "Total Revenue",
      value: "$2,450",
      icon: DollarSign,
      change: "+15% from last month"
    },
    {
      title: "Average Rating",
      value: "4.8",
      icon: Star,
      change: "Based on 23 reviews"
    }
  ];

  const [myCabins, setMyCabins] = useState([
    {
      id: 1,
      name: "Forest Retreat",
      location: "Woodland Hills",
      price: 45,
      status: "active",
      bookings: 8,
      rating: 4.8,
      revenue: "$1,200"
    },
    {
      id: 2,
      name: "Mountain View",
      location: "Alpine Valley",
      price: 65,
      status: "active",
      bookings: 12,
      rating: 4.9,
      revenue: "$1,800"
    },
    {
      id: 3,
      name: "Lakeside Cabin",
      location: "Crystal Lake",
      price: 35,
      status: "pending",
      bookings: 0,
      rating: 0,
      revenue: "$0"
    }
  ]);

  const handleAddCabin = () => {
    setSelectedCabin(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleViewCabin = (cabin: any) => {
    setSelectedCabin(cabin);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEditCabin = (cabin: any) => {
    setSelectedCabin(cabin);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleSaveCabin = (cabinData: any) => {
    if (modalMode === "add") {
      const newCabin = {
        ...cabinData,
        id: Date.now(), // Simple ID generation
        bookings: 0,
        rating: 0,
        revenue: "$0"
      };
      setMyCabins([...myCabins, newCabin]);
      toast({
        title: "Cabin Added",
        description: "Your cabin has been successfully added.",
      });
    } else if (modalMode === "edit") {
      setMyCabins(myCabins.map(cabin => 
        cabin.id === cabinData.id ? cabinData : cabin
      ));
      toast({
        title: "Cabin Updated",
        description: "Your cabin has been successfully updated.",
      });
    }
  };

  const handleDeleteCabin = (id: number) => {
    setMyCabins(myCabins.filter(cabin => cabin.id !== id));
    toast({
      title: "Cabin Deleted",
      description: "Your cabin has been successfully deleted.",
      variant: "destructive",
    });
  };

  const recentBookings = [
    {
      id: 1,
      cabin: "Forest Retreat",
      guest: "John Smith",
      date: "2024-01-15",
      guests: 6,
      amount: "$270",
      status: "confirmed"
    },
    {
      id: 2,
      cabin: "Mountain View",
      guest: "Sarah Johnson",
      date: "2024-01-18",
      guests: 4,
      amount: "$195",
      status: "pending"
    },
    {
      id: 3,
      cabin: "Forest Retreat",
      guest: "Mike Davis",
      date: "2024-01-20",
      guests: 8,
      amount: "$360",
      status: "confirmed"
    }
  ];

  return (
    <DashboardSidebar 
      userRole="merchant" 
      userName={user.name}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    >
      <div className="p-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Merchant Dashboard</h2>
            <p className="text-muted-foreground">Manage your cabins and track your business</p>
          </div>
          <Button onClick={handleAddCabin}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Cabin
          </Button>
        </div>

        {/* Stats Cards - Show only on overview tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content based on active tab */}
        {activeTab === "overview" && (
          <Tabs defaultValue="cabins" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cabins">My Cabins</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

          {/* Cabins Tab */}
          <TabsContent value="cabins" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Cabins</h3>
              <Button variant="outline" onClick={handleAddCabin}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cabin
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {myCabins.map((cabin) => (
                <Card key={cabin.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-muted-foreground">{cabin.name}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{cabin.name}</h4>
                        <p className="text-sm text-muted-foreground">{cabin.location}</p>
                      </div>
                      <Badge variant={cabin.status === "active" ? "default" : "secondary"}>
                        {cabin.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price/day</p>
                        <p className="font-semibold">${cabin.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bookings</p>
                        <p className="font-semibold">{cabin.bookings}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rating</p>
                        <p className="font-semibold">
                          {cabin.rating > 0 ? `★ ${cabin.rating}` : "No reviews"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{cabin.revenue}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditCabin(cabin)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewCabin(cabin)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Recent Bookings</h3>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{booking.cabin}</h4>
                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">{booking.guest}</span> • {booking.date} • {booking.guests} guests
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{booking.amount}</p>
                          <div className="flex space-x-2 mt-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Your earnings over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Revenue Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Booking patterns and peak times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Booking Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Direct tab content for sidebar navigation */}
        {activeTab === "cabins" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Cabins</h3>
              <Button variant="outline" onClick={handleAddCabin}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cabin
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {myCabins.map((cabin) => (
                <Card key={cabin.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-muted-foreground">{cabin.name}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{cabin.name}</h4>
                        <p className="text-sm text-muted-foreground">{cabin.location}</p>
                      </div>
                      <Badge variant={cabin.status === "active" ? "default" : "secondary"}>
                        {cabin.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price/day</p>
                        <p className="font-semibold">${cabin.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bookings</p>
                        <p className="font-semibold">{cabin.bookings}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rating</p>
                        <p className="font-semibold">
                          {cabin.rating > 0 ? `★ ${cabin.rating}` : "No reviews"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{cabin.revenue}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditCabin(cabin)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewCabin(cabin)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Recent Bookings</h3>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{booking.cabin}</h4>
                          <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{booking.guest}</span> • {booking.date} • {booking.guests} guests
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{booking.amount}</p>
                        <div className="flex space-x-2 mt-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact
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

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Your earnings over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Revenue Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Booking patterns and peak times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Booking Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <CabinModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          cabin={selectedCabin}
          mode={modalMode}
          onSave={handleSaveCabin}
          onDelete={handleDeleteCabin}
        />
      </div>
    </DashboardSidebar>
  );
};

export default MerchantDashboard;