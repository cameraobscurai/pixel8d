"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Images, 
  Sparkles, 
  Shuffle, 
  FileArchive, 
  Wrench,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

const navItems = [
  { href: "/", label: "Viewer", icon: Home },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/editor", label: "Editor", icon: Wrench },
  { href: "/effects", label: "Effects", icon: Sparkles },
  { href: "/stochastic", label: "Stochastic", icon: Shuffle },
  { href: "/sogs", label: "SOGS", icon: FileArchive },
];

export function GlassNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="glass-nav">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P8</span>
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Pixel8D
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
