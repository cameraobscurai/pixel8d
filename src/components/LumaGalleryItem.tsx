
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  const getItemStyle = () => {
    if (layoutMode === 'masonry') {
      return {
        height: `${300 + (index % 3) * 100}px`,
        breakInside: 'avoid' as const,
        marginBottom: '1.5rem'
      };
    }
    return {
      height: '400px'
    };
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
      style={getItemStyle()}
    >
      <CardContent className="p-0 h-full">
        <div className="relative h-full">
          <iframe
            src={capture.embedUrl}
            className="w-full h-full border-0"
            title={capture.title}
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-white font-medium">{capture.title}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
