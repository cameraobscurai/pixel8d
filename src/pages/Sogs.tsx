import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Images, Sparkles, Shuffle } from 'lucide-react';
import { SogsViewer } from '@/components/SogsViewer';

const Sogs = () => {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-50">
        <Link to="/">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <ArrowLeft size={16} />
            Viewer
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Link to="/stochastic">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <Shuffle size={16} />
            Stochastic
          </Button>
        </Link>
        <Link to="/effects">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <Sparkles size={16} />
            Effects
          </Button>
        </Link>
        <Link to="/gallery">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <Images size={16} />
            Gallery
          </Button>
        </Link>
      </div>

      <SogsViewer />
    </div>
  );
};

export default Sogs;
