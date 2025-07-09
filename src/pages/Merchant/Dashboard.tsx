import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, Calendar, Users, DollarSign, Star, LogOut, BarChart3, Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { StudyHallModal } from "@/components/StudyHallModal";
import { BannerCarousel } from "@/components/BannerCarousel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStudyHalls } from "@/hooks/useStudyHalls";
import { useBookings } from "@/hooks/useBookings";

const MerchantDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { studyHalls, loading, createStudyHall, updateStudyHall, deleteStudyHall } = useStudyHalls();
  const { bookings, loading: bookingsLoading } = useBookings();
  
  const [studyHallModalOpen, setStudyHallModalOpen] = useState(false);
  const [studyHallModalMode, setStudyHallModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedStudyHall, setSelectedStudyHall] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const stats = [
    {
      title: "Total Study Halls",
      value: studyHalls.length.toString(),
      icon: Home,
      change: "+1 this month"
    },
    {
      title: "Total Seats",
      value: studyHalls.reduce((acc, hall) => acc + hall.total_seats, 0).toString(),
      icon: Users,
      change: "+20 this month"
    },
    {
      title: "Active Study Halls",
      value: studyHalls.filter(hall => hall.status === 'active').length.toString(),
      icon: Calendar,
      change: "+12 this week"
    },
    {
      title: "Total Revenue",
      value: "₹" + studyHalls.reduce((acc, hall) => acc + (hall.daily_price * hall.total_seats), 0).toLocaleString(),
      icon: DollarSign,
      change: "+15% this month"
    }
  ];

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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

  const handleSaveStudyHall = async (studyHallData: any) => {
    if (studyHallModalMode === "add") {
      await createStudyHall(studyHallData);
    } else if (studyHallModalMode === "edit") {
      await updateStudyHall(studyHallData.id, studyHallData);
    }
  };

  const handleDeleteStudyHall = async (id: string) => {
    await deleteStudyHall(id);
  };

  // Format booking data for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
        <DashboardSidebar 
          userRole="merchant" 
          userName={user?.email || 'Merchant'}
          onTabChange={setActiveTab}
          activeTab={activeTab}
        >
      <div className="p-6">
        {/* Banner Carousel */}
        <BannerCarousel targetAudience="merchant" className="mb-6" />

        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Merchant Dashboard</h2>
            <p className="text-muted-foreground">Welcome back, {user?.email || 'Merchant'}</p>
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
              {studyHalls.map((studyHall) => (
                <Card key={studyHall.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {studyHall.image_url ? (
                      <img 
                        src={studyHall.image_url} 
                        alt={studyHall.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-muted-foreground">{studyHall.name}</span>
                      </div>
                    )}
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
                        <p className="font-semibold">{studyHall.total_seats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Daily Rate</p>
                        <p className="font-semibold">₹{studyHall.daily_price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Layout</p>
                        <p className="font-semibold">{studyHall.rows}×{studyHall.seats_per_row}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Row Names</p>
                        <p className="font-semibold text-xs">{studyHall.custom_row_names.slice(0, 3).join(', ')}{studyHall.custom_row_names.length > 3 ? '...' : ''}</p>
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
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking, index) => (
                    <Card key={booking.id} className="animate-fade-in hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{booking.study_hall?.name || 'Study Hall'}</h4>
                              <Badge variant={getStatusColor(booking.status)}>
                                {booking.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">{booking.user?.full_name || booking.user?.email}</span> • 
                              Seat {booking.seat?.seat_id} ({booking.seat?.row_name}{booking.seat?.seat_number}) • 
                              {booking.booking_period} booking
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>Booking ID: {booking.id.substring(0, 8)}...</div>
                              <div>Period: {formatDate(booking.start_date)} - {formatDate(booking.end_date)}</div>
                              <div>Created: {formatDate(booking.created_at)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">₹{Number(booking.total_amount).toLocaleString()}</p>
                            <div className="flex space-x-2 mt-2">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              {booking.status === 'pending' && (
                                <Button variant="default" size="sm">
                                  Confirm
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                  <p className="text-sm">Bookings for your study halls will appear here</p>
                </div>
              )}
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
              {studyHalls.map((studyHall) => (
                <Card key={studyHall.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {studyHall.image_url ? (
                      <img 
                        src={studyHall.image_url} 
                        alt={studyHall.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-muted-foreground">{studyHall.name}</span>
                      </div>
                    )}
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
                        <p className="font-semibold">{studyHall.total_seats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Daily Rate</p>
                        <p className="font-semibold">₹{studyHall.daily_price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Layout</p>
                        <p className="font-semibold">{studyHall.rows}×{studyHall.seats_per_row}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Row Names</p>
                        <p className="font-semibold text-xs">{studyHall.custom_row_names.slice(0, 3).join(', ')}{studyHall.custom_row_names.length > 3 ? '...' : ''}</p>
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
            <div>
              <h3 className="text-xl font-semibold mb-4">All Bookings</h3>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{booking.study_hall?.name || 'Study Hall'}</h4>
                              <Badge variant={getStatusColor(booking.status)}>
                                {booking.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">{booking.user?.full_name || booking.user?.email}</span> • 
                              Seat {booking.seat?.seat_id} ({booking.seat?.row_name}{booking.seat?.seat_number}) • 
                              {booking.booking_period} booking
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>Booking ID: {booking.id.substring(0, 8)}...</div>
                              <div>Period: {formatDate(booking.start_date)} - {formatDate(booking.end_date)}</div>
                              <div>Created: {formatDate(booking.created_at)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">₹{Number(booking.total_amount).toLocaleString()}</p>
                            <div className="flex space-x-2 mt-2">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              {booking.status === 'pending' && (
                                <Button variant="default" size="sm">
                                  Confirm
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                  <p className="text-sm">Bookings for your study halls will appear here</p>
                </div>
              )}
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