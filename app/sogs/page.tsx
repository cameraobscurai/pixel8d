import { Metadata } from "next";
import { SogsViewer } from "@/components/viewers/SogsViewer";

export const metadata: Metadata = {
  title: "SOGS Compression | Pixel8D",
  description: "Explore SOGS (Sorted Gaussian Splats) compression format with file size comparison and decompression metrics.",
};

export default function SogsPage() {
  return <SogsViewer />;
}
