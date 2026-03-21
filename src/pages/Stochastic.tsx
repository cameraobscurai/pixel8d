import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Images, Sparkles } from 'lucide-react';
import { StochasticViewer } from '@/components/StochasticViewer';

const Stochastic = () => {
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

      <StochasticViewer />
    </div>
  );
};

export default Stochastic;
