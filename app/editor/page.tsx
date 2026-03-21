import { Metadata } from "next";
import { SplatEditor } from "@/components/editor/SplatEditor";

export const metadata: Metadata = {
  title: "Splat Editor | Pixel8D",
  description: "Drag-and-drop Gaussian Splat editor with cropping, transform controls, and SPZ export.",
};

export default function EditorPage() {
  return <SplatEditor />;
}
