
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Maximize2 } from 'lucide-react';

interface LumaCapture {
  id: string;
  title: string;
  embedUrl: string;
  thumbnail?: string;
}

interface LumaGalleryItemProps {
  capture: LumaCapture;
  index: number;
  layoutMode: 'masonry' | 'grid-2' | 'grid-3';
}

export const LumaGalleryItem: React.FC<LumaGalleryItemProps> = ({ 
  capture, 
  index, 
  layoutMode 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handlePlay = () => {
    setIsLoaded(true);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Optionally unload iframe to save performance
    setTimeout(() => {
      if (!isPlaying) {
        setIsLoaded(false);
      }
    }, 5000);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  };

  const cardStyle = layoutMode === 'masonry' ? {
    height: `${getItemHeight()}px`,
    breakInside: 'avoid',
    marginBottom: '24px'
  } : {
    height: '400px'
  };

  return (
    <Card 
      ref={cardRef}
      className="group overflow-hidden bg-card hover:shadow-lg transition-all duration-300 relative"
      style={cardStyle}
    >
      <CardContent className="p-0 h-full relative">
        {!isLoaded ? (
          // Placeholder with thumbnail and play button
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Thumbnail placeholder */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+')] bg-cover bg-center opacity-50" />
            
            {/* Play button */}
            <Button
              onClick={handlePlay}
              size="lg"
              className="relative z-10 rounded-full w-16 h-16 bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
            >
              <Play size={24} className="ml-1" />
            </Button>
            
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
              <h3 className="font-semibold text-lg">{capture.title}</h3>
              <p className="text-sm opacity-75">Click to load Gaussian Splat</p>
            </div>
          </div>
        ) : isVisible ? (
          // Actual iframe content
          <div className="w-full h-full relative">
            <iframe
              ref={iframeRef}
              src={capture.embedUrl}
              className="w-full h-full border-none"
              title={capture.title}
              loading="lazy"
              allow="xr-spatial-tracking"
            />
            
            {/* Control overlay */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={handlePause}
                variant="secondary"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white border-none"
              >
                <Pause size={16} />
              </Button>
              <Button
                onClick={handleFullscreen}
                variant="secondary"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white border-none"
              >
                <Maximize2 size={16} />
              </Button>
            </div>
            
            {/* Title overlay for loaded content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <h3 className="font-medium text-white text-sm">{capture.title}</h3>
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
