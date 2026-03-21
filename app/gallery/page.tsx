import { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { CAPTURES } from "@/lib/captures";

export const metadata: Metadata = {
  title: "Gallery | Pixel8D",
  description: "Explore our collection of Gaussian Splat captures with immersive 3D viewing.",
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-in">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-balance">
            Gaussian Splat Gallery
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Explore our collection of high-quality 3D Gaussian Splat captures. Click any item to
            view it in the immersive 3D viewer.
          </p>
        </div>

        {/* Gallery Grid */}
        <GalleryGrid captures={CAPTURES} />
      </div>
    </div>
  );
}
