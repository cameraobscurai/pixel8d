import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GlassNav } from "@/components/ui/glass-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pixel8D - Gaussian Splat Viewer & Editor",
  description: "Advanced 3D Gaussian Splat visualization platform with direct Luma integration, effects editor, and compression tools.",
  keywords: ["gaussian splat", "3D viewer", "luma", "webgl", "three.js", "splat editor"],
  authors: [{ name: "Pixel8D" }],
  openGraph: {
    title: "Pixel8D - Gaussian Splat Viewer & Editor",
    description: "Advanced 3D Gaussian Splat visualization platform",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="relative min-h-screen">
              <GlassNav />
              <main>{children}</main>
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
