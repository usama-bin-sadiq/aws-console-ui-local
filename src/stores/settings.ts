"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteItem {
  serviceId: string;
  serviceName: string;
  serviceHref: string;
}

interface SettingsState {
  region: string;
  setRegion: (region: string) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  provider: "localstack" | "ministack" | "localemu" | "unknown";
  setProvider: (provider: "localstack" | "ministack" | "localemu" | "unknown") => void;
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (serviceId: string) => void;
  reorderFavorites: (newOrder: FavoriteItem[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      region: "us-east-1",
      setRegion: (region) => set({ region }),
      // Light is the design's default and matches the real console; dark stays
      // available through the header toggle.
      theme: "light",
      setTheme: (theme) => set({ theme }),
      provider: "unknown",
      setProvider: (provider: "localstack" | "ministack" | "localemu" | "unknown") =>
        set({ provider }),
      favorites: [],
      addFavorite: (item) =>
        set((state) => {
          const exists = state.favorites.find((f) => f.serviceId === item.serviceId);
          if (exists) return state;
          return { favorites: [...state.favorites, item] };
        }),
      removeFavorite: (serviceId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.serviceId !== serviceId),
        })),
      reorderFavorites: (newOrder) => set({ favorites: newOrder }),
    }),
    {
      name: "aws-console-settings",
      skipHydration: true,
    },
  ),
);
