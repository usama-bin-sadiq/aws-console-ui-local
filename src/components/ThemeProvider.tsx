"use client";

import React, { useEffect, useState } from "react";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState("dark" as Mode);

  useEffect(() => {
    applyMode(mode as Mode);
  }, [mode]);

  useEffect(() => {
    const saved = localStorage.getItem("aws-console-theme") as Mode | null;
    if (saved) setMode(saved);
  }, []);

  const toggleTheme = () => {
    const next = (mode === "dark" ? "light" : "dark") as Mode;
    setMode(next);
    applyMode(next);
    localStorage.setItem("aws-console-theme", next);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const ThemeContext = React.createContext<{
  mode: Mode;
  toggleTheme: () => void;
}>({ mode: "dark" as Mode, toggleTheme: () => {} });
