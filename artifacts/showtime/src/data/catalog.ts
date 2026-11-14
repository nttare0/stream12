/**
 * Bundled fallback catalog.
 *
 * The app's data comes live from IMDb (see `imdb.ts`). This small snapshot
 * ships in the bundle only so the site still has something to show when the
 * IMDb API cannot be reached. It also defines the show shape the UI uses.
 */
import raw from "./catalog.json";

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

export const shows: CatalogShow[] = raw.shows as CatalogShow[];

export const genres: string[] = raw.genres as string[];
