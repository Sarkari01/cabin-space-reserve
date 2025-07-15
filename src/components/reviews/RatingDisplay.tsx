import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export const RatingDisplay = ({
  rating,
  totalReviews = 0,
  size = "md",
  showCount = true,
  className
}: RatingDisplayProps) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground"
            )}
          />
        ))}
      </div>
      
      <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
        {rating.toFixed(1)}
      </span>
      
      {showCount && totalReviews > 0 && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
};