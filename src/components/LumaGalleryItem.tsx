
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';
import type { CaptureData } from '@/lib/captures';

interface LumaGalleryItemProps {
  capture: CaptureData;
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
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMainViewClick = () => onCaptureClick(capture.id);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://lumalabs.ai/capture/${capture.id}`, '_blank');
  };

  const masonryHeights = [320, 400, 360, 440, 380];
  const cardStyle = layoutMode === 'masonry'
    ? { height: `${masonryHeights[index % masonryHeights.length]}px`, breakInside: 'avoid' as const, marginBottom: '24px' }
    : { aspectRatio: '4/3' };

  return (
    <Card 
      ref={cardRef}
      className="group overflow-hidden bg-card hover:shadow-lg transition-all duration-300 cursor-pointer border-border"
      style={cardStyle}
      onClick={handleMainViewClick}
    >
      <CardContent className="p-0 h-full relative">
        {isVisible ? (
          <div className="w-full h-full relative">
            {!imgError ? (
              <img
                src={capture.thumbnail}
                alt={capture.title}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No preview</span>
              </div>
            )}
            
            {!isImageLoaded && !imgError && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
            
            {/* Top controls */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={handlePreviewClick}
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/60 backdrop-blur hover:bg-background/80"
              >
                <ExternalLink size={14} />
              </Button>
            </div>
            
            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-base truncate">{capture.title}</h3>
                  {capture.description && (
                    <p className="text-white/70 text-xs mt-0.5 truncate">{capture.description}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  className="shrink-0 rounded-full h-10 w-10 bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye size={18} />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </CardContent>
    </Card>
  );
};
