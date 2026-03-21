import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAPTURES, getCaptureById } from "@/lib/captures";
import { CaptureViewer } from "./CaptureViewer";

interface CapturePageProps {
  params: Promise<{ captureId: string }>;
}

export async function generateStaticParams() {
  return CAPTURES.map((capture) => ({
    captureId: capture.id,
  }));
}

export async function generateMetadata({ params }: CapturePageProps): Promise<Metadata> {
  const { captureId } = await params;
  const capture = getCaptureById(captureId);

  if (!capture) {
    return {
      title: "Capture Not Found | Pixel8D",
    };
  }

  return {
    title: `${capture.title} | Pixel8D Gallery`,
    description: capture.description || `View ${capture.title} in our immersive 3D Gaussian Splat viewer.`,
    openGraph: {
      title: `${capture.title} | Pixel8D`,
      description: capture.description,
      images: [capture.thumbnail],
    },
  };
}

export default async function CapturePage({ params }: CapturePageProps) {
  const { captureId } = await params;
  const capture = getCaptureById(captureId);

  if (!capture) {
    notFound();
  }

  return <CaptureViewer capture={capture} />;
}
