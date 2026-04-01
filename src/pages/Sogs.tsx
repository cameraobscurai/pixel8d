import React from 'react';
import { SogsViewer } from '@/components/SogsViewer';
import { useActiveCapture } from '@/hooks/useActiveCapture';

const Sogs = () => {
  const { captureId } = useActiveCapture();
  return <SogsViewer captureId={captureId} />;
};

export default Sogs;
