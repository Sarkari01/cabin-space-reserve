import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBanners } from "@/hooks/useBanners";

interface BannerCarouselProps {
  targetAudience: "user" | "merchant";
  className?: string;
}

export function BannerCarousel({ targetAudience, className }: BannerCarouselProps) {
  const { data: banners = [], isLoading } = useBanners(targetAudience);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading || !banners.length) {
    return null;
  }

  const activeBanners = banners.filter(banner => {
    const now = new Date();
    const startDate = new Date(banner.start_date);
    const endDate = banner.end_date ? new Date(banner.end_date) : null;
    
    return banner.status === 'active' && 
           now >= startDate && 
           (!endDate || now <= endDate);
  });

  if (!activeBanners.length) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title || "Banner"}
            className="w-full h-48 md:h-64 object-cover"
          />
          
          {/* Overlay content */}
          {(currentBanner.title || currentBanner.description) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-white">
                {currentBanner.title && (
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    {currentBanner.title}
                  </h3>
                )}
                {currentBanner.description && (
                  <p className="text-sm md:text-base opacity-90">
                    {currentBanner.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation arrows */}
          {activeBanners.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Dots indicator */}
      {activeBanners.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}