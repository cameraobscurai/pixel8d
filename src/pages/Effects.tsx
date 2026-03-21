import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Images } from 'lucide-react';
import { SparkEffectsViewer } from '@/components/SparkEffectsViewer';

const Effects = () => {
  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="absolute top-4 left-4 z-50">
        <Link to="/">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <ArrowLeft size={16} />
            Viewer
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-50">
        <Link to="/gallery">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <Images size={16} />
            Gallery
          </Button>
        </Link>
      </div>

      <SparkEffectsViewer />
    </div>
  );
};

export default Effects;
