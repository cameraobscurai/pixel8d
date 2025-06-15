
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, Eye } from 'lucide-react';

interface LumaCapture {
  id: string;
  title: string;
  embedUrl: string;
  thumbnail: string;
  description?: string;
}

interface LumaGalleryItemProps {
  capture: LumaCapture;
  index: number;
  layoutMode: 'masonry' | 'grid-2' | 'grid-3';
  onCaptureClick: (captureId: string) => void;
}

export const LumaGalleryItem: React.FC<LumaGalleryItemProps> = ({ 
  capture, 
  index, 
  layoutMode,
  onCaptureClick
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Get dynamic height for masonry layout
  const getItemHeight = () => {
    const baseHeights = [320, 400, 360, 440, 380];
    return baseHeights[index % baseHeights.length];
  };

  const handleMainViewClick = () => {
    onCaptureClick(capture.id);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://lumalabs.ai/capture/${capture.id}`, '_blank');
  };

  const cardStyle = layoutMode === 'masonry' ? {
    height: `${getItemHeight()}px`,
    breakInside: 'avoid' as const,
    marginBottom: '24px'
  } : {
    height: '400px'
  };

  return (
    <Card 
      ref={cardRef}
      className="group overflow-hidden bg-card hover:shadow-lg transition-all duration-300 relative cursor-pointer"
      style={cardStyle}
      onClick={handleMainViewClick}
    >
      <CardContent className="p-0 h-full relative">
        {isVisible ? (
          <div className="w-full h-full relative">
            {/* Thumbnail Image */}
            <img
              src={capture.thumbnail}
              alt={capture.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsImageLoaded(true)}
              loading="lazy"
            />
            
            {/* Loading placeholder */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 animate-pulse flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
              {/* Top controls */}
              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={handlePreviewClick}
                  variant="secondary"
                  size="sm"
                  className="bg-black/50 hover:bg-black/70 text-white border-none"
                >
                  <ExternalLink size={16} />
                </Button>
              </div>
              
              {/* Bottom content */}
              <div className="space-y-3">
                {/* Main action button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye size={24} />
                  </Button>
                </div>
                
                {/* Title and description */}
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">{capture.title}</h3>
                  {capture.description && (
                    <p className="text-sm opacity-75">{capture.description}</p>
                  )}
                  <p className="text-xs opacity-60 mt-2">Click to load in main viewer</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Loading state while waiting for intersection
          <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
