import { format } from "date-fns";
import { MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RatingDisplay } from "./RatingDisplay";
import { Review } from "@/hooks/useReviews";

interface ReviewCardProps {
  review: Review;
  showStudyHall?: boolean;
  showMerchantResponse?: boolean;
  className?: string;
}

export const ReviewCard = ({
  review,
  showStudyHall = false,
  showMerchantResponse = true,
  className
}: ReviewCardProps) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">
                {review.profiles?.full_name || "Anonymous User"}
              </h4>
              <div className="flex items-center gap-2">
                <RatingDisplay 
                  rating={review.rating} 
                  showCount={false} 
                  size="sm" 
                />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
          
          {review.status !== 'approved' && (
            <Badge variant={review.status === 'pending' ? 'secondary' : 'destructive'}>
              {review.status}
            </Badge>
          )}
        </div>
        
        {showStudyHall && review.study_halls?.name && (
          <div className="mt-2">
            <span className="text-sm text-muted-foreground">
              Study Hall: <span className="font-medium">{review.study_halls.name}</span>
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {review.review_text && (
          <p className="text-sm text-foreground leading-relaxed">
            {review.review_text}
          </p>
        )}

        {showMerchantResponse && review.merchant_response && (
          <>
            <Separator />
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Merchant Response
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.merchant_response}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};