import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Building, DollarSign, TrendingUp, Search, Plus, Eye, Edit, Ban, Shield, Calendar, BarChart3, Phone, Headphones, Banknote, AlertCircle } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData } from "@/hooks/useAdminData";
import { useBookings } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { UserModal } from "@/components/admin/UserModal";
import { BannersTab } from "@/components/admin/BannersTab";
import { BusinessSettingsTab } from "@/components/admin/BusinessSettingsTab";
import { TransactionsTab } from "@/components/admin/TransactionsTab";
import { TransactionsManagementTab } from "@/components/admin/TransactionsManagementTab";
import { AdminSubscriptionTransactionsTab } from "@/components/admin/AdminSubscriptionTransactionsTab";
import { NewsTab } from "@/components/NewsTab";
import { CommunityTab } from "@/components/CommunityTab";
import { ChatTab } from "@/components/ChatTab";
import { useToast } from "@/hooks/use-toast";
import { BookingDetailModal } from "@/components/BookingDetailModal";
import { BookingEditModal } from "@/components/BookingEditModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MerchantDetailModal } from "@/components/admin/MerchantDetailModal";
import { MerchantEditModal } from "@/components/admin/MerchantEditModal";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { RealTimeIndicator } from "@/components/dashboard/RealTimeIndicator";
import UserProfileSettings from "@/components/UserProfileSettings";
import { SubscriptionPlansTab } from "@/components/admin/SubscriptionPlansTab";
import { MerchantSubscriptionManagementTab } from "@/components/admin/MerchantSubscriptionManagementTab";
import EKQRRecoveryTab from "@/components/admin/EKQRRecoveryTab";
import { RewardsTab } from "@/components/admin/RewardsTab";
import { RewardsSettingsTab } from "@/components/admin/RewardsSettingsTab";
import { CouponsTab } from "@/components/admin/CouponsTab";
import { MerchantVerificationTab } from "@/components/admin/MerchantVerificationTab";
import { InchargesTab } from "@/components/admin/InchargesTab";
import { SettlementsTab } from "@/components/admin/SettlementsTab";
import { PageHeader } from "@/components/PageHeader";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { LoadingSpinner, LoadingOverlay } from "@/components/ui/loading";
import { RealTimeManager } from "@/components/RealTimeManager";
import { NotificationCenter } from "@/components/NotificationCenter";
import { EnhancedAnalytics } from "@/components/EnhancedAnalytics";
import { useOperationalUsers } from "@/hooks/useOperationalUsers";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useSupportTickets } from "@/hooks/useSupportTickets";


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
  const { bookings, loading: bookingsLoading, fetchBookings } = useBookings();
  const { analytics, loading: analyticsLoading, lastUpdate, refreshAnalytics } = useDashboardAnalytics();
  const { operationalUsers, loading: operationalLoading } = useOperationalUsers();
  const { callLogs: allCallLogs } = useCallLogs();
  const { tickets: allSupportTickets } = useSupportTickets();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [bookingEditOpen, setBookingEditOpen] = useState(false);
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

  const handleEditBooking = (booking: any) => {
    setSelectedBooking(booking);
    setBookingEditOpen(true);
  };

  const handleSaveBooking = async (bookingId: string, updates: any) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      // Refresh bookings to show the updated information
      fetchBookings();
      setActionLoading(false);
      return true;
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error", 
        description: `Failed to update booking: ${error.message}`,
        variant: "destructive",
      });
      setActionLoading(false);
      return false;
    }
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
      {/* Real-time Manager */}
      <RealTimeManager
        onBookingChange={fetchBookings}
        onSeatChange={fetchBookings}
        onTransactionChange={refreshAnalytics}
        onStudyHallChange={refreshAnalytics}
      />

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
        <LoadingOverlay loading={loading}>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Page Header */}
              <PageHeader
                title="Admin Dashboard"
                description="Monitor and manage the entire platform"
                breadcrumbs={[
                  { label: "Dashboard", active: true }
                ]}
                actions={<RealTimeIndicator lastUpdate={lastUpdate} />}
              />

              {/* Notification Center */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
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
                </div>
                
                <div className="lg:col-span-1">
                  <NotificationCenter />
                </div>
              </div>

              {/* Enhanced Analytics */}
              <EnhancedAnalytics
                data={[]}
                title="Platform Analytics"
                description="Comprehensive analytics and reporting"
                loading={analyticsLoading}
                onRefresh={refreshAnalytics}
              />

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
              <PageHeader
                title="User Management"
                description="Manage all platform users"
                breadcrumbs={[
                  { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                  { label: "User Management", active: true }
                ]}
                actions={
                  <Button onClick={() => setUserModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                }
              />

              {/* Enhanced Users Table */}
              <ResponsiveTable
                data={filteredUsers}
                columns={[
                  {
                    key: 'full_name',
                    title: 'Name',
                    render: (value, user) => (
                      <div>
                        <p className="font-medium">{value || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    )
                  },
                  {
                    key: 'role',
                    title: 'Role',
                    render: (value) => <Badge variant="default">{value}</Badge>
                  },
                  {
                    key: 'created_at',
                    title: 'Joined',
                    mobileHidden: true,
                    render: (value) => new Date(value).toLocaleDateString()
                  }
                ]}
                searchPlaceholder="Search users by name or email..."
                onRowClick={(user) => handleEditUser(user)}
                actions={(user) => (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
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
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                loading={loading}
                emptyMessage="No users found"
              />
            </div>
          )}

          {/* Incharges Tab */}
          {activeTab === "incharges" && <InchargesTab />}

          {/* Merchants Tab */}
          {activeTab === "merchants" && (
            <div className="space-y-6">
              <PageHeader
                title="Merchant Management"
                description="Manage all merchant accounts"
                breadcrumbs={[
                  { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                  { label: "Merchant Management", active: true }
                ]}
                actions={
                  <Button onClick={() => setUserModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Merchant
                  </Button>
                }
              />

              {/* Enhanced Merchants Table */}
              <ResponsiveTable
                data={filteredMerchants}
                columns={[
                  {
                    key: 'full_name',
                    title: 'Name',
                    render: (value, merchant) => (
                      <div>
                        <p className="font-medium">{value || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{merchant.email}</p>
                      </div>
                    )
                  },
                  {
                    key: 'role',
                    title: 'Role',
                    render: (value) => <Badge variant="default">{value}</Badge>
                  },
                  {
                    key: 'created_at',
                    title: 'Joined',
                    mobileHidden: true,
                    render: (value) => new Date(value).toLocaleDateString()
                  },
                  {
                    key: 'study_halls_count',
                    title: 'Study Halls',
                    mobileHidden: true,
                    render: (_, merchant) => studyHalls.filter(sh => sh.merchant_id === merchant.id).length
                  }
                ]}
                searchPlaceholder="Search merchants by name or email..."
                onRowClick={(merchant) => handleViewMerchant(merchant)}
                actions={(merchant) => (
                  <div className="flex flex-col sm:flex-row gap-2">
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
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the merchant account and all their study halls.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMerchant(merchant.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                loading={loading}
                emptyMessage="No merchants found"
              />
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
                              <div>Booking #{booking.booking_number?.toString().padStart(6, '0') || 'Pending'}</div>
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
                                onClick={() => handleEditBooking(booking)}
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
          
          {/* Subscription Transactions Tab */}
          {activeTab === "subscription-transactions" && <AdminSubscriptionTransactionsTab />}
          
          {/* News Tab */}
          {activeTab === "news" && <NewsTab userRole="admin" />}
          
          {/* Community Tab */}
          {activeTab === "community" && <CommunityTab />}
          
          {/* Chat Tab */}
          {activeTab === "chat" && <ChatTab userRole="admin" />}

          {/* Subscription Plans Tab */}
          {activeTab === "subscription-plans" && <SubscriptionPlansTab />}

          {/* Merchant Subscriptions Tab */}
          {activeTab === "merchant-subscriptions" && <MerchantSubscriptionManagementTab />}

          {/* EKQR Recovery Tab */}
          {activeTab === "ekqr-recovery" && <EKQRRecoveryTab />}

          {/* Coupons Tab */}
          {activeTab === "coupons" && <CouponsTab />}

          {/* Rewards Tab */}
          {activeTab === "rewards" && <RewardsTab />}

          {/* Rewards Settings Tab */}
          {activeTab === "rewards-settings" && <RewardsSettingsTab />}

          {/* Settlements Tab */}
          {activeTab === "settlements" && <SettlementsTab />}

          {/* Merchant Verification Tab */}
          {activeTab === "merchantverification" && <MerchantVerificationTab />}

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

          {/* Operational Users Tab */}
          {activeTab === "operational-users" && (
            <div className="space-y-6">
              <PageHeader
                title="Operational Users Management"
                description="Manage operational staff including telemarketing executives, payment callers, customer care, and settlement managers"
                breadcrumbs={[
                  { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                  { label: "Operational Users", active: true }
                ]}
              />

              <div className="grid lg:grid-cols-4 gap-6 mb-6">
                <StatCard 
                  title="Telemarketing Executives"
                  value={operationalUsers.filter(u => u.role === 'telemarketing_executive').length.toString()}
                  icon={Phone}
                  loading={operationalLoading}
                />
                <StatCard 
                  title="Payment Callers"
                  value={operationalUsers.filter(u => u.role === 'pending_payments_caller').length.toString()}
                  icon={AlertCircle}
                  loading={operationalLoading}
                />
                <StatCard 
                  title="Customer Care"
                  value={operationalUsers.filter(u => u.role === 'customer_care_executive').length.toString()}
                  icon={Headphones}
                  loading={operationalLoading}
                />
                <StatCard 
                  title="Settlement Managers"
                  value={operationalUsers.filter(u => u.role === 'settlement_manager').length.toString()}
                  icon={Banknote}
                  loading={operationalLoading}
                />
              </div>

              <ResponsiveTable
                data={operationalUsers}
                columns={[
                  {
                    key: 'full_name',
                    title: 'Name',
                    render: (value, user) => (
                      <div>
                        <p className="font-medium">{value || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    )
                  },
                  {
                    key: 'role',
                    title: 'Role',
                    render: (value) => <Badge variant="default">{value.replace('_', ' ')}</Badge>
                  },
                  {
                    key: 'created_at',
                    title: 'Joined',
                    mobileHidden: true,
                    render: (value) => new Date(value).toLocaleDateString()
                  }
                ]}
                searchPlaceholder="Search operational users..."
                onRowClick={(user) => handleEditUser(user)}
                actions={(user) => (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
                loading={operationalLoading}
              />
            </div>
          )}

          {/* Call Logs Management Tab */}
          {activeTab === "call-logs-management" && (
            <div className="space-y-6">
              <PageHeader
                title="Call Logs Management"
                description="Monitor and manage all call logs across the platform"
                breadcrumbs={[
                  { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                  { label: "Call Logs", active: true }
                ]}
              />

              <ResponsiveTable
                data={allCallLogs || []}
                columns={[
                  {
                    key: 'caller_id',
                    title: 'Caller',
                    render: (value, log) => {
                      const caller = operationalUsers.find(u => u.id === value);
                      return caller ? caller.full_name || caller.email : 'Unknown';
                    }
                  },
                  {
                    key: 'contact_type',
                    title: 'Contact Type',
                    render: (value) => <Badge variant="outline">{value}</Badge>
                  },
                  {
                    key: 'call_purpose',
                    title: 'Purpose',
                    render: (value) => value
                  },
                  {
                    key: 'call_status',
                    title: 'Status',
                    render: (value) => <Badge variant={value === 'completed' ? 'default' : 'secondary'}>{value}</Badge>
                  },
                  {
                    key: 'created_at',
                    title: 'Date',
                    mobileHidden: true,
                    render: (value) => new Date(value).toLocaleDateString()
                  }
                ]}
                searchPlaceholder="Search call logs..."
                loading={operationalLoading}
              />
            </div>
          )}

          {/* Support Tickets Management Tab */}
          {activeTab === "support-tickets-management" && (
            <div className="space-y-6">
              <PageHeader
                title="Support Tickets Management"
                description="Monitor and manage all support tickets"
                breadcrumbs={[
                  { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                  { label: "Support Tickets", active: true }
                ]}
              />

              <ResponsiveTable
                data={allSupportTickets || []}
                columns={[
                  {
                    key: 'title',
                    title: 'Title',
                    render: (value) => value
                  },
                  {
                    key: 'category',
                    title: 'Category',
                    render: (value) => <Badge variant="outline">{value}</Badge>
                  },
                  {
                    key: 'priority',
                    title: 'Priority',
                    render: (value) => (
                      <Badge variant={value === 'high' ? 'destructive' : value === 'medium' ? 'secondary' : 'outline'}>
                        {value}
                      </Badge>
                    )
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    render: (value) => <Badge variant={value === 'resolved' ? 'default' : 'secondary'}>{value}</Badge>
                  },
                  {
                    key: 'created_at',
                    title: 'Created',
                    mobileHidden: true,
                    render: (value) => new Date(value).toLocaleDateString()
                  }
                ]}
                searchPlaceholder="Search support tickets..."
                loading={operationalLoading}
              />
            </div>
          )}
        </LoadingOverlay>
      </DashboardSidebar>

      <BookingDetailModal
        open={bookingDetailOpen}
        onOpenChange={setBookingDetailOpen}
        booking={selectedBooking}
        userRole="admin"
        loading={actionLoading}
      />

      {/* Booking Edit Modal */}
      <BookingEditModal 
        booking={selectedBooking}
        open={bookingEditOpen}
        onOpenChange={setBookingEditOpen}
        onSave={handleSaveBooking}
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