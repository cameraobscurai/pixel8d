interface LumaArtifact {
  type: string;
  url: string;
}

interface LumaPublicCaptureResponse {
  response?: {
    artifacts?: LumaArtifact[];
  };
}

const LUMA_CAPTURE_API = 'https://webapp.engineeringlumalabs.com/api/v3/captures';

export const fetchCaptureArtifacts = async (captureId: string): Promise<LumaArtifact[]> => {
  const response = await fetch(`${LUMA_CAPTURE_API}/${captureId}/public`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Luma capture ${captureId}`);
  }

  const data = await response.json() as LumaPublicCaptureResponse;
  return data.response?.artifacts ?? [];
};

export const fetchCaptureSplatUrl = async (captureId: string): Promise<string> => {
  const artifacts = await fetchCaptureArtifacts(captureId);

  const preferredArtifact = artifacts.find((artifact) => artifact.type === 'gaussian_splatting_point_cloud.ply');
  if (preferredArtifact?.url) {
    return preferredArtifact.url;
  }

  const fallbackArtifact = artifacts.find((artifact) => /\.(ply|spz|splat|ksplat|zip)(\?|$)/i.test(artifact.url));
  if (fallbackArtifact?.url) {
    return fallbackArtifact.url;
  }

  throw new Error(`No Spark-compatible splat artifact found for capture ${captureId}`);
};
