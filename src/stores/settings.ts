"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  region: string;
  setRegion: (region: string) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  provider: "localstack" | "ministack" | "unknown";
  setProvider: (provider: "localstack" | "ministack" | "unknown") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      region: "us-east-1",
      setRegion: (region) => set({ region }),
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      provider: "unknown",
      setProvider: (provider) => set({ provider }),
    }),
    {
      name: "aws-console-settings",
    }
  )
);
