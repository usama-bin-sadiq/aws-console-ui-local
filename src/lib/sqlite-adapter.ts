/**
 * SQLite adapter service — client-safe recently visited services (matches SQLite DB schema)
 */

export interface RecentlyVisitedService {
  service: string;
  route: string;
  icon: string;
  timestamp: number;
}

export function getRecentlyVisited(): RecentlyVisitedService[] {
  return [];
}
