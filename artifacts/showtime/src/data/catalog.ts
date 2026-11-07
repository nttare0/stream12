/**
 * In-code catalog.
 *
 * The show data ships with the app bundle — there is no API server and no
 * database. Records were derived from IMDb data via OMDB and are served
 * entirely client-side by `local-api.ts`.
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
