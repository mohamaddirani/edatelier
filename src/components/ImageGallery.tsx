import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  altText: string;
}

export default function ImageGallery({ images, altText }: ImageGalleryProps) {
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (sortedImages.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={sortedImages[currentIndex].image_url}
          alt={altText}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Navigation arrows - only show if more than 1 image */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail navigation - only show if more than 1 image */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setImageLoaded(false);
                setCurrentIndex(index);
              }}
              className={`flex-shrink-0 w-16 h-20 rounded border-2 overflow-hidden transition-all ${
                index === currentIndex
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-border opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={image.image_url}
                alt={`${altText} thumbnail ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
