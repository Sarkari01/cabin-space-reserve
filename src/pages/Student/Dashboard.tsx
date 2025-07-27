import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Users, Search, Heart, Clock, DollarSign, Eye, BookOpen, Star, Filter, TrendingUp } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useStudyHalls, useSeats } from "@/hooks/useStudyHalls";
import { useBookings } from "@/hooks/useBookings";
import { useFavorites } from "@/hooks/useFavorites";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { StudyHallDetailModal } from "@/components/StudyHallDetailModal";
import { BannerCarousel } from "@/components/BannerCarousel";
import { BookingDetailModal } from "@/components/BookingDetailModal";
import { NewsTab } from "@/components/NewsTab";
import { CommunityTab } from "@/components/CommunityTab";
import { ChatTab } from "@/components/ChatTab";
import { StudentTransactionsTab } from "@/components/student/StudentTransactionsTab";
import { RewardsTab } from "@/components/student/RewardsTab";
import { StudentReviewsTab } from "@/components/student/StudentReviewsTab";
import { RatingDisplay } from "@/components/reviews/RatingDisplay";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { RealTimeIndicator } from "@/components/dashboard/RealTimeIndicator";
import { BookingLifecycleManager } from "@/components/BookingLifecycleManager";
import UserProfileSettings from "@/components/UserProfileSettings";
import { SeatSynchronizer } from "@/components/SeatSynchronizer";
import { StudyHallSearchMap } from "@/components/maps/StudyHallSearchMap";
import { StudentReportsTab } from "@/components/reports/StudentReportsTab";
const StudentDashboard = () => {
  const { user } = useAuth();
  const { studyHalls, loading: studyHallsLoading, fetchStudyHalls } = useStudyHalls();
  const { bookings, loading: bookingsLoading, cancelBooking } = useBookings();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { analytics, loading: analyticsLoading, lastUpdate, refreshAnalytics } = useDashboardAnalytics();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudyHall, setSelectedStudyHall] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { seats, fetchSeats } = useSeats();

  // Listen for navigation to reviews tab
  useEffect(() => {
    const handleNavigateToReviews = () => {
      setActiveTab("reviews");
    };
    
    window.addEventListener('navigateToReviews', handleNavigateToReviews);
    return () => window.removeEventListener('navigateToReviews', handleNavigateToReviews);
  }, []);

  // Filter active study halls for browsing
  const activeStudyHalls = studyHalls.filter(hall => hall.status === 'active');
  
  // Filter study halls based on search
  const filteredStudyHalls = activeStudyHalls.filter(hall =>
    hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get upcoming bookings (confirmed and pending)
  const upcomingBookings = bookings.filter(booking => 
    ['confirmed', 'pending'].includes(booking.status) &&
    new Date(booking.start_date) >= new Date()
  );

  // Get completed bookings
  const completedBookings = bookings.filter(booking => 
    booking.status === 'completed'
  );

  // Calculate total spent
  const totalSpent = bookings
    .filter(booking => booking.status === 'completed')
    .reduce((sum, booking) => sum + Number(booking.total_amount), 0);

  const handleViewStudyHall = useCallback((studyHall) => {
    // Use the current data from studyHalls state which already has incharges
    const currentStudyHall = studyHalls.find(hall => hall.id === studyHall.id) || studyHall;
    
    setSelectedStudyHall(currentStudyHall);
    setDetailModalOpen(true);
    // Fetch seats asynchronously after opening modal to prevent blocking
    fetchSeats(studyHall.id);
  }, [studyHalls, fetchSeats]);

  const handleFavoriteToggle = (studyHallId) => {
    if (isFavorite(studyHallId)) {
      removeFromFavorites(studyHallId);
    } else {
      addToFavorites(studyHallId);
    }
  };

  const handleViewBookingDetails = (booking: any) => {
    setSelectedBooking(booking);
    setBookingDetailOpen(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    setActionLoading(true);
    await cancelBooking(bookingId);
    setActionLoading(false);
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
      default:
        return 'secondary';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Required</h2>
          <p className="text-muted-foreground">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <BookingLifecycleManager />
      <SeatSynchronizer onSeatUpdate={useCallback(() => {
        // Only refresh if we have active modals or are viewing seats
        if (detailModalOpen && selectedStudyHall) {
          fetchSeats(selectedStudyHall.id);
        }
      }, [detailModalOpen, selectedStudyHall, fetchSeats])} />
      <DashboardSidebar 
        userRole="student" 
        userName={user.email || "Student"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      >
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Banner Carousel */}
              <BannerCarousel targetAudience="user" className="mb-6" />
              
              {/* Rest of overview content */}
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h2>
                    <p className="text-muted-foreground">Manage your bookings and discover new study spaces</p>
                  </div>
                  <RealTimeIndicator lastUpdate={lastUpdate} />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Active Bookings"
                  value={analytics.studentStats?.upcomingBookings || upcomingBookings.length}
                  icon={Calendar}
                  loading={analyticsLoading}
                />
                <StatCard
                  title="Favorite Halls"
                  value={analytics.studentStats?.favoriteHalls || favorites.length}
                  icon={Heart}
                  loading={analyticsLoading}
                />
                <StatCard
                  title="Total Visits"
                  value={analytics.studentStats?.completedBookings || completedBookings.length}
                  icon={Users}
                  trend={{ value: 15, label: "this month" }}
                  loading={analyticsLoading}
                />
                <StatCard
                  title="Total Spent"
                  value={`₹${(analytics.studentStats?.totalSpent || totalSpent).toLocaleString()}`}
                  icon={DollarSign}
                  trend={{ value: analytics.revenueGrowth || 8, label: "from last month" }}
                  loading={analyticsLoading}
                />
              </div>

              {/* Analytics Chart */}
              {analytics.bookingsTrend.length > 0 && (
                <div className="mb-8">
                  <AnalyticsChart
                    title="Your Booking Activity"
                    description="Your booking and spending patterns over the last 30 days"
                    data={analytics.bookingsTrend}
                    type="line"
                    dataKey="revenue"
                    trend={analytics.revenueGrowth}
                    value={`₹${analytics.totalRevenue.toLocaleString()}`}
                    onRefresh={refreshAnalytics}
                    loading={analyticsLoading}
                  />
                </div>
              )}

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Bookings</CardTitle>
                  <CardDescription>Your scheduled study hall visits</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-muted rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-semibold">{booking.study_hall?.name || 'Study Hall'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(booking.start_date)} • Seat {booking.seat?.seat_id}
                            </p>
                            <p className="text-sm text-muted-foreground">{booking.study_hall?.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-medium mt-1">₹{Number(booking.total_amount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming bookings</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Browse Study Halls Tab */}
          {activeTab === "browse" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">Browse Study Halls</h3>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search study halls by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Study Halls Grid */}
              {studyHallsLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-muted rounded-t-lg"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStudyHalls.map((studyHall) => (
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
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{studyHall.name}</h4>
                          <Badge variant="outline">{studyHall.total_seats} seats</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {studyHall.location}
                        </p>
                        {(studyHall as any).average_rating && (
                          <div className="mb-2">
                            <RatingDisplay 
                              rating={(studyHall as any).average_rating} 
                              totalReviews={(studyHall as any).total_reviews || 0}
                              size="sm"
                            />
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mb-3 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {studyHall.rows} rows • {studyHall.seats_per_row} seats per row
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">₹{studyHall.monthly_price}/month</span>
                          <div className="space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleFavoriteToggle(studyHall.id)}
                            >
                              <Heart className={`h-4 w-4 ${isFavorite(studyHall.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                            <Button size="sm" onClick={() => handleViewStudyHall(studyHall)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!studyHallsLoading && filteredStudyHalls.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No study halls found</h3>
                  <p>Try adjusting your search terms</p>
                </div>
              )}
            </div>
          )}

          {/* My Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">My Bookings</h3>
              
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
                  {bookings.map((booking, index) => (
                    <Card key={booking.id} className="animate-fade-in hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
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
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.study_hall?.location}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>Seat {booking.seat?.seat_id} ({booking.seat?.row_name}{booking.seat?.seat_number})</span>
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>Booking #{booking.booking_number ? `B${booking.booking_number}` : 'Pending'}</div>
                              <div>
                                Period: {booking.booking_period} • Created: {formatDate(booking.created_at)}
                              </div>
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
                                View Details
                              </Button>
                              {booking.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? "Cancelling..." : "Cancel"}
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
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                  <p>Start by browsing available study halls</p>
                  <Button className="mt-4" onClick={() => setActiveTab("browse")}>
                    Browse Study Halls
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* News Tab */}
          {activeTab === "news" && <NewsTab userRole="student" />}

          {/* Community Tab */}
          {activeTab === "community" && <CommunityTab />}

          {/* Chat Tab */}
          {activeTab === "chat" && <ChatTab />}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Profile Settings</h3>
              <UserProfileSettings />
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <RewardsTab />
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <StudentReviewsTab />
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <StudentReportsTab />
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <StudentTransactionsTab />
          )}

          {/* Map Search Tab */}
          {activeTab === "map" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Find Study Halls Near You</h3>
              <StudyHallSearchMap onStudyHallSelect={handleViewStudyHall} />
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Your Favorite Study Halls</h3>
              
              {favorites.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite) => (
                    <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                        {favorite.study_halls?.image_url ? (
                          <img 
                            src={favorite.study_halls.image_url} 
                            alt={favorite.study_halls.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-muted-foreground">{favorite.study_halls?.name}</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{favorite.study_halls?.name}</h4>
                          <Badge variant="outline">Study Hall</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {favorite.study_halls?.location}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">₹{favorite.study_halls?.monthly_price}/month</span>
                          <div className="space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeFromFavorites(favorite.study_hall_id)}
                            >
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            </Button>
                            <Button size="sm" onClick={() => favorite.study_halls && handleViewStudyHall(favorite.study_halls)}>
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                  <p>Add study halls to your favorites while browsing</p>
                  <Button className="mt-4" onClick={() => setActiveTab("browse")}>
                    Browse Study Halls
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardSidebar>

      <StudyHallDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        studyHall={selectedStudyHall}
        seats={seats}
        userRole="student"
      />

      <BookingDetailModal
        open={bookingDetailOpen}
        onOpenChange={setBookingDetailOpen}
        booking={selectedBooking}
        userRole="student"
        onCancel={handleCancelBooking}
        loading={actionLoading}
      />
    </>
  );
};

export default StudentDashboard;