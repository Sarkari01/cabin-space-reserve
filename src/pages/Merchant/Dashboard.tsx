import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Home, Calendar, Users, DollarSign, Star, LogOut, BarChart3, Eye, Edit, Filter, Download, Phone, Mail, User, Clock, TrendingUp, Power, PowerOff, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { EnhancedStudyHallCreationModal } from "@/components/study-hall/EnhancedStudyHallCreationModal";
import { StudyHallTestHelper } from "@/components/study-hall/StudyHallTestHelper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BannerCarousel } from "@/components/BannerCarousel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStudyHalls } from "@/hooks/useStudyHalls";
import { useMerchantBookings } from "@/hooks/useMerchantBookings";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { UnifiedBookingDetailModal } from "@/components/UnifiedBookingDetailModal";
import { BookingEditModal } from "@/components/BookingEditModal";
import { NewsTab } from "@/components/NewsTab";
import { CommunityTab } from "@/components/CommunityTab";
import { ChatTab } from "@/components/ChatTab";
import { MerchantTransactionsTab } from "@/components/merchant/MerchantTransactionsTab";
import { MerchantSubscriptionTab } from "@/components/merchant/MerchantSubscriptionTab";
import { MerchantSubscriptionTransactionsTab } from "@/components/merchant/MerchantSubscriptionTransactionsTab";
import { MerchantSettlementsTab } from "@/components/merchant/MerchantSettlementsTab";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { RealTimeIndicator } from "@/components/dashboard/RealTimeIndicator";
import { BookingLifecycleManager } from "@/components/BookingLifecycleManager";
import UserProfileSettings from "@/components/UserProfileSettings";
import { SeatSynchronizer } from "@/components/SeatSynchronizer";
import { CouponsTab as MerchantCouponsTab } from "@/components/merchant/CouponsTab";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { InchargeManagementTab } from "@/components/merchant/InchargeManagementTab";
import { MerchantReviewsTab } from "@/components/merchant/MerchantReviewsTab";
import { MerchantReportsTab } from "@/components/reports/MerchantReportsTab";
import { PrivateHallsTab } from "@/components/merchant/PrivateHallsTab";

const MerchantDashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { studyHalls, loading, createStudyHall, updateStudyHall, deleteStudyHall, toggleStudyHallStatus, fetchStudyHalls } = useStudyHalls();
  const { bookings, loading: bookingsLoading, fetchMerchantBookings, updateMerchantBookingStatus } = useMerchantBookings();
  const { analytics, loading: analyticsLoading, lastUpdate, refreshAnalytics } = useDashboardAnalytics();
  const { limits, checkStudyHallCreationLimit } = useSubscriptionLimits();
  
  const [studyHallModalOpen, setStudyHallModalOpen] = useState(false);
  // Simplified modal state for creation only
  const [selectedStudyHall, setSelectedStudyHall] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [bookingEditOpen, setBookingEditOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [searchUser, setSearchUser] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Handle navigation state for booking refresh
  useEffect(() => {
    const navigationState = location.state as any;
    if (navigationState?.refreshBookings) {
      console.log("Merchant dashboard: Refresh triggered from navigation state");
      fetchMerchantBookings();
      
      // Switch to bookings tab if requested
      if (navigationState?.activeTab) {
        setActiveTab(navigationState.activeTab);
      }

      // Clear the navigation state to prevent repeated refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchMerchantBookings]);

  // Enhanced user validation
  useEffect(() => {
    if (user) {
      console.log("Current user in merchant dashboard:", {
        id: user.id,
        email: user.email,
        role: userRole
      });
    }
  }, [user, userRole]);

  // Enhanced loading state with user validation
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Redirecting to authentication...</div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Study Halls",
      value: analytics.merchantStats?.totalStudyHalls || studyHalls.length,
      icon: Home,
      trend: { value: 5, label: "this month" }
    },
    {
      title: "Total Seats",
      value: analytics.merchantStats?.totalSeats || studyHalls.reduce((acc, hall) => acc + hall.total_seats, 0),
      icon: Users,
      trend: { value: 12, label: "this month" }
    },
    {
      title: "Active Study Halls",
      value: analytics.merchantStats?.activeStudyHalls || studyHalls.filter(hall => hall.status === 'active').length,
      icon: Calendar,
      trend: { value: 8, label: "this week" }
    },
    {
      title: "Monthly Earnings",
      value: `₹${(analytics.merchantStats?.monthlyEarnings || analytics.totalRevenue).toLocaleString()}`,
      icon: DollarSign,
      trend: { value: analytics.revenueGrowth || 15, label: "from last month" }
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading dashboard data...</div>
      </div>
    );
  }

  const handleAddStudyHall = () => {
    setStudyHallModalOpen(true);
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

  const handleViewBookingDetails = (booking: any) => {
    setSelectedBooking(booking);
    setBookingDetailOpen(true);
  };

  const handleConfirmBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const success = await updateMerchantBookingStatus(bookingId, 'confirmed');
      if (success) {
        await fetchMerchantBookings();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const success = await updateMerchantBookingStatus(bookingId, 'cancelled');
      if (success) {
        await fetchMerchantBookings();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBooking = (booking: any) => {
    setSelectedBooking(booking);
    setBookingEditOpen(true);
  };

  const handleSaveBooking = async (bookingId: string, updates: any) => {
    setActionLoading(true);
    // Note: Update booking functionality would need to be implemented in useMerchantBookings
    toast({
      title: "Feature Note",
      description: "Booking editing will be implemented in future update", 
      variant: "default",
    });
    setActionLoading(false);
    return true;
  };

  // Filter bookings based on criteria
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
    const matchesUser = !searchUser || 
      (booking.user?.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
       booking.user?.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
       booking.booking_number?.toString().includes(searchUser));
    
    let matchesDate = true;
    if (filterDateFrom) {
      matchesDate = matchesDate && new Date(booking.start_date) >= new Date(filterDateFrom);
    }
    if (filterDateTo) {
      matchesDate = matchesDate && new Date(booking.start_date) <= new Date(filterDateTo);
    }
    
    return matchesStatus && matchesUser && matchesDate;
  });

  const handleExportBookings = () => {
    // Create CSV content
    const headers = ["Booking ID", "User Name", "Email", "Study Hall", "Seat", "Period", "Start Date", "End Date", "Amount", "Status", "Created"];
    const csvData = filteredBookings.map(booking => [
      booking.booking_number ? `B${booking.booking_number}` : 'Pending',
      booking.user?.full_name || booking.guest_name || 'N/A',
      booking.user?.email || booking.guest_email || 'N/A', 
      booking.location_name || 'N/A',
      booking.unit_name || 'N/A',
      booking.booking_type || 'N/A',
      formatDate(booking.start_date),
      formatDate(booking.end_date),
      Number(booking.total_amount).toLocaleString(),
      booking.status,
      formatDate(booking.created_at)
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `bookings-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Export Successful",
      description: "Booking data has been exported to CSV",
    });
  };

  return (
    <>
      <BookingLifecycleManager />
      <SeatSynchronizer onSeatUpdate={() => {
        // Refresh study halls when seat updates occur
        fetchStudyHalls();
      }} />
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Merchant Dashboard
                  {userRole === "admin" && (
                    <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                      Admin View
                    </span>
                  )}
                </h2>
                <p className="text-muted-foreground">Welcome back, {user?.email || 'Merchant'}</p>
              </div>
              <RealTimeIndicator lastUpdate={lastUpdate} />
            </div>
          </div>
          <Button onClick={handleAddStudyHall}>
            <Plus className="h-4 w-4 mr-2" />
            Create Study Hall
          </Button>
        </div>

        {/* Stats Cards - Show only on overview tab */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-2 lg:col-span-1">
                <SubscriptionStatusCard />
              </div>
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value.toString()}
                  icon={stat.icon}
                  trend={stat.trend}
                  loading={analyticsLoading}
                />
              ))}
            </div>

            {/* Analytics Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <AnalyticsChart
                title="Revenue Trend"
                description="Daily earnings over the last 30 days"
                data={analytics.bookingsTrend}
                type="line"
                dataKey="revenue"
                trend={analytics.revenueGrowth}
                value={`₹${analytics.totalRevenue.toLocaleString()}`}
                onRefresh={refreshAnalytics}
                loading={analyticsLoading}
              />
              {analytics.studyHallPerformance && (
                <AnalyticsChart
                  title="Study Hall Performance"
                  description="Revenue by study hall"
                  data={analytics.studyHallPerformance}
                  type="bar"
                  dataKey="revenue"
                  xAxisKey="name"
                  onRefresh={refreshAnalytics}
                  loading={analyticsLoading}
                />
              )}
            </div>
          </>
        )}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <MerchantCouponsTab />
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <MerchantReviewsTab />
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <MerchantReportsTab />
        )}

        {/* Private Halls Tab */}
        {activeTab === "privatehalls" && (
          <PrivateHallsTab />
        )}

        {/* Main Content based on active tab */}
        {activeTab === "overview" && (
          <Tabs defaultValue="studyhalls" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="studyhalls">My Study Halls</TabsTrigger>
              <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
              <TabsTrigger value="history">Booking History</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
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
                      <div className="flex items-center space-x-2">
                        <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                          {studyHall.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStudyHallStatus(studyHall.id, studyHall.status)}
                          className="h-8 w-8 p-0"
                          title={studyHall.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {studyHall.status === "active" ? (
                            <PowerOff className="h-4 w-4 text-destructive" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Seats</p>
                        <p className="font-semibold">{studyHall.total_seats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Rate</p>
                        <p className="font-semibold">₹{studyHall.monthly_price}</p>
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
                    
                    {/* Amenities */}
                    {studyHall.amenities && studyHall.amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-1">
                          {studyHall.amenities.slice(0, 4).map((amenity, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {studyHall.amenities.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{studyHall.amenities.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled
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

        <TabsContent value="testing" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Development Testing</h2>
              <p className="text-muted-foreground">Test study hall creation functionality</p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Dev Mode
            </Badge>
          </div>
          
          <StudyHallTestHelper />
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
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          {/* User Details */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Customer</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="font-medium">{booking.user?.full_name || 'N/A'}</div>
                              <div className="text-muted-foreground text-xs">{booking.user?.email}</div>
                              <Badge variant="outline" className="text-xs">
                                {booking.booking_type?.toUpperCase() || 'BOOKING'}
                              </Badge>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Booking</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="font-medium">{booking.location_name || 'Location'}</div>
                              <div className="text-muted-foreground">
                                {booking.booking_type === 'study_hall' ? 'Seat' : 'Cabin'} {booking.unit_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                              </div>
                            </div>
                          </div>

                          {/* Status & Payment */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Payment</span>
                            </div>
                            <div className="space-y-1">
                              <div className="text-lg font-bold">₹{Number(booking.total_amount).toLocaleString()}</div>
                              <Badge variant={getStatusColor(booking.status)} className="text-xs">
                                {(booking.status || 'pending').toUpperCase()}
                              </Badge>
                              <Badge variant={booking.status === 'confirmed' || booking.status === 'completed' ? 'default' : 'secondary'} className="text-xs ml-1">
                                {booking.status === 'confirmed' || booking.status === 'completed' ? 'PAID' : 'PENDING'}
                              </Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Actions</span>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewBookingDetails(booking)}
                                className="w-full"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditBooking(booking)}
                                className="w-full"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              {booking.status === 'pending' && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleConfirmBooking(booking.id)}
                                  disabled={actionLoading}
                                  className="w-full"
                                >
                                  {actionLoading ? "Confirming..." : "Confirm"}
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created: {formatDate(booking.created_at)}
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

          {/* Booking History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Booking History</h3>
              <Button onClick={handleExportBookings} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Bookings</label>
                  <Input
                    placeholder="Search by booking #, name, or email"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {filteredBookings.length} of {bookings.length} bookings</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setSearchUser("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>

            {/* Booking List */}
            {bookingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User Details Section */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Customer Details</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium">{booking.user?.full_name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span className="font-medium text-xs">{booking.user?.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Booking ID:</span>
                              <span className="font-mono text-xs">#{booking.booking_number ? `B${booking.booking_number}` : 'Pending'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Details Section */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Booking Details</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium">{booking.location_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">{booking.booking_type === 'study_hall' ? 'Seat' : 'Cabin'}:</span>
                              <span className="font-medium">{booking.unit_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Type:</span>
                              <span className="font-medium capitalize">{booking.booking_type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Dates:</span>
                              <span className="font-medium text-xs">{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment & Status Section */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Payment & Status</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="font-bold text-lg">₹{Number(booking.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={getStatusColor(booking.status)}>
                                {(booking.status || 'pending').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Payment:</span>
                              <Badge variant={booking.status === 'confirmed' || booking.status === 'completed' ? 'default' : 'secondary'}>
                                {booking.status === 'confirmed' || booking.status === 'completed' ? 'PAID' : 'PENDING'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span className="font-medium text-xs">{formatDate(booking.created_at)}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewBookingDetails(booking)}
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditBooking(booking)}
                              className="flex-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No bookings found</p>
                <p className="text-sm">Try adjusting your filters to see more results</p>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Users</h3>
              <div className="text-sm text-muted-foreground">
                Users who have booked in your study halls
              </div>
            </div>

            {/* User Filters */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Users</label>
                  <Input
                    placeholder="Search by name or email"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setFilterStatus("all");
                      setSearchUser("");
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>

            {/* Users List */}
            {bookingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {/* Group bookings by user */}
                {Object.entries(
                  filteredBookings.reduce((acc, booking) => {
                    const userId = booking.user_id;
                    if (!acc[userId]) {
                      acc[userId] = {
                        user: booking.user,
                        bookings: []
                      };
                    }
                    acc[userId].bookings.push(booking);
                    return acc;
                  }, {} as Record<string, { user: any; bookings: any[] }>)
                ).map(([userId, userData]) => (
                  <Card key={userId} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* User Info */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">User Information</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Name:</span>
                              <p className="font-medium">{userData.user?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <p className="font-medium text-xs">{userData.user?.email}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Bookings:</span>
                              <p className="font-bold text-lg">{userData.bookings.length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Latest Booking */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">Latest Booking</span>
                          </div>
                          {userData.bookings.length > 0 && (
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Study Hall:</span>
                                <p className="font-medium">{userData.bookings[0].study_hall?.name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Seat:</span>
                                <p className="font-medium">{userData.bookings[0].seat?.seat_id}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p className="font-medium">{formatDate(userData.bookings[0].start_date)}</p>
                              </div>
                              <Badge variant={getStatusColor(userData.bookings[0].status)} className="text-xs">
                                {(userData.bookings[0].status || 'pending').toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Statistics */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">Statistics</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Spent:</span>
                              <p className="font-bold text-lg">₹{userData.bookings.reduce((sum, booking) => sum + Number(booking.total_amount), 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Active Bookings:</span>
                              <p className="font-medium">{userData.bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Completed:</span>
                              <p className="font-medium">{userData.bookings.filter(b => b.status === 'completed').length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">Actions</span>
                          </div>
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                // Set filter to show only this user's bookings in history tab
                                setSearchUser(userData.user?.email || '');
                                setActiveTab("overview");
                                // Switch to history tab
                                setTimeout(() => {
                                  const historyTab = document.querySelector('[value="history"]') as HTMLElement;
                                  historyTab?.click();
                                }, 100);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View All Bookings
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                if (userData.bookings.length > 0) {
                                  handleViewBookingDetails(userData.bookings[0]);
                                }
                              }}
                            >
                              <User className="h-3 w-3 mr-1" />
                              Latest Booking Details
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Member since: {formatDate(userData.bookings[userData.bookings.length - 1]?.created_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No users found</p>
                <p className="text-sm">Users who book in your study halls will appear here</p>
              </div>
            )}
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
        {activeTab === "news" && (
          <NewsTab userRole="merchant" />
        )}

        {activeTab === "community" && (
          <CommunityTab userRole="merchant" />
        )}

        {activeTab === "chat" && (
          <ChatTab userRole="merchant" />
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Profile Settings</h3>
            <UserProfileSettings />
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Users</h3>
              <div className="text-sm text-muted-foreground">
                Users who have booked in your study halls
              </div>
            </div>

            {/* User Filters */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Users</label>
                  <Input
                    placeholder="Search by name or email"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setFilterStatus("all");
                      setSearchUser("");
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>

            {/* Users List */}
            {bookingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {/* Group bookings by user */}
                {Object.entries(
                  filteredBookings.reduce((acc, booking) => {
                    const userId = booking.user_id;
                    if (!acc[userId]) {
                      acc[userId] = {
                        user: booking.user,
                        bookings: []
                      };
                    }
                    acc[userId].bookings.push(booking);
                    return acc;
                  }, {} as Record<string, { user: any; bookings: any[] }>)
                ).map(([userId, userData]) => (
                  <Card key={userId} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* User Info */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">User Information</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Name:</span>
                              <p className="font-medium">{userData.user?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <p className="font-medium text-xs">{userData.user?.email}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Bookings:</span>
                              <p className="font-bold text-lg">{userData.bookings.length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Latest Booking */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">Latest Booking</span>
                          </div>
                          {userData.bookings.length > 0 && (
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Study Hall:</span>
                                <p className="font-medium">{userData.bookings[0].study_hall?.name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Seat:</span>
                                <p className="font-medium">{userData.bookings[0].seat?.seat_id}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p className="font-medium">{formatDate(userData.bookings[0].start_date)}</p>
                              </div>
                              <Badge variant={getStatusColor(userData.bookings[0].status)} className="text-xs">
                                {(userData.bookings[0].status || 'pending').toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Statistics */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">Statistics</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Spent:</span>
                              <p className="font-bold text-lg">₹{userData.bookings.reduce((sum, booking) => sum + Number(booking.total_amount), 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Active Bookings:</span>
                              <p className="font-medium">{userData.bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Completed:</span>
                              <p className="font-medium">{userData.bookings.filter(b => b.status === 'completed').length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">Actions</span>
                          </div>
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                // Set filter to show only this user's bookings in history tab
                                setSearchUser(userData.user?.email || '');
                                setActiveTab("overview");
                                // Switch to history tab
                                setTimeout(() => {
                                  const historyTab = document.querySelector('[value="history"]') as HTMLElement;
                                  historyTab?.click();
                                }, 100);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View All Bookings
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                if (userData.bookings.length > 0) {
                                  handleViewBookingDetails(userData.bookings[0]);
                                }
                              }}
                            >
                              <User className="h-3 w-3 mr-1" />
                              Latest Booking Details
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Member since: {formatDate(userData.bookings[userData.bookings.length - 1]?.created_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No users found</p>
                <p className="text-sm">Users who book in your study halls will appear here</p>
              </div>
            )}
          </div>
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
                      <div className="flex items-center space-x-2">
                        <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                          {studyHall.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStudyHallStatus(studyHall.id, studyHall.status)}
                          className="h-8 w-8 p-0"
                          title={studyHall.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {studyHall.status === "active" ? (
                            <PowerOff className="h-4 w-4 text-destructive" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Seats</p>
                        <p className="font-semibold">{studyHall.total_seats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Rate</p>
                        <p className="font-semibold">₹{studyHall.monthly_price}</p>
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
                    
                    {/* Amenities */}
                    {studyHall.amenities && studyHall.amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-1">
                          {studyHall.amenities.slice(0, 4).map((amenity, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {studyHall.amenities.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{studyHall.amenities.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled
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
                              <h4 className="font-semibold">{booking.location_name || 'Location'}</h4>
                              <Badge variant={getStatusColor(booking.status)}>
                                {(booking.status || 'pending').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">{booking.user?.full_name || booking.guest_name || booking.user?.email || booking.guest_email}</span> • 
                              {booking.booking_type === 'study_hall' ? 'Seat' : 'Cabin'} {booking.unit_name} • 
                              {booking.booking_type} booking
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>Booking #{booking.booking_number ? `B${booking.booking_number}` : 'Pending'}</div>
                              <div>Period: {formatDate(booking.start_date)} - {formatDate(booking.end_date)}</div>
                              <div>Created: {formatDate(booking.created_at)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">₹{Number(booking.total_amount).toLocaleString()}</p>
                            <div className="flex space-x-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewBookingDetails(booking)}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditBooking(booking)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              {booking.status === 'pending' && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleConfirmBooking(booking.id)}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? "Confirming..." : "Confirm"}
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

        {activeTab === "subscriptions" && (
          <MerchantSubscriptionTab />
        )}

        {activeTab === "subscription-transactions" && (
          <MerchantSubscriptionTransactionsTab />
        )}

        {activeTab === "transactions" && (
          <MerchantTransactionsTab />
        )}

        {activeTab === "settlements" && (
          <ErrorBoundary fallback={
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Unable to load settlements data. Please try refreshing the page.</p>
            </div>
          }>
            <MerchantSettlementsTab />
          </ErrorBoundary>
        )}

        {activeTab === "incharges" && (
          <InchargeManagementTab />
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

        <ErrorBoundary>
          <EnhancedStudyHallCreationModal
            open={studyHallModalOpen}
            onOpenChange={setStudyHallModalOpen}
            onSuccess={() => {
              fetchStudyHalls();
              refreshAnalytics();
            }}
          />
        </ErrorBoundary>

        {/* Booking Detail Modal */}
        <UnifiedBookingDetailModal
          open={bookingDetailOpen}
          onOpenChange={setBookingDetailOpen}
          booking={selectedBooking ? (
            selectedBooking.booking_type === 'cabin'
              ? {
                  id: selectedBooking.id,
                  booking_number: selectedBooking.booking_number,
                  type: 'cabin',
                  user_id: selectedBooking.user_id || null,
                  location_id: '',
                  unit_id: '',
                  start_date: selectedBooking.start_date,
                  end_date: selectedBooking.end_date,
                  total_amount: selectedBooking.total_amount,
                  status: selectedBooking.status,
                  payment_status: selectedBooking.payment_status,
                  created_at: selectedBooking.created_at,
                  updated_at: selectedBooking.updated_at,
                  user: selectedBooking.user ? { full_name: selectedBooking.user.full_name, email: selectedBooking.user.email, phone: selectedBooking.user.phone } : undefined,
                  guest_name: selectedBooking.guest_name,
                  guest_email: selectedBooking.guest_email,
                  guest_phone: selectedBooking.guest_phone,
                  is_vacated: selectedBooking.is_vacated,
                  // Provide related data for display
                  location: {
                    name: selectedBooking.location_name,
                    location: selectedBooking.location_address || ''
                  },
                  unit: {
                    name: selectedBooking.unit_name,
                    identifier: selectedBooking.unit_name
                  },
                  // Extra fields for deposit breakdown and QR
                  booking_amount: selectedBooking.booking_amount,
                  deposit_amount: selectedBooking.deposit_amount,
                  deposit_refunded: selectedBooking.deposit_refunded,
                  months_booked: selectedBooking.months_booked,
                  monthly_amount: selectedBooking.monthly_amount
                } as any
              : {
                  id: selectedBooking.id,
                  booking_number: selectedBooking.booking_number,
                  user_id: selectedBooking.user_id || null,
                  study_hall_id: '',
                  seat_id: '',
                  start_date: selectedBooking.start_date,
                  end_date: selectedBooking.end_date,
                  total_amount: selectedBooking.total_amount,
                  status: selectedBooking.status,
                  payment_status: selectedBooking.payment_status,
                  created_at: selectedBooking.created_at,
                  updated_at: selectedBooking.updated_at,
                  guest_name: selectedBooking.guest_name,
                  guest_email: selectedBooking.guest_email,
                  guest_phone: selectedBooking.guest_phone,
                  user: selectedBooking.user ? { full_name: selectedBooking.user.full_name, email: selectedBooking.user.email, phone: selectedBooking.user.phone } : undefined,
                  study_hall: {
                    name: selectedBooking.location_name,
                    location: selectedBooking.location_address || '',
                    image_url: selectedBooking.location_image_url || ''
                  },
                  seat: {
                    seat_id: selectedBooking.seat_id || selectedBooking.unit_name,
                    row_name: selectedBooking.seat_row_name || '',
                    seat_number: selectedBooking.seat_number || 0
                  }
                } as any
          ) : null}
          userRole={userRole === "admin" ? "admin" : "merchant"}
          onConfirm={handleConfirmBooking}
          onCancel={handleCancelBooking}
          onEdit={handleEditBooking}
          loading={actionLoading}
        />

        {/* Booking Edit Modal */}
        <BookingEditModal
          open={bookingEditOpen}
          onOpenChange={setBookingEditOpen}
          booking={selectedBooking}
          onSave={handleSaveBooking}
          loading={actionLoading}
        />
      </div>
    </DashboardSidebar>
    </>
  );
};

export default MerchantDashboard;