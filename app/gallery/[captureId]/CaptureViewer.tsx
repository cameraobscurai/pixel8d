"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { LumaSplatViewer } from "@/components/viewers/LumaSplatViewer";
import type { Capture } from "@/lib/captures";

interface CaptureViewerProps {
  capture: Capture;
}

export function CaptureViewer({ capture }: CaptureViewerProps) {
  const formattedDate = new Date(capture.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative pt-16">
      {/* Top bar with capture info */}
      <div className="absolute top-20 left-4 right-4 z-40 flex items-start justify-between">
        {/* Back button and capture info */}
        <div className="flex items-start gap-4">
          <Link href="/gallery">
            <Button variant="outline" size="sm" className="glass-button">
              <ArrowLeft size={16} className="mr-2" />
              Gallery
            </Button>
          </Link>

          <div className="glass-card p-4 animate-in">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-lg font-semibold">{capture.title}</h1>
              <Badge variant="secondary" className="capitalize text-xs">
                {capture.category}
              </Badge>
            </div>
            {capture.description && (
              <p className="text-sm text-muted-foreground mb-2">{capture.description}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* External link */}
        <Button
          variant="outline"
          size="sm"
          className="glass-button"
          onClick={() => window.open(`https://lumalabs.ai/capture/${capture.id}`, "_blank")}
        >
          <ExternalLink size={16} className="mr-2" />
          View on Luma
        </Button>
      </div>

      {/* Full-screen viewer */}
      <LumaSplatViewer
        captureSource={capture.source}
        className="h-[calc(100vh-64px)]"
        showToolbar={true}
      />
    </div>
  );
}
