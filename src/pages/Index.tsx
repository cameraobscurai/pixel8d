
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Images, Sparkles, Shuffle, FileArchive, Wrench } from 'lucide-react';
import { LumaSplatViewer } from '@/components/LumaSplatViewer';

// Available captures
const AVAILABLE_CAPTURES: Record<string, { title: string; source: string }> = {
  'e769d12e-a0ac-4338-93bd-a82f078e0efc': {
    title: 'Original Capture',
    source: 'https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc'
  },
  'ae068d93-1a5f-4696-a9c9-743931ea1e5b': {
    title: 'New Capture',
    source: 'https://lumalabs.ai/capture/ae068d93-1a5f-4696-a9c9-743931ea1e5b'
  },
  '5feaf010-a229-4172-946c-0d0a21b83125': {
    title: 'Sparkle Scene A',
    source: 'https://lumalabs.ai/capture/5feaf010-a229-4172-946c-0d0a21b83125'
  },
  'c95183e1-1887-4fc9-aee2-1f7f22f83709': {
    title: 'Sparkle Scene B',
    source: 'https://lumalabs.ai/capture/c95183e1-1887-4fc9-aee2-1f7f22f83709'
  },
  'acd5c2c6-5bb9-40ba-8a64-853e7a40eba3': {
    title: 'Sparkle Scene C',
    source: 'https://lumalabs.ai/capture/acd5c2c6-5bb9-40ba-8a64-853e7a40eba3'
  },
  '55669abc-4453-4efd-9934-48339c85581f': {
    title: 'Sparkle Scene D',
    source: 'https://lumalabs.ai/capture/55669abc-4453-4efd-9934-48339c85581f'
  },
  'c0d64d9e-a2af-41de-9b2c-c6cfd0e4db8b': {
    title: 'Sparkle Scene E',
    source: 'https://lumalabs.ai/capture/c0d64d9e-a2af-41de-9b2c-c6cfd0e4db8b'
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
        <Link to="/editor">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <Wrench size={16} />
            Editor
          </Button>
        </Link>
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
