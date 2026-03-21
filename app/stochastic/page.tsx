import { Metadata } from "next";
import { StochasticViewer } from "@/components/viewers/StochasticViewer";

export const metadata: Metadata = {
  title: "Stochastic Rendering | Pixel8D",
  description: "Test probabilistic splat rendering for performance optimization with real-time metrics.",
};

export default function StochasticPage() {
  return <StochasticViewer />;
}
