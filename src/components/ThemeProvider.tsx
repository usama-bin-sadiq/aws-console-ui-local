"use client";

/**
 * ThemeProvider.
 *
 * Theme is owned by `useSettingsStore`. This provider no longer keeps its own
 * copy: it used to, which meant two stores could disagree -- the shell would
 * render light while `data-aws-theme` on <html> said dark, so every stylesheet
 * keyed off that attribute picked the wrong palette. Three call sites read the
 * settings store, so the store is the natural source of truth and this
 * component's job is now purely to publish it to the DOM for CSS.
 */

import React, { createContext, useContext, useEffect, useCallback } from "react";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { useSettingsStore } from "@/stores/settings";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme);
  const setThemeStore = useSettingsStore((state) => state.setTheme);

  useEffect(() => {
    applyMode(theme as Mode);
    document.documentElement.setAttribute("data-aws-theme", theme);
    // Kept in sync for anything that reads this key directly.
    localStorage.setItem("aws-console-theme", theme);
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeStore(newTheme);
    },
    [setThemeStore],
  );

  const toggleTheme = useCallback(() => {
    setThemeStore(theme === "light" ? "dark" : "light");
  }, [theme, setThemeStore]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
