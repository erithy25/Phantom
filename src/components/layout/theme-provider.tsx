"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/store";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
