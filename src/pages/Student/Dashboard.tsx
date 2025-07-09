import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Users, Search, Heart, Clock, DollarSign, Eye, BookOpen, Star, Filter } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useStudyHalls, useSeats } from "@/hooks/useStudyHalls";
import { useBookings } from "@/hooks/useBookings";
import { useFavorites } from "@/hooks/useFavorites";
import { StudyHallDetailModal } from "@/components/StudyHallDetailModal";
import { BannerCarousel } from "@/components/BannerCarousel";
import { BookingDetailModal } from "@/components/BookingDetailModal";
const StudentDashboard = () => {
  const { user } = useAuth();
  const { studyHalls, loading: studyHallsLoading } = useStudyHalls();
  const { bookings, loading: bookingsLoading, cancelBooking } = useBookings();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudyHall, setSelectedStudyHall] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { seats, fetchSeats } = useSeats();

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

  const handleViewStudyHall = async (studyHall) => {
    setSelectedStudyHall(studyHall);
    await fetchSeats(studyHall.id);
    setDetailModalOpen(true);
  };

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
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h2>
                <p className="text-muted-foreground">Manage your bookings and discover new study spaces</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                        <p className="text-sm text-muted-foreground mb-1">Favorite Halls</p>
                        <p className="text-2xl font-bold">{favorites.length}</p>
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
                        <p className="text-2xl font-bold">{completedBookings.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                        <p className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                        <p className="text-sm text-muted-foreground mb-3 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {studyHall.rows} rows • {studyHall.seats_per_row} seats per row
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">₹{studyHall.daily_price}/day</span>
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
                              <div>Booking ID: {booking.id.substring(0, 8)}...</div>
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

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Your Favorite Study Halls</h3>
              
              {favorites.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite) => (
                    <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                        {favorite.study_hall?.image_url ? (
                          <img 
                            src={favorite.study_hall.image_url} 
                            alt={favorite.study_hall.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-muted-foreground">{favorite.study_hall?.name}</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{favorite.study_hall?.name}</h4>
                          <Badge variant="outline">{favorite.study_hall?.total_seats} seats</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {favorite.study_hall?.location}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">₹{favorite.study_hall?.daily_price}/day</span>
                          <div className="space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeFromFavorites(favorite.study_hall_id)}
                            >
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            </Button>
                            <Button size="sm" onClick={() => handleViewStudyHall(favorite.study_hall)}>
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