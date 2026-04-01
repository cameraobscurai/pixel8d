import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SplatEditor } from '@/components/SplatEditor';

const Editor = () => {
  const [searchParams] = useSearchParams();
  const captureId = searchParams.get('capture');
  
  return <SplatEditor captureId={captureId} />;
};

export default Editor;
