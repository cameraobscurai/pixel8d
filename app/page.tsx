"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { LumaSplatViewer } from "@/components/viewers/LumaSplatViewer";
import { CAPTURES, getCaptureById, getDefaultCapture } from "@/lib/captures";
import { Loader2 } from "lucide-react";

function ViewerContent() {
  const searchParams = useSearchParams();
  const captureId = searchParams.get("capture");

  const currentCapture = useMemo(() => {
    if (captureId) {
      return getCaptureById(captureId) || getDefaultCapture();
    }
    return getDefaultCapture();
  }, [captureId]);

  return (
    <div className="relative pt-16">
      {/* Capture info overlay */}
      <div className="absolute top-20 left-4 z-40">
        <div className="glass-card p-3 animate-in">
          <p className="text-sm font-medium text-foreground">{currentCapture.title}</p>
          {currentCapture.description && (
            <p className="text-xs text-muted-foreground mt-1">{currentCapture.description}</p>
          )}
        </div>
      </div>

      <LumaSplatViewer
        captureSource={currentCapture.source}
        className="h-[calc(100vh-64px)]"
        showToolbar={true}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center pt-16">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading viewer...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ViewerContent />
    </Suspense>
  );
}
