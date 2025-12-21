
export interface Drop {
  id: string; // The number from "DROP X"
  time: string;
  rawValues: string[]; // All occurrences for stats
  uniqueValues: string[]; // Deduplicated for display
}

export interface GlobalStats {
  value: string;
  count: number;
}

export enum ViewMode {
  DROPS = 'DROPS',
  STATS = 'STATS'
}
