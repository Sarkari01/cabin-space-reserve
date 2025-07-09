import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, Calendar, Users, DollarSign, Star, LogOut, BarChart3, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { CabinModal } from "@/components/CabinModal";
import { StudyHallModal } from "@/components/StudyHallModal";
import { useToast } from "@/hooks/use-toast";

const MerchantDashboard = () => {
  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : { name: "Merchant", email: "merchant@demo.com" };
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedCabin, setSelectedCabin] = useState<any>(null);
  const [studyHallModalOpen, setStudyHallModalOpen] = useState(false);
  const [studyHallModalMode, setStudyHallModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedStudyHall, setSelectedStudyHall] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const stats = [
    {
      title: "Total Study Halls",
      value: "3",
      icon: Home,
      change: "+1 this month"
    },
    {
      title: "Total Seats",
      value: "85",
      icon: Users,
      change: "+20 this month"
    },
    {
      title: "Active Bookings",
      value: "47",
      icon: Calendar,
      change: "+12 this week"
    },
    {
      title: "Total Revenue",
      value: "₹24,500",
      icon: DollarSign,
      change: "+18% from last month"
    }
  ];

  const [myStudyHalls, setMyStudyHalls] = useState([
    {
      id: 1,
      name: "Central Study Hub",
      description: "Premium study environment with modern amenities",
      location: "Downtown",
      totalSeats: 25,
      occupiedSeats: 18,
      rows: 5,
      seatsPerRow: 5,
      status: "active",
      bookings: 8,
      revenue: "₹12,000",
      seats: []
    },
    {
      id: 2,
      name: "Tech Campus Library",
      description: "High-tech study spaces for technical courses",
      location: "Tech Park",
      totalSeats: 40,
      occupiedSeats: 32,
      rows: 8,
      seatsPerRow: 5,
      status: "active",
      bookings: 12,
      revenue: "₹18,000",
      seats: []
    },
    {
      id: 3,
      name: "Quiet Zone Study",
      description: "Silent study environment for focused learning",
      location: "University Area",
      totalSeats: 20,
      occupiedSeats: 0,
      rows: 4,
      seatsPerRow: 5,
      status: "pending",
      bookings: 0,
      revenue: "₹0",
      seats: []
    }
  ]);

  const handleAddStudyHall = () => {
    setSelectedStudyHall(null);
    setStudyHallModalMode("add");
    setStudyHallModalOpen(true);
  };

  const handleViewStudyHall = (studyHall: any) => {
    setSelectedStudyHall(studyHall);
    setStudyHallModalMode("view");
    setStudyHallModalOpen(true);
  };

  const handleEditStudyHall = (studyHall: any) => {
    setSelectedStudyHall(studyHall);
    setStudyHallModalMode("edit");
    setStudyHallModalOpen(true);
  };

  const handleSaveStudyHall = (studyHallData: any) => {
    if (studyHallModalMode === "add") {
      const newStudyHall = {
        ...studyHallData,
        id: Date.now(),
        bookings: 0,
        occupiedSeats: 0,
        revenue: "₹0"
      };
      setMyStudyHalls([...myStudyHalls, newStudyHall]);
      toast({
        title: "Study Hall Created",
        description: "Your study hall has been successfully created.",
      });
    } else if (studyHallModalMode === "edit") {
      setMyStudyHalls(myStudyHalls.map(studyHall => 
        studyHall.id === studyHallData.id ? studyHallData : studyHall
      ));
      toast({
        title: "Study Hall Updated",
        description: "Your study hall has been successfully updated.",
      });
    }
  };

  const handleDeleteStudyHall = (id: number) => {
    setMyStudyHalls(myStudyHalls.filter(studyHall => studyHall.id !== id));
    toast({
      title: "Study Hall Deleted",
      description: "Your study hall has been successfully deleted.",
      variant: "destructive",
    });
  };

  const recentBookings = [
    {
      id: 1,
      studyHall: "Central Study Hub",
      student: "John Smith",
      seat: "A1",
      date: "2024-01-15",
      duration: "1 week",
      amount: "₹500",
      status: "confirmed"
    },
    {
      id: 2,
      studyHall: "Tech Campus Library",
      student: "Sarah Johnson",
      seat: "B3",
      date: "2024-01-18",
      duration: "1 month",
      amount: "₹1500",
      status: "pending"
    },
    {
      id: 3,
      studyHall: "Central Study Hub",
      student: "Mike Davis",
      seat: "C2",
      date: "2024-01-20",
      duration: "1 day",
      amount: "₹100",
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
            <p className="text-muted-foreground">Manage your study halls and track your business</p>
          </div>
          <Button onClick={handleAddStudyHall}>
            <Plus className="h-4 w-4 mr-2" />
            Create Study Hall
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
          <Tabs defaultValue="studyhalls" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="studyhalls">My Study Halls</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

          {/* Study Halls Tab */}
          <TabsContent value="studyhalls" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Study Halls</h3>
              <Button variant="outline" onClick={handleAddStudyHall}>
                <Plus className="h-4 w-4 mr-2" />
                Create Study Hall
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {myStudyHalls.map((studyHall) => (
                <Card key={studyHall.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-muted-foreground">{studyHall.name}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{studyHall.name}</h4>
                        <p className="text-sm text-muted-foreground">{studyHall.location}</p>
                        <p className="text-xs text-muted-foreground">{studyHall.description}</p>
                      </div>
                      <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                        {studyHall.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Seats</p>
                        <p className="font-semibold">{studyHall.totalSeats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Occupied</p>
                        <p className="font-semibold">{studyHall.occupiedSeats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Layout</p>
                        <p className="font-semibold">{studyHall.rows}×{studyHall.seatsPerRow}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{studyHall.revenue}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditStudyHall(studyHall)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewStudyHall(studyHall)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Layout
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
                            <h4 className="font-semibold">{booking.studyHall}</h4>
                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">{booking.student}</span> • Seat {booking.seat} • {booking.duration}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Booked on: {booking.date}
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
        {activeTab === "studyhalls" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Study Halls</h3>
              <Button variant="outline" onClick={handleAddStudyHall}>
                <Plus className="h-4 w-4 mr-2" />
                Create Study Hall
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {myStudyHalls.map((studyHall) => (
                <Card key={studyHall.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-muted-foreground">{studyHall.name}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{studyHall.name}</h4>
                        <p className="text-sm text-muted-foreground">{studyHall.location}</p>
                        <p className="text-xs text-muted-foreground">{studyHall.description}</p>
                      </div>
                      <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                        {studyHall.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Seats</p>
                        <p className="font-semibold">{studyHall.totalSeats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Occupied</p>
                        <p className="font-semibold">{studyHall.occupiedSeats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Layout</p>
                        <p className="font-semibold">{studyHall.rows}×{studyHall.seatsPerRow}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{studyHall.revenue}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditStudyHall(studyHall)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewStudyHall(studyHall)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Layout
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
                          <h4 className="font-semibold">{booking.studyHall}</h4>
                          <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{booking.student}</span> • Seat {booking.seat} • {booking.duration}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Booked on: {booking.date}
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

        <StudyHallModal
          isOpen={studyHallModalOpen}
          onClose={() => setStudyHallModalOpen(false)}
          onSave={handleSaveStudyHall}
          studyHall={selectedStudyHall}
          mode={studyHallModalMode}
        />
      </div>
    </DashboardSidebar>
  );
};

export default MerchantDashboard;