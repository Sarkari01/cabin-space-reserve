import { useStudyHallImages } from "@/hooks/useStudyHallImages";
import { useState, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudyHallImageGalleryProps {
  studyHallId: string;
}

const StudyHallImageGalleryComponent = ({ studyHallId }: StudyHallImageGalleryProps) => {
  const { images, loading } = useStudyHallImages(studyHallId);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Loading images...</span>
      </div>
    );
  }

  if (!loading && images.length === 0) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  const mainImage = images.find(img => img.is_main) || images[0];
  const otherImages = images.filter(img => !img.is_main);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-video w-full rounded-lg overflow-hidden">
        <img
          src={images[currentIndex]?.image_url || mainImage.image_url}
          alt="Study hall"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-12 rounded-md overflow-hidden border-2 transition-colors ${
                index === currentIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              <img
                src={image.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const StudyHallImageGallery = memo(StudyHallImageGalleryComponent);