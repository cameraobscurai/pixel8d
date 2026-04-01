import React from 'react';
import { SplatEditor } from '@/components/SplatEditor';
import { useActiveCapture } from '@/hooks/useActiveCapture';

const Editor = () => {
  const { captureId } = useActiveCapture();
  return <SplatEditor captureId={captureId} />;
};

export default Editor;
