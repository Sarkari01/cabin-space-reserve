import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StarRating = ({
  rating,
  onRatingChange,
  disabled = false,
  size = "md",
  className
}: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const handleClick = (star: number) => {
    if (!disabled) {
      onRatingChange(star);
    }
  };

  const handleMouseEnter = (star: number) => {
    if (!disabled) {
      setHoveredRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoveredRating(0);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoveredRating || rating);
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={cn(
              "transition-colors duration-150",
              !disabled && "hover:scale-110 cursor-pointer",
              disabled && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-150",
                isActive
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground hover:text-yellow-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};