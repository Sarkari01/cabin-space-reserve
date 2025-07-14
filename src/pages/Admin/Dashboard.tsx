import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Building, DollarSign, TrendingUp, Search, Plus, Eye, Edit, Ban, Shield, Calendar, BarChart3, Activity } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData } from "@/hooks/useAdminData";
import { useBookings } from "@/hooks/useBookings";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { UserModal } from "@/components/admin/UserModal";
import { BannersTab } from "@/components/admin/BannersTab";
import { BusinessSettingsTab } from "@/components/admin/BusinessSettingsTab";
import { TransactionsTab } from "@/components/admin/TransactionsTab";
import { TransactionsManagementTab } from "@/components/admin/TransactionsManagementTab";
import { NewsTab } from "@/components/NewsTab";
import { CommunityTab } from "@/components/CommunityTab";
import { ChatTab } from "@/components/ChatTab";
import { useToast } from "@/hooks/use-toast";
import { BookingDetailModal } from "@/components/BookingDetailModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MerchantDetailModal } from "@/components/admin/MerchantDetailModal";
import { MerchantEditModal } from "@/components/admin/MerchantEditModal";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { RealTimeIndicator } from "@/components/dashboard/RealTimeIndicator";
import UserProfileSettings from "@/components/UserProfileSettings";
import { SubscriptionPlansTab } from "@/components/admin/SubscriptionPlansTab";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { 
    stats, 
    users, 
    merchants, 
    students, 
    studyHalls, 
    loading, 
    createUser, 
    updateUserRole, 
    deleteUser, 
    updateStudyHallStatus 
  } = useAdminData();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { analytics, loading: analyticsLoading, lastUpdate, refreshAnalytics } = useDashboardAnalytics();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [merchantDetailOpen, setMerchantDetailOpen] = useState(false);
  const [merchantEditOpen, setMerchantEditOpen] = useState(false);

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
  }, [user]);

  const { userRole } = useAuth();
  
  // Check if user has admin role
  useEffect(() => {
    if (user && userRole && userRole !== 'admin') {
      window.location.href = "/login";
      return;
    }
  }, [user, userRole]);

  const handleCreateUser = async (userData: any) => {
    setIsSubmitting(true);
    await createUser(userData);
    setIsSubmitting(false);
    setUserModalOpen(false);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleUpdateUser = async (userData: any) => {
    if (selectedUser) {
      setIsSubmitting(true);
      await updateUserRole(selectedUser.id, userData.role);
      setIsSubmitting(false);
      setSelectedUser(null);
      setUserModalOpen(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
  };

  const handleViewMerchant = (merchant: any) => {
    setSelectedMerchant(merchant);
    setMerchantDetailOpen(true);
  };

  const handleEditMerchant = (merchant: any) => {
    setSelectedMerchant(merchant);
    setMerchantEditOpen(true);
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    await deleteUser(merchantId);
  };

  const handleUpdateStudyHallStatus = async (studyHallId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateStudyHallStatus(studyHallId, newStatus);
  };

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

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMerchants = merchants.filter(merchant => 
    merchant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need to be logged in as an admin to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const displayStats = [
    {
      title: "Total Users",
      value: analytics.platformStats?.totalUsers || stats.totalUsers,
      icon: Users,
      trend: { value: 12, label: "from last month" }
    },
    {
      title: "Active Study Halls",
      value: analytics.platformStats?.totalStudyHalls || stats.activeStudyHalls,
      icon: Building,
      trend: { value: 8, label: "this week" }
    },
    {
      title: "Monthly Revenue",
      value: `₹${(analytics.platformStats?.monthlyRevenue || stats.monthlyRevenue).toLocaleString()}`,
      icon: DollarSign,
      trend: { value: analytics.revenueGrowth || 18, label: "from last month" }
    },
    {
      title: "Total Bookings",
      value: analytics.platformStats?.totalBookings || stats.totalBookings,
      icon: TrendingUp,
      trend: { value: 2.4, label: "from last month" }
    }
  ];

  return (
    <>
      <UserModal
        open={userModalOpen}
        onOpenChange={(open) => {
          setUserModalOpen(open);
          if (!open) setSelectedUser(null);
        }}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        user={selectedUser}
        isEdit={!!selectedUser}
        loading={isSubmitting}
      />

      <DashboardSidebar
        userRole="admin" 
        userName={user.email || "Admin"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      >
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
                    <p className="text-muted-foreground">Monitor and manage the entire platform</p>
                  </div>
                  <RealTimeIndicator lastUpdate={lastUpdate} />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {displayStats.map((stat, index) => (
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
                  description="Daily revenue over the last 30 days"
                  data={analytics.bookingsTrend}
                  type="line"
                  dataKey="revenue"
                  trend={analytics.revenueGrowth}
                  value={`₹${analytics.totalRevenue.toLocaleString()}`}
                  onRefresh={refreshAnalytics}
                  loading={analyticsLoading}
                />
                <AnalyticsChart
                  title="Booking Trends"
                  description="Daily bookings over the last 30 days"
                  data={analytics.bookingsTrend}
                  type="bar"
                  dataKey="bookings"
                  onRefresh={refreshAnalytics}
                  loading={analyticsLoading}
                />
              </div>

              {/* User Growth Chart */}
              {analytics.userGrowth && (
                <div className="mb-8">
                  <AnalyticsChart
                    title="User Growth"
                    description="User registrations over the last 30 days"
                    data={analytics.userGrowth}
                    type="line"
                    dataKey="users"
                    onRefresh={refreshAnalytics}
                    loading={analyticsLoading}
                  />
                </div>
              )}

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>Newly registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.slice(0, 3).map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.full_name || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default">
                              {user.role}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Study Halls</CardTitle>
                    <CardDescription>Latest study hall submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studyHalls.slice(0, 3).map((studyHall) => (
                        <div key={studyHall.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{studyHall.name}</p>
                            <p className="text-sm text-muted-foreground">{studyHall.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                              {studyHall.status}
                            </Badge>
                            <p className="text-sm font-medium">₹{studyHall.daily_price}/day</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">User Management</h3>
                <Button onClick={() => setUserModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Users Table */}
              <div className="space-y-4">
                {filteredUsers.map((userData) => (
                  <Card key={userData.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{userData.full_name || 'Anonymous'}</h4>
                            <Badge variant="default">
                              {userData.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined: {new Date(userData.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(userData)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Ban className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this user? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(userData.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Merchants Tab */}
          {activeTab === "merchants" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">Merchant Management</h3>
                <Button onClick={() => setUserModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Merchant
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchants by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredMerchants.map((merchant) => (
                  <Card key={merchant.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{merchant.full_name || 'Anonymous'}</h4>
                            <Badge variant="default">
                              {merchant.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{merchant.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Study Halls: {studyHalls.filter(sh => sh.merchant_id === merchant.id).length} • 
                            Joined: {new Date(merchant.created_at).toLocaleDateString()}
                          </p>
                        </div>
                         <div className="flex space-x-2">
                           <Button variant="outline" size="sm" onClick={() => handleViewMerchant(merchant)}>
                             <Eye className="h-4 w-4 mr-1" />
                             View
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleEditMerchant(merchant)}>
                             <Edit className="h-4 w-4 mr-1" />
                             Edit
                           </Button>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button variant="outline" size="sm">
                                 <Ban className="h-4 w-4 mr-1" />
                                 Delete
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Delete Merchant</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Are you sure you want to delete this merchant? This will also delete all their study halls.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(merchant.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Study Halls Tab */}
          {activeTab === "studyhalls" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">Study Hall Management</h3>
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
                          <p className="text-sm text-muted-foreground">
                            Owner: {studyHall.owner?.full_name || studyHall.owner?.email || 'Unknown'}
                          </p>
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
                          <p className="text-sm text-muted-foreground">Rows</p>
                          <p className="font-semibold">{studyHall.rows}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Daily Rate</p>
                          <p className="font-semibold">₹{studyHall.daily_price}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Rate</p>
                          <p className="font-semibold">₹{studyHall.monthly_price}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View Layout
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant={studyHall.status === "active" ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => handleUpdateStudyHallStatus(studyHall.id, studyHall.status)}
                        >
                          {studyHall.status === "active" ? "Disable" : "Approve"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">All Platform Bookings</h3>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    Export Data
                  </Button>
                  <Button variant="outline">
                    Filters
                  </Button>
                </div>
              </div>
              
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking, index) => (
                    <Card key={booking.id} className="animate-fade-in hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-semibold">{booking.study_hall?.name || 'Study Hall'}</h4>
                              <Badge variant={getStatusColor(booking.status)}>
                                {booking.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{booking.user?.full_name || booking.user?.email}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Building className="h-4 w-4" />
                                <span>{booking.study_hall?.location}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Seat {booking.seat?.seat_id} ({booking.seat?.row_name}{booking.seat?.seat_number})</span>
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>Booking ID: {booking.id.substring(0, 8)}...</div>
                              <div>
                                <span>Period: {formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span> • 
                                <span className="ml-2">Duration: {booking.booking_period}</span>
                              </div>
                              <div>Created: {formatDate(booking.created_at)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold mb-2">₹{Number(booking.total_amount).toLocaleString()}</p>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewBookingDetails(booking)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={actionLoading}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Manage
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
                  <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                  <p>Platform bookings will appear here once users start booking study halls</p>
                </div>
              )}
            </div>
          )}

          {/* Banners Tab */}
          {activeTab === "banners" && <BannersTab />}
          
          {/* Business Settings Tab */}
          {activeTab === "business" && <BusinessSettingsTab />}
          
          {/* Transactions Tab */}
          {activeTab === "transactions" && <TransactionsManagementTab />}
          
          {/* News Tab */}
          {activeTab === "news" && <NewsTab userRole="admin" />}
          
          {/* Community Tab */}
          {activeTab === "community" && <CommunityTab />}
          
          {/* Chat Tab */}
          {activeTab === "chat" && <ChatTab userRole="admin" />}

          {/* Subscription Plans Tab */}
          {activeTab === "subscription-plans" && <SubscriptionPlansTab />}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Profile Settings</h3>
              <UserProfileSettings />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Analytics & Reports</h3>
              
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Analytics</CardTitle>
                    <CardDescription>Platform revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Revenue Chart Placeholder</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New user registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">User Growth Chart Placeholder</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Booking Trends</CardTitle>
                    <CardDescription>Platform booking patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Booking Chart Placeholder</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Popular Locations</CardTitle>
                    <CardDescription>Most booked study hall locations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Location Chart Placeholder</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardSidebar>

      <BookingDetailModal
        open={bookingDetailOpen}
        onOpenChange={setBookingDetailOpen}
        booking={selectedBooking}
        userRole="admin"
        loading={actionLoading}
      />

      <MerchantDetailModal
        open={merchantDetailOpen}
        onOpenChange={setMerchantDetailOpen}
        merchant={selectedMerchant}
        studyHalls={studyHalls}
      />

      <MerchantEditModal
        open={merchantEditOpen}
        onOpenChange={setMerchantEditOpen}
        merchant={selectedMerchant}
        onSuccess={() => {
          setMerchantEditOpen(false);
          setSelectedMerchant(null);
          // The useAdminData hook should automatically refetch
        }}
      />
    </>
  );
};

export default AdminDashboard;