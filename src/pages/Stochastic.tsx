import React from 'react';
import { StochasticViewer } from '@/components/StochasticViewer';
import { useActiveCapture } from '@/hooks/useActiveCapture';

const Stochastic = () => {
  const { captureId } = useActiveCapture();
  return <StochasticViewer captureId={captureId} />;
};

export default Stochastic;
