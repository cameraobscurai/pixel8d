import React from 'react';
import { SparkEffectsViewer } from '@/components/SparkEffectsViewer';
import { useActiveCapture } from '@/hooks/useActiveCapture';

const Effects = () => {
  const { captureId } = useActiveCapture();
  return <SparkEffectsViewer captureId={captureId} />;
};

export default Effects;
