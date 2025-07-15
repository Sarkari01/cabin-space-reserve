import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Reply, Star, Filter } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { RatingDisplay } from "@/components/reviews/RatingDisplay";
import { MerchantResponseModal } from "@/components/reviews/MerchantResponseModal";
import { useReviews, Review } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { useStudyHalls } from "@/hooks/useStudyHalls";

export const MerchantReviewsTab = () => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedStudyHall, setSelectedStudyHall] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  
  const { user } = useAuth();
  const { studyHalls } = useStudyHalls();
  const { 
    reviews, 
    loading, 
    fetchAllReviews 
  } = useReviews();

  useEffect(() => {
    if (user?.id) {
      fetchAllReviews({ merchantId: user.id });
    }
  }, [user?.id]);

  useEffect(() => {
    let filtered = [...reviews];

    if (selectedStudyHall !== "all") {
      filtered = filtered.filter(review => review.study_hall_id === selectedStudyHall);
    }

    if (selectedRating !== "all") {
      filtered = filtered.filter(review => review.rating === parseInt(selectedRating));
    }

    setFilteredReviews(filtered);
  }, [reviews, selectedStudyHall, selectedRating]);

  const handleRespondToReview = (review: Review) => {
    setSelectedReview(review);
    setResponseModalOpen(true);
  };

  const handleResponseSuccess = () => {
    // Refresh reviews after successful response
    if (user?.id) {
      fetchAllReviews({ merchantId: user.id });
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  const unansweredReviews = reviews.filter(review => !review.merchant_response);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
                  <RatingDisplay rating={averageRating} showCount={false} size="sm" />
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unanswered</p>
                <p className="text-2xl font-bold text-foreground">{unansweredReviews.length}</p>
              </div>
              <Reply className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratingBreakdown.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Customer Reviews
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedStudyHall} onValueChange={setSelectedStudyHall}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Study Halls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Study Halls</SelectItem>
                  {studyHalls.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No reviews found</h3>
              <p className="text-sm text-muted-foreground">
                {reviews.length === 0 
                  ? "You haven't received any reviews yet. Encourage your customers to leave feedback!"
                  : "Try adjusting your filters to see more reviews."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="relative">
                  <ReviewCard
                    review={review}
                    showStudyHall={true}
                    showMerchantResponse={true}
                  />
                  
                  {!review.merchant_response && (
                    <div className="absolute top-4 right-4">
                      <Button
                        size="sm"
                        onClick={() => handleRespondToReview(review)}
                        className="flex items-center gap-2"
                      >
                        <Reply className="h-4 w-4" />
                        Respond
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Modal */}
      <MerchantResponseModal
        review={selectedReview}
        open={responseModalOpen}
        onOpenChange={setResponseModalOpen}
        onSuccess={handleResponseSuccess}
      />
    </div>
  );
};