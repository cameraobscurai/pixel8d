export interface Capture {
  id: string;
  title: string;
  source: string;
  thumbnail: string;
  description?: string;
  category: "scene" | "object" | "portrait";
  createdAt: Date;
  metadata?: {
    gaussianCount?: number;
    fileSize?: number;
  };
}

// Luma capture data with 7 captures (existing + 5 new)
export const CAPTURES: Capture[] = [
  {
    id: "e769d12e-a0ac-4338-93bd-a82f078e0efc",
    title: "Original Capture",
    source: "https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc",
    thumbnail: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop",
    description: "Main demonstration capture",
    category: "scene",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "ae068d93-1a5f-4696-a9c9-743931ea1e5b",
    title: "New Capture",
    source: "https://lumalabs.ai/capture/ae068d93-1a5f-4696-a9c9-743931ea1e5b",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    description: "Secondary demonstration capture",
    category: "object",
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "5feaf010-a229-4172-946c-0d0a21b83125",
    title: "Sparkle Scene A",
    source: "https://lumalabs.ai/capture/5feaf010-a229-4172-946c-0d0a21b83125",
    thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop",
    description: "Sparkle effect demonstration",
    category: "scene",
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "c95183e1-1887-4fc9-aee2-1f7f22f83709",
    title: "Sparkle Scene B",
    source: "https://lumalabs.ai/capture/c95183e1-1887-4fc9-aee2-1f7f22f83709",
    thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop",
    description: "Immersive sparkle capture",
    category: "scene",
    createdAt: new Date("2024-03-15"),
  },
  {
    id: "acd5c2c6-5bb9-40ba-8a64-853e7a40eba3",
    title: "Sparkle Scene C",
    source: "https://lumalabs.ai/capture/acd5c2c6-5bb9-40ba-8a64-853e7a40eba3",
    thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop",
    description: "Detailed sparkle environment",
    category: "scene",
    createdAt: new Date("2024-04-01"),
  },
  {
    id: "55669abc-4453-4efd-9934-48339c85581f",
    title: "Sparkle Scene D",
    source: "https://lumalabs.ai/capture/55669abc-4453-4efd-9934-48339c85581f",
    thumbnail: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&h=300&fit=crop",
    description: "Dynamic sparkle rendering",
    category: "object",
    createdAt: new Date("2024-04-15"),
  },
  {
    id: "c0d64d9e-a2af-41de-9b2c-c6cfd0e4db8b",
    title: "Sparkle Scene E",
    source: "https://lumalabs.ai/capture/c0d64d9e-a2af-41de-9b2c-c6cfd0e4db8b",
    thumbnail: "https://images.unsplash.com/photo-1500534314263-a834e34fe98d?w=400&h=300&fit=crop",
    description: "Expansive sparkle capture",
    category: "scene",
    createdAt: new Date("2024-05-01"),
  },
];

// Helper to get capture by ID
export function getCaptureById(id: string): Capture | undefined {
  return CAPTURES.find((capture) => capture.id === id);
}

// Helper to get captures by category
export function getCapturesByCategory(category: Capture["category"]): Capture[] {
  return CAPTURES.filter((capture) => capture.category === category);
}

// Get default capture
export function getDefaultCapture(): Capture {
  return CAPTURES[0];
}
