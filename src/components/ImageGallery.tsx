import { useState, useEffect, useRef } from 'react';
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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [shouldPrioritize, setShouldPrioritize] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);

  // Preload adjacent images for smoother navigation
  useEffect(() => {
    const preloadImage = (index: number) => {
      if (index >= 0 && index < sortedImages.length && !loadedImages.has(index)) {
        const img = new Image();
        img.src = sortedImages[index].image_url;
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(index));
        };
      }
    };

    // Preload current and adjacent images
    preloadImage(currentIndex - 1);
    preloadImage(currentIndex + 1);
  }, [currentIndex, sortedImages, loadedImages]);

  useEffect(() => {
    const node = mainImageRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldPrioritize(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  if (sortedImages.length === 0) {
    return null;
  }

  const updateIndex = (nextIndex: number) => {
    const validIndex = (nextIndex + sortedImages.length) % sortedImages.length;
    setCurrentIndex(validIndex);
    setImageLoaded(loadedImages.has(validIndex));
  };

  const goToPrevious = () => updateIndex(currentIndex === 0 ? sortedImages.length - 1 : currentIndex - 1);

  const goToNext = () => updateIndex(currentIndex === sortedImages.length - 1 ? 0 : currentIndex + 1);

  const imageSizes = '(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 720px';

  const currentImage = sortedImages[currentIndex];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted" ref={mainImageRef}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted-foreground/5 to-muted animate-pulse" />
        )}
        <img
          src={currentImage.image_url}
          alt={altText}
          loading={shouldPrioritize ? 'eager' : 'lazy'}
          fetchPriority={shouldPrioritize ? 'high' : 'auto'}
          decoding="async"
          sizes={imageSizes}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 will-change-transform ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Navigation arrows - only show if more than 1 image */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-sm"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-sm"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail navigation - only show if more than 1 image */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                updateIndex(index);
              }}
              className={`flex-shrink-0 w-16 h-20 rounded border-2 overflow-hidden transition-all will-change-transform ${
                index === currentIndex
                  ? 'border-primary ring-2 ring-primary scale-105'
                  : 'border-border opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img
                src={image.image_url}
                alt={`${altText} thumbnail ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
