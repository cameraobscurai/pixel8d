
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3X3, Grid2X2, LayoutGrid } from 'lucide-react';
import { LumaGalleryItem } from '@/components/LumaGalleryItem';

interface LumaCapture {
  id: string;
  title: string;
  embedUrl: string;
  thumbnail?: string;
}

const LUMA_CAPTURES: LumaCapture[] = [
  {
    id: 'e769d12e-a0ac-4338-93bd-a82f078e0efc',
    title: 'Original Capture',
    embedUrl: 'https://lumalabs.ai/embed/e769d12e-a0ac-4338-93bd-a82f078e0efc?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false'
  },
  {
    id: 'ae068d93-1a5f-4696-a9c9-743931ea1e5b',
    title: 'New Capture',
    embedUrl: 'https://lumalabs.ai/embed/ae068d93-1a5f-4696-a9c9-743931ea1e5b?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false'
  }
];

type LayoutMode = 'masonry' | 'grid-2' | 'grid-3';

const Gallery = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('masonry');

  const getGridClasses = () => {
    switch (layoutMode) {
      case 'grid-2':
        return 'grid-cols-1 md:grid-cols-2';
      case 'grid-3':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'masonry':
      default:
        return 'columns-1 md:columns-2 lg:columns-3 xl:columns-4';
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
                  Back to Viewer
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  PIXEL8D Gallery
                </h1>
                <p className="text-sm text-muted-foreground">
                  Explore our collection of Gaussian Splat captures
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={layoutMode === 'masonry' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('masonry')}
                className="gap-2"
              >
                <LayoutGrid size={16} />
                Masonry
              </Button>
              <Button
                variant={layoutMode === 'grid-2' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('grid-2')}
                className="gap-2"
              >
                <Grid2X2 size={16} />
                Grid 2x2
              </Button>
              <Button
                variant={layoutMode === 'grid-3' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('grid-3')}
                className="gap-2"
              >
                <Grid3X3 size={16} />
                Grid 3x3
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="container mx-auto px-4 py-8">
        <div className={`${layoutMode === 'masonry' ? getGridClasses() : `grid ${getGridClasses()}`} gap-6`}>
          {LUMA_CAPTURES.map((capture, index) => (
            <LumaGalleryItem 
              key={capture.id}
              capture={capture}
              index={index}
              layoutMode={layoutMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
