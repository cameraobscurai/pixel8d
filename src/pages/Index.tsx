
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gallery as GalleryIcon } from 'lucide-react';
import { LumaSplatViewer } from '@/components/LumaSplatViewer';

const Index = () => {
  return (
    <div className="relative">
      {/* Gallery navigation button */}
      <div className="absolute top-4 right-4 z-50">
        <Link to="/gallery">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <GalleryIcon size={16} />
            Gallery
          </Button>
        </Link>
      </div>
      
      <LumaSplatViewer />
    </div>
  );
};

export default Index;
