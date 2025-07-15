import { useStudyHallImages } from "@/hooks/useStudyHallImages";

interface StudyHallMainImageProps {
  studyHallId: string;
  alt: string;
  className?: string;
}

export const StudyHallMainImage = ({ studyHallId, alt, className = "w-full h-full object-cover" }: StudyHallMainImageProps) => {
  const { images, loading } = useStudyHallImages(studyHallId);
  
  const mainImage = images.find(img => img.is_main) || images[0];
  
  if (loading) {
    return (
      <div className={`${className} bg-muted animate-pulse flex items-center justify-center`}>
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }
  
  return (
    <img
      src={mainImage?.image_url || "/placeholder.svg"}
      alt={alt}
      className={className}
    />
  );
};