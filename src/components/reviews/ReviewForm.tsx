import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StarRating } from "./StarRating";
import { useReviews, CreateReviewData } from "@/hooks/useReviews";

interface ReviewFormProps {
  studyHallId: string;
  bookingId: string;
  studyHallName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({
  studyHallId,
  bookingId,
  studyHallName,
  onSuccess,
  onCancel
}: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  
  const { createReview, loading } = useReviews();

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (rating === 0) {
      newErrors.push("Please select a rating");
    }
    
    if (reviewText.length > 1000) {
      newErrors.push("Review text must be less than 1000 characters");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const reviewData: CreateReviewData = {
      study_hall_id: studyHallId,
      booking_id: bookingId,
      rating,
      review_text: reviewText.trim() || undefined,
    };

    const result = await createReview(reviewData);
    
    if (result) {
      setRating(0);
      setReviewText("");
      setErrors([]);
      onSuccess?.();
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Write a Review</CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your experience at <span className="font-medium">{studyHallName}</span>
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="rating" className="text-sm font-medium">
              Rating <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
              {rating > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-text" className="text-sm font-medium">
              Your Review (Optional)
            </Label>
            <Textarea
              id="review-text"
              placeholder="Tell others about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Share details about the facilities, environment, service, etc.</span>
              <span>{reviewText.length}/1000</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};