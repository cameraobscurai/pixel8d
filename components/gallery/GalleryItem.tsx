"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Capture } from "@/lib/captures";

interface GalleryItemProps {
  capture: Capture;
  index: number;
  layoutMode: "masonry" | "grid-2" | "grid-3";
}

export function GalleryItem({ capture, index, layoutMode }: GalleryItemProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Dynamic height for masonry layout
  const getItemHeight = () => {
    const baseHeights = [320, 400, 360, 440, 380];
    return baseHeights[index % baseHeights.length];
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://lumalabs.ai/capture/${capture.id}`, "_blank");
  };

  const formattedDate = new Date(capture.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const cardStyle =
    layoutMode === "masonry"
      ? {
          height: `${getItemHeight()}px`,
          breakInside: "avoid" as const,
          marginBottom: "24px",
        }
      : {
          height: "400px",
        };

  return (
    <Link href={`/?capture=${capture.id}`}>
      <Card
        ref={cardRef}
        className={cn(
          "group overflow-hidden bg-card/50 backdrop-blur-sm border-border/50",
          "hover:shadow-xl hover:border-primary/30 transition-all duration-300",
          "cursor-pointer relative"
        )}
        style={cardStyle}
      >
        <CardContent className="p-0 h-full relative">
          {isVisible ? (
            <div className="w-full h-full relative">
              {/* Thumbnail Image */}
              <Image
                src={capture.thumbnail}
                alt={capture.title}
                fill
                className={cn(
                  "object-cover transition-all duration-500",
                  isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
                  "group-hover:scale-110"
                )}
                onLoad={() => setIsImageLoaded(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {/* Loading placeholder */}
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-muted animate-pulse flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">Loading...</div>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                {/* Top controls */}
                <div className="flex justify-between items-start">
                  <Badge
                    variant="secondary"
                    className="bg-black/40 text-white border-none text-xs capitalize"
                  >
                    {capture.category}
                  </Badge>
                  <Button
                    onClick={handlePreviewClick}
                    variant="secondary"
                    size="sm"
                    className="bg-black/40 hover:bg-black/60 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>

                {/* Bottom content */}
                <div className="space-y-3">
                  {/* View button */}
                  <div className="flex justify-center">
                    <div className="rounded-full w-14 h-14 bg-primary/90 flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                      <Eye size={22} />
                    </div>
                  </div>

                  {/* Title and description */}
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1 text-balance">{capture.title}</h3>
                    {capture.description && (
                      <p className="text-sm opacity-80 line-clamp-2">{capture.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-1 mt-2 opacity-60 text-xs">
                      <Calendar size={12} />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
