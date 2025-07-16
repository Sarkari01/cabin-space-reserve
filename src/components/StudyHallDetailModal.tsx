import { useState, useEffect, memo, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, Calendar, DollarSign, Grid, Eye, Heart, Star } from "lucide-react";
import { BookingModal } from "./BookingModal";
import { useFavorites } from "@/hooks/useFavorites";
import { StudyHallImageGallery } from "./StudyHallImageGallery";
import { StudyHallData, Seat } from "@/types/StudyHall";
import { ReviewsList } from "./reviews/ReviewsList";
import { ReviewForm } from "./reviews/ReviewForm";
import { RatingDisplay } from "./reviews/RatingDisplay";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";

interface StudyHallDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyHall: StudyHallData | null;
  seats: Seat[];
  userRole?: string;
  onEdit?: () => void;
}

const StudyHallDetailModalComponent = ({ 
  open, 
  onOpenChange, 
  studyHall, 
  seats,
  userRole,
  onEdit 
}: StudyHallDetailModalProps) => {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { reviews, loading: reviewsLoading, fetchReviews, createReview, fetchEligibleBookings } = useReviews();

  // Fetch reviews when study hall changes
  useEffect(() => {
    if (studyHall?.id && open) {
      fetchReviews(studyHall.id);
    }
  }, [studyHall?.id, open, fetchReviews]);

  if (!studyHall) return null;


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const { availableSeats, occupiedSeats, seatsByRow } = useMemo(() => {
    const available = seats.filter(seat => seat.is_available).length;
    const occupied = seats.length - available;
    const byRow = seats.reduce((acc, seat) => {
      if (!acc[seat.row_name]) {
        acc[seat.row_name] = [];
      }
      acc[seat.row_name].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);
    
    return {
      availableSeats: available,
      occupiedSeats: occupied,
      seatsByRow: byRow
    };
  }, [seats]);

  const handleFavoriteToggle = () => {
    if (isFavorite(studyHall.id)) {
      removeFromFavorites(studyHall.id);
    } else {
      addToFavorites(studyHall.id);
    }
  };

  const getSeatColor = (seat: Seat) => {
    return seat.is_available ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300";
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5" />
                {studyHall.name}
              </div>
              {(studyHall as any).average_rating && (
                <RatingDisplay 
                  rating={(studyHall as any).average_rating} 
                  totalReviews={(studyHall as any).total_reviews || 0}
                  size="sm"
                />
              )}
            </DialogTitle>
            <DialogDescription>
              Complete study hall information and seat layout
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="layout">Seat Layout</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {open && <StudyHallImageGallery studyHallId={studyHall.id} />}

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{studyHall.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{studyHall.total_seats} total seats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Created {formatDate(studyHall.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                        {studyHall.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Daily Rate:</span>
                      <span className="font-medium">₹{studyHall.daily_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly Rate:</span>
                      <span className="font-medium">₹{studyHall.weekly_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Rate:</span>
                      <span className="font-medium">₹{studyHall.monthly_price}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seat Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{availableSeats}</div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{occupiedSeats}</div>
                      <div className="text-sm text-muted-foreground">Occupied</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{studyHall.total_seats}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {studyHall.amenities && studyHall.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studyHall.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {studyHall.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{studyHall.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Reviews Summary */}
              {((studyHall as any).average_rating || reviews.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Reviews & Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <RatingDisplay 
                        rating={(studyHall as any).average_rating || 0} 
                        totalReviews={(studyHall as any).total_reviews || 0}
                        size="lg"
                      />
                      {userRole === "student" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to reviews tab in student dashboard
                            onOpenChange(false);
                            window.dispatchEvent(new CustomEvent('navigateToReviews', { 
                              detail: { studyHallId: studyHall.id } 
                            }));
                          }}
                        >
                          Write Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seat Layout</CardTitle>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span>Occupied</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(seatsByRow).map(([rowName, rowSeats]) => (
                      <div key={rowName} className="space-y-2">
                        <h4 className="font-medium">Row {rowName}</h4>
                        <div className="flex flex-wrap gap-2">
                          {rowSeats
                            .sort((a, b) => a.seat_number - b.seat_number)
                            .map((seat) => (
                            <div
                              key={seat.id}
                              className={`w-12 h-12 border rounded-lg flex items-center justify-center text-xs font-medium ${getSeatColor(seat)}`}
                              title={`${seat.seat_id} - ${seat.is_available ? 'Available' : 'Occupied'}`}
                            >
                              {seat.seat_number}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Incharge Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studyHall.incharges && studyHall.incharges.length > 0 ? (
                    <div className="space-y-4">
                      {studyHall.incharges.map((incharge) => (
                        <div key={incharge.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium">{incharge.full_name}</div>
                              <div className="text-sm text-muted-foreground">{incharge.email}</div>
                              <div className="text-sm text-muted-foreground">{incharge.mobile}</div>
                            </div>
                            <Badge variant={incharge.status === 'active' ? 'default' : 'secondary'}>
                              {incharge.status}
                            </Badge>
                          </div>
                          {incharge.permissions && (
                            <div className="text-xs text-muted-foreground">
                              <span>Permissions: </span>
                              {Object.entries(incharge.permissions)
                                .filter(([_, value]) => value === true)
                                .map(([key, _]) => key.replace('_', ' '))
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No incharges assigned to this study hall</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Layout Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Rows:</span>
                    <span>{studyHall.rows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seats per Row:</span>
                    <span>{studyHall.seats_per_row}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Capacity:</span>
                    <span>{studyHall.total_seats}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Study Hall ID:</span>
                    <span className="font-mono text-xs">{studyHall.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Created:</span>
                    <span>{formatDate(studyHall.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Reviews</h3>
                  <p className="text-sm text-muted-foreground">
                    {(studyHall as any).total_reviews || 0} review{((studyHall as any).total_reviews || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                {userRole === "student" && (
                  <Button onClick={() => {
                    onOpenChange(false);
                    window.dispatchEvent(new CustomEvent('navigateToReviews', { 
                      detail: { studyHallId: studyHall.id } 
                    }));
                  }}>
                    Write Review
                  </Button>
                )}
              </div>

              <ReviewsList 
                studyHallId={studyHall.id}
                showFilters={false}
                limit={10}
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
            
            {userRole === "student" && studyHall.status === "active" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleFavoriteToggle}
                  className="flex items-center gap-2"
                >
                  <Heart className={`h-4 w-4 ${isFavorite(studyHall.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorite(studyHall.id) ? 'Remove' : 'Favorite'}
                </Button>
                <Button onClick={() => setBookingModalOpen(true)} className="flex-1">
                  Book Now
                </Button>
              </>
            )}
            
            {(userRole === "admin" || userRole === "merchant") && onEdit && (
              <Button onClick={onEdit} variant="default">
                Edit
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        studyHall={studyHall}
        seats={seats}
        onSuccess={() => {
          setBookingModalOpen(false);
          onOpenChange(false);
        }}
      />

      {/* Note: Review form will be handled by the StudentReviewsTab component */}
    </>
  );
};

export const StudyHallDetailModal = memo(StudyHallDetailModalComponent);