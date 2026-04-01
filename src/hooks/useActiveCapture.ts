import { useSearchParams } from 'react-router-dom';
import { CAPTURES_BY_ID, DEFAULT_CAPTURE_ID } from '@/lib/captures';

export const useActiveCapture = () => {
  const [searchParams] = useSearchParams();
  const requestedCaptureId = searchParams.get('capture');
  const captureId = requestedCaptureId && CAPTURES_BY_ID[requestedCaptureId]
    ? requestedCaptureId
    : DEFAULT_CAPTURE_ID;

  return {
    captureId,
    capture: CAPTURES_BY_ID[captureId],
  };
};
