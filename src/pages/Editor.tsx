import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SplatEditor } from '@/components/SplatEditor';

const Editor = () => {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-50">
        <Link to="/">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <ArrowLeft size={16} />
            Back
          </Button>
        </Link>
      </div>
      <SplatEditor />
    </div>
  );
};

export default Editor;
