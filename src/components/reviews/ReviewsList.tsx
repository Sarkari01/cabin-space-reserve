import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Filter } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { RatingDisplay } from "./RatingDisplay";
import { useReviews, Review } from "@/hooks/useReviews";

interface ReviewsListProps {
  studyHallId?: string;
  showFilters?: boolean;
  showStudyHallName?: boolean;
  title?: string;
  limit?: number;
  className?: string;
}

export const ReviewsList = ({
  studyHallId,
  showFilters = true,
  showStudyHallName = false,
  title = "Reviews",
  limit = 10,
  className
}: ReviewsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = limit;

  const { reviews, loading, fetchReviews, fetchAllReviews } = useReviews();

  useEffect(() => {
    if (studyHallId) {
      fetchReviews(studyHallId, 100); // Fetch more for client-side filtering
    } else {
      fetchAllReviews({ limit: 100 });
    }
  }, [studyHallId]);

  useEffect(() => {
    let filtered = [...reviews];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.study_halls?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(review => review.status === statusFilter);
    }

    // Apply rating filter
    if (ratingFilter !== "all") {
      const targetRating = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.rating === targetRating);
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    setDisplayedReviews(filtered.slice(startIndex, endIndex));
  }, [reviews, searchTerm, statusFilter, ratingFilter, currentPage, reviewsPerPage]);

  const totalPages = Math.ceil(
    reviews.filter(review => {
      let matches = true;
      if (searchTerm) {
        matches = matches && (
          review.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.study_halls?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== "all") {
        matches = matches && review.status === statusFilter;
      }
      if (ratingFilter !== "all") {
        matches = matches && review.rating === parseInt(ratingFilter);
      }
      return matches;
    }).length / reviewsPerPage
  );

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {title}
              </CardTitle>
              {reviews.length > 0 && (
                <div className="mt-2">
                  <RatingDisplay 
                    rating={averageRating} 
                    totalReviews={reviews.length}
                    size="md"
                  />
                </div>
              )}
            </div>
            <Badge variant="secondary">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rating" />
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setRatingFilter("all");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear
              </Button>
            </div>
          )}

          {displayedReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No reviews found</h3>
              <p className="text-sm text-muted-foreground">
                {reviews.length === 0 
                  ? "Be the first to leave a review!" 
                  : "Try adjusting your filters to see more reviews."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showStudyHall={showStudyHallName}
                />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};