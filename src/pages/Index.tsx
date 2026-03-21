
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Images, Sparkles, Shuffle, FileArchive } from 'lucide-react';
import { LumaSplatViewer } from '@/components/LumaSplatViewer';

// Available captures
const AVAILABLE_CAPTURES = {
  'e769d12e-a0ac-4338-93bd-a82f078e0efc': {
    title: 'Original Capture',
    source: 'https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc'
  },
  'ae068d93-1a5f-4696-a9c9-743931ea1e5b': {
    title: 'New Capture', 
    source: 'https://lumalabs.ai/capture/ae068d93-1a5f-4696-a9c9-743931ea1e5b'
  }
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const [currentCapture, setCurrentCapture] = useState<string>('e769d12e-a0ac-4338-93bd-a82f078e0efc');

  useEffect(() => {
    const captureParam = searchParams.get('capture');
    if (captureParam && AVAILABLE_CAPTURES[captureParam as keyof typeof AVAILABLE_CAPTURES]) {
      setCurrentCapture(captureParam);
    }
  }, [searchParams]);

  const captureData = AVAILABLE_CAPTURES[currentCapture as keyof typeof AVAILABLE_CAPTURES];

  return (
    <div className="relative">
      {/* Gallery navigation button */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Link to="/sogs">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <FileArchive size={16} />
            SOGS
          </Button>
        </Link>
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
      
      {/* Current capture info */}
      <div className="absolute top-4 left-4 z-50">
        <div className="glass-container p-3 rounded-lg bg-background/80 backdrop-blur">
          <p className="text-sm font-medium">{captureData.title}</p>
        </div>
      </div>
      
      <LumaSplatViewer captureSource={captureData.source} />
    </div>
  );
};

export default Index;
