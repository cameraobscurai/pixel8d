import React from 'react';
import { LumaSplatViewer } from '@/components/LumaSplatViewer';
import { useActiveCapture } from '@/hooks/useActiveCapture';

const Index = () => {
  const { capture, captureId } = useActiveCapture();

  return (
    <LumaSplatViewer
      captureSource={capture.source}
      captureId={captureId}
      captureTitle={capture.title}
    />
  );
};

export default Index;
