
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3X3, Grid2X2, LayoutGrid } from 'lucide-react';
import { LumaGalleryItem } from '@/components/LumaGalleryItem';
import { CAPTURES } from '@/lib/captures';

type LayoutMode = 'masonry' | 'grid-2' | 'grid-3';

const Gallery = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid-3');
  const navigate = useNavigate();

  const handleCaptureClick = (captureId: string) => {
    navigate(`/?capture=${captureId}`);
  };

  const getGridClasses = () => {
    switch (layoutMode) {
      case 'grid-2':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 'grid-3':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'masonry':
      default:
        return 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  PIXEL8D Gallery
                </h1>
                <p className="text-sm text-muted-foreground">
                  {CAPTURES.length} Gaussian Splat captures
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={layoutMode === 'masonry' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('masonry')}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant={layoutMode === 'grid-2' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('grid-2')}
              >
                <Grid2X2 size={16} />
              </Button>
              <Button
                variant={layoutMode === 'grid-3' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('grid-3')}
              >
                <Grid3X3 size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="container mx-auto px-4 py-8">
        <div className={getGridClasses()}>
          {CAPTURES.map((capture, index) => (
            <LumaGalleryItem 
              key={capture.id}
              capture={capture}
              index={index}
              layoutMode={layoutMode}
              onCaptureClick={handleCaptureClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
