"use client";

import { useState, useEffect } from "react";

export interface ResponsiveState {
  isCompact: boolean;
  isMobile: boolean;
  isTablet: boolean;
  width: number;
}

const COMPACT_BREAKPOINT = 960;
const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 768;

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isCompact: false,
    isMobile: false,
    isTablet: false,
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setState({
        isCompact: width < COMPACT_BREAKPOINT,
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width < TABLET_BREAKPOINT,
        width,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return state;
}
