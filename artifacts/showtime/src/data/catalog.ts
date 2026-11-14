/** The show shape the UI works with. Every record comes from IMDb via `omdb.ts`. */

export type ShowType = "movie" | "anime" | "tv";
export type ShowStatus = "ongoing" | "completed" | "upcoming";

export interface CatalogShow {
  id: number;
  title: string;
  type: ShowType;
  description: string;
  genres: string[];
  year: number;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
  episodes?: number | null;
  duration?: number | null;
  status: ShowStatus;
  trending: boolean;
  featured: boolean;
  createdAt: string;
}
