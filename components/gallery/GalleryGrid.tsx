"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, Grid2X2, LayoutGrid, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GalleryItem } from "./GalleryItem";
import type { Capture } from "@/lib/captures";

type LayoutMode = "masonry" | "grid-2" | "grid-3";
type SortBy = "newest" | "oldest" | "title";
type FilterCategory = "all" | "scene" | "object" | "portrait";

interface GalleryGridProps {
  captures: Capture[];
}

export function GalleryGrid({ captures }: GalleryGridProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");

  // Filter captures
  const filteredCaptures = captures.filter((capture) => {
    if (filterCategory === "all") return true;
    return capture.category === filterCategory;
  });

  // Sort captures
  const sortedCaptures = [...filteredCaptures].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getGridClasses = () => {
    switch (layoutMode) {
      case "grid-2":
        return "grid grid-cols-1 md:grid-cols-2 gap-6";
      case "grid-3":
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      case "masonry":
      default:
        return "columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6";
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass-toolbar p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Layout toggles */}
        <div className="flex items-center gap-1">
          <Button
            variant={layoutMode === "masonry" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLayoutMode("masonry")}
            className="gap-2"
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Masonry</span>
          </Button>
          <Button
            variant={layoutMode === "grid-2" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLayoutMode("grid-2")}
            className="gap-2"
          >
            <Grid2X2 size={16} />
            <span className="hidden sm:inline">2 Col</span>
          </Button>
          <Button
            variant={layoutMode === "grid-3" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLayoutMode("grid-3")}
            className="gap-2"
          >
            <Grid3X3 size={16} />
            <span className="hidden sm:inline">3 Col</span>
          </Button>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as FilterCategory)}>
              <SelectTrigger className="w-28 h-8 text-xs glass-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="scene">Scenes</SelectItem>
                <SelectItem value="object">Objects</SelectItem>
                <SelectItem value="portrait">Portraits</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-28 h-8 text-xs glass-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {sortedCaptures.length} capture{sortedCaptures.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className={getGridClasses()}>
        {sortedCaptures.map((capture, index) => (
          <GalleryItem
            key={capture.id}
            capture={capture}
            index={index}
            layoutMode={layoutMode}
          />
        ))}
      </div>

      {/* Empty state */}
      {sortedCaptures.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No captures found matching your filters.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterCategory("all")}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
