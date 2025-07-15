import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, PlusCircle } from "lucide-react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BookingReviewCardProps {
  booking: any;
  onWriteReview: (booking: any) => void;
}

const BookingReviewCard = ({ booking, onWriteReview }: BookingReviewCardProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="font-medium text-foreground">{booking.study_hall_name}</h4>
          <p className="text-sm text-muted-foreground">
            Ended: {new Date(booking.end_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {booking.already_reviewed ? (
            <Badge variant="secondary">Reviewed</Badge>
          ) : (
            <Button
              size="sm"
              onClick={() => onWriteReview(booking)}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Write Review
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const StudentReviewsTab = () => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { 
    eligibleBookings, 
    loading, 
    fetchEligibleBookings,
    fetchAllReviews 
  } = useReviews();

  useEffect(() => {
    if (user?.id) {
      fetchEligibleBookings();
      fetchMyReviews();
    }
  }, [user?.id]);

  const fetchMyReviews = async () => {
    if (user?.id) {
      const reviews = await fetchAllReviews({ userId: user.id });
      setMyReviews(reviews);
    }
  };

  const handleWriteReview = (booking: any) => {
    setSelectedBooking(booking);
    setReviewFormOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewFormOpen(false);
    setSelectedBooking(null);
    fetchEligibleBookings();
    fetchMyReviews();
  };

  const pendingReviews = eligibleBookings.filter(b => !b.already_reviewed);
  const completedReviews = eligibleBookings.filter(b => b.already_reviewed);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reviews Section */}
      {pendingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Write Reviews
              <Badge variant="secondary">{pendingReviews.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share your experience at these study halls
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.map((booking) => (
              <BookingReviewCard
                key={booking.booking_id}
                booking={booking}
                onWriteReview={handleWriteReview}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            My Reviews
            <Badge variant="secondary">{myReviews.length}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Reviews you've written for study halls
          </p>
        </CardHeader>
        <CardContent>
          {myReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No reviews yet</h3>
              <p className="text-sm text-muted-foreground">
                {pendingReviews.length > 0
                  ? "Start by writing a review for your recent bookings above."
                  : "Complete a booking to write your first review!"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showStudyHall={true}
                  showMerchantResponse={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form Dialog */}
      <Dialog open={reviewFormOpen} onOpenChange={setReviewFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience to help other students
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <ReviewForm
              studyHallId={selectedBooking.study_hall_id}
              bookingId={selectedBooking.booking_id}
              studyHallName={selectedBooking.study_hall_name}
              onSuccess={handleReviewSuccess}
              onCancel={() => setReviewFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Empty state for no bookings */}
      {eligibleBookings.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No completed bookings</h3>
            <p className="text-sm text-muted-foreground">
              Complete a booking to be able to write reviews and help other students.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};