"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "absolute rotate-90 scale-0 opacity-0"}`}
      />
      <Moon
        className={`h-4 w-4 transition-all duration-300 ${isDark ? "absolute -rotate-90 scale-0 opacity-0" : "rotate-0 scale-100"}`}
      />
    </Button>
  );
}
