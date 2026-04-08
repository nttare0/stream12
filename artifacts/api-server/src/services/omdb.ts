const OMDB_BASE = "https://www.omdbapi.com";

export interface OmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: "movie" | "series" | "episode";
  Poster: string;
}

export interface OmdbDetail {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Poster: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: "movie" | "series";
  totalSeasons?: string;
  Response: "True" | "False";
  Error?: string;
}

function apiKey() {
  const k = process.env.OMDB_API_KEY;
  if (!k) throw new Error("OMDB_API_KEY not set");
  return k;
}

export async function searchOmdb(query: string, type?: "movie" | "series"): Promise<OmdbSearchItem[]> {
  const params = new URLSearchParams({ s: query, apikey: apiKey() });
  if (type) params.set("type", type);
  const res = await fetch(`${OMDB_BASE}/?${params}`);
  const data = await res.json();
  if (data.Response === "False") return [];
  return (data.Search ?? []) as OmdbSearchItem[];
}

export async function getOmdbById(imdbId: string): Promise<OmdbDetail | null> {
  const params = new URLSearchParams({ i: imdbId, apikey: apiKey(), plot: "full" });
  const res = await fetch(`${OMDB_BASE}/?${params}`);
  const data = await res.json();
  if (data.Response === "False") return null;
  return data as OmdbDetail;
}

export async function getOmdbByTitle(title: string, type?: "movie" | "series"): Promise<OmdbDetail | null> {
  const params = new URLSearchParams({ t: title, apikey: apiKey(), plot: "full" });
  if (type) params.set("type", type);
  const res = await fetch(`${OMDB_BASE}/?${params}`);
  const data = await res.json();
  if (data.Response === "False") return null;
  return data as OmdbDetail;
}

export type ShowType = "movie" | "tv" | "anime";

const KNOWN_ANIME_IDS = new Set([
  "tt2560140", // Attack on Titan
  "tt12343534", // Jujutsu Kaisen
  "tt0388629", // One Piece
  "tt0213338", // Cowboy Bebop
  "tt9335498", // Demon Slayer
  "tt11032374", // Chainsaw Man
  "tt0245429", // Spirited Away
  "tt0169547", // My Neighbor Totoro
  "tt4508902", // Your Name
  "tt0417299", // Fullmetal Alchemist: Brotherhood
]);

export function mapOmdbToShow(
  detail: OmdbDetail,
  overrides?: {
    type?: ShowType;
    trending?: boolean;
    featured?: boolean;
    episodes?: number | null;
  }
) {
  const isJapanese = (detail.Country || "").includes("Japan");
  const isAnimation = (detail.Genre || "").includes("Animation");

  let type: ShowType;
  if (overrides?.type) {
    type = overrides.type;
  } else if (KNOWN_ANIME_IDS.has(detail.imdbID) || (isJapanese && isAnimation)) {
    type = "anime";
  } else if (detail.Type === "movie") {
    type = "movie";
  } else {
    type = "tv";
  }

  const rating = parseFloat(detail.imdbRating) || 0;

  const yearStr = (detail.Year || "").replace(/[–\-].*/, "").trim();
  const year = parseInt(yearStr) || new Date().getFullYear();

  const durationStr = (detail.Runtime || "").replace(/\s*min.*/i, "").trim();
  const duration = parseInt(durationStr) || null;

  const genres = (detail.Genre || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 5);

  const hasEndYear = /\d{4}–\d{4}/.test(detail.Year || "");
  const isOpen = (detail.Year || "").includes("–") && !hasEndYear;
  const status = isOpen ? "ongoing" : "completed";

  const omdbEpisodes = detail.totalSeasons
    ? parseInt(detail.totalSeasons) * 12
    : null;
  const episodes =
    type === "movie"
      ? null
      : overrides?.episodes !== undefined
      ? overrides.episodes
      : omdbEpisodes;

  const poster =
    detail.Poster && detail.Poster !== "N/A"
      ? detail.Poster
      : `https://placehold.co/300x450/1a1a2e/orange?text=${encodeURIComponent(detail.Title)}`;

  return {
    title: detail.Title,
    type,
    description: detail.Plot && detail.Plot !== "N/A" ? detail.Plot : "No description available.",
    genres,
    year,
    rating,
    posterUrl: poster,
    backdropUrl: poster,
    episodes,
    duration: type === "movie" ? duration : null,
    status: status as "ongoing" | "completed" | "upcoming",
    trending: overrides?.trending ?? false,
    featured: overrides?.featured ?? false,
  };
}
