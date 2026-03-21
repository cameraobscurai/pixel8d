import { Metadata } from "next";
import { SparkEffectsViewer } from "@/components/effects/SparkEffectsViewer";

export const metadata: Metadata = {
  title: "Effects | Pixel8D",
  description: "Explore stunning splat reveal effects including Magic, Spread, Unroll, and more.",
};

export default function EffectsPage() {
  return <SparkEffectsViewer />;
}
