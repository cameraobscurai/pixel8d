
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Images, Sparkles, Shuffle, FileArchive, Wrench } from 'lucide-react';
import { LumaSplatViewer } from '@/components/LumaSplatViewer';
import { CAPTURES_BY_ID, DEFAULT_CAPTURE_ID } from '@/lib/captures';

const Index = () => {
  const [searchParams] = useSearchParams();
  const [currentCapture, setCurrentCapture] = useState(DEFAULT_CAPTURE_ID);

  useEffect(() => {
    const captureParam = searchParams.get('capture');
    if (captureParam && CAPTURES_BY_ID[captureParam]) {
      setCurrentCapture(captureParam);
    }
  }, [searchParams]);

  const captureData = CAPTURES_BY_ID[currentCapture];

  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Link to={`/editor?capture=${currentCapture}`}>
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur" size="sm">
            <Wrench size={14} />
            Editor
          </Button>
        </Link>
        <Link to="/sogs">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur" size="sm">
            <FileArchive size={14} />
            SOGS
          </Button>
        </Link>
        <Link to="/stochastic">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur" size="sm">
            <Shuffle size={14} />
            Stochastic
          </Button>
        </Link>
        <Link to="/effects">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur" size="sm">
            <Sparkles size={14} />
            Effects
          </Button>
        </Link>
        <Link to="/gallery">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur" size="sm">
            <Images size={14} />
            Gallery
          </Button>
        </Link>
      </div>
      
      {/* Current capture info */}
      <div className="absolute top-4 left-4 z-50">
        <div className="glass-container p-3 rounded-lg bg-background/80 backdrop-blur">
          <p className="text-sm font-medium">{captureData?.title}</p>
        </div>
      </div>
      
      <LumaSplatViewer captureSource={captureData?.source} />
    </div>
  );
};

export default Index;
