/**
 * Live IMDb data, fetched straight from the browser.
 *
 * Source: https://imdbapi.dev — a free REST API over IMDb data that needs no
 * API key. There is no server of ours in between: the browser calls it
 * directly and `local-api.ts` reshapes the answers into the `/api/*` responses
 * the UI was written against.
 *
 * Override the endpoint with `VITE_IMDB_API_URL` (e.g. for a mock in tests).
 */
import type { CatalogShow, ShowType } from "./catalog";

const BASE_URL: string = (
  (import.meta.env.VITE_IMDB_API_URL as string | undefined) ?? "https://api.imdbapi.dev"
).replace(/\/$/, "");

const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_PREFIX = "imdb:v1:";

// ---------------------------------------------------------------------------
// Wire types (only the fields we read)
// ---------------------------------------------------------------------------

interface ImdbTitle {
  id: string;
  type?: string;
  isAdult?: boolean;
  primaryTitle?: string;
  originalTitle?: string;
  primaryImage?: { url?: string; width?: number; height?: number };
  startYear?: number;
  endYear?: number;
  runtimeSeconds?: number;
  genres?: string[];
  rating?: { aggregateRating?: number; voteCount?: number };
  plot?: string;
  originCountries?: { code?: string; name?: string }[];
}

interface ListTitlesResponse {
  titles?: ImdbTitle[];
  totalCount?: number;
  nextPageToken?: string;
}

interface SeasonsResponse {
  seasons?: { season?: string; episodeCount?: number }[];
}

type Params = Record<string, string | number | string[] | undefined>;

// ---------------------------------------------------------------------------
// HTTP + caching
// ---------------------------------------------------------------------------

const inflight = new Map<string, Promise<unknown>>();

function readCache<T>(key: string): T | undefined {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as { at: number; data: T };
    if (Date.now() - entry.at > CACHE_TTL_MS) return undefined;
    return entry.data;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, data: unknown): void {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Storage full or unavailable — the in-memory cache still applies.
  }
}

function buildUrl(path: string, params: Params): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else query.append(key, String(value));
  }
  const qs = query.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ""}`;
}

async function fetchJson<T>(url: string, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      return fetchJson<T>(url, attempt + 1);
    }
    if (!res.ok) throw new ImdbError(`IMDb API responded ${res.status}`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export class ImdbError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

function get<T>(path: string, params: Params = {}): Promise<T> {
  const url = buildUrl(path, params);

  const cached = readCache<T>(url);
  if (cached !== undefined) return Promise.resolve(cached);

  const pending = inflight.get(url) as Promise<T> | undefined;
  if (pending) return pending;

  const request = fetchJson<T>(url)
    .then((data) => {
      writeCache(url, data);
      return data;
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, request);
  return request;
}

// ---------------------------------------------------------------------------
// IMDb id <-> numeric id
// ---------------------------------------------------------------------------

/** "tt0111161" -> 111161. The UI and its routes use numeric ids. */
export function toNumericId(imdbId: string): number {
  return Number(imdbId.replace(/^tt/, ""));
}

/** 111161 -> "tt0111161". */
export function toImdbId(id: number | string): string {
  return `tt${String(id).replace(/^tt/, "").padStart(7, "0")}`;
}

// ---------------------------------------------------------------------------
// Mapping IMDb titles onto the app's show shape
// ---------------------------------------------------------------------------

const MOVIE_KINDS = new Set(["movie", "tvmovie", "tvspecial", "video"]);
const TV_KINDS = new Set(["tvseries", "tvminiseries"]);

function kindOf(title: ImdbTitle): string {
  return (title.type ?? "").toLowerCase().replace(/_/g, "");
}

function classify(title: ImdbTitle): ShowType | null {
  const kind = kindOf(title);
  const isMovie = MOVIE_KINDS.has(kind);
  const isTv = TV_KINDS.has(kind);
  if (!isMovie && !isTv) return null;

  const animated = (title.genres ?? []).includes("Animation");
  const japanese = (title.originCountries ?? []).some((c) => c.code === "JP");
  if (animated && japanese) return "anime";

  return isMovie ? "movie" : "tv";
}

/** IMDb serves posters from Amazon's image CDN, which resizes on request. */
function sizedImage(url: string, width: number): string {
  if (!url.includes("media-amazon.com")) return url;
  return url.replace(/\._V1_.*(\.\w+)$/, `._V1_QL75_UX${width}_$1`);
}

function placeholder(title: string, size: string): string {
  return `https://placehold.co/${size}/1a1a2e/f59e0b?text=${encodeURIComponent(title)}`;
}

function toShow(
  title: ImdbTitle,
  overrides: Partial<Pick<CatalogShow, "type" | "trending" | "featured" | "episodes">> = {},
): CatalogShow | null {
  if (!title.id || !title.primaryTitle || title.isAdult) return null;

  const type = overrides.type ?? classify(title);
  if (!type) return null;

  const thisYear = new Date().getFullYear();
  const year = title.startYear ?? thisYear;
  const isSeries = TV_KINDS.has(kindOf(title));

  const status: CatalogShow["status"] =
    year > thisYear ? "upcoming" : isSeries && !title.endYear ? "ongoing" : "completed";

  const image = title.primaryImage?.url;

  return {
    id: toNumericId(title.id),
    title: title.primaryTitle,
    type,
    description: title.plot?.trim() || "No description available.",
    genres: (title.genres ?? []).slice(0, 5),
    year,
    rating: Math.round((title.rating?.aggregateRating ?? 0) * 10) / 10,
    posterUrl: image ? sizedImage(image, 380) : placeholder(title.primaryTitle, "380x562"),
    backdropUrl: image ? sizedImage(image, 1280) : placeholder(title.primaryTitle, "1280x720"),
    episodes: overrides.episodes ?? null,
    duration: title.runtimeSeconds ? Math.round(title.runtimeSeconds / 60) : null,
    status,
    trending: overrides.trending ?? false,
    featured: overrides.featured ?? false,
    createdAt: new Date(Date.UTC(year, 0, 1)).toISOString(),
  };
}

function toShows(
  titles: ImdbTitle[] | undefined,
  overrides?: Parameters<typeof toShow>[1],
): CatalogShow[] {
  const seen = new Set<number>();
  const out: CatalogShow[] = [];
  for (const title of titles ?? []) {
    const show = toShow(title, overrides);
    if (!show || seen.has(show.id)) continue;
    seen.add(show.id);
    out.push(show);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Listing: the API pages by cursor, the UI pages by number
// ---------------------------------------------------------------------------

interface Feed {
  shows: CatalogShow[];
  seen: Set<number>;
  total: number;
  nextToken?: string;
  exhausted: boolean;
  queue: Promise<void>;
}

const feeds = new Map<string, Feed>();

/** Hard ceiling on how deep one filter can be paged (keeps request counts sane). */
export const MAX_BROWSE_RESULTS = 1000;

async function loadFeed(
  params: Params,
  wanted: number,
  keep?: (show: CatalogShow) => boolean,
  overrides?: Parameters<typeof toShow>[1],
): Promise<Feed> {
  const key = JSON.stringify(params);
  let feed = feeds.get(key);
  if (!feed) {
    feed = { shows: [], seen: new Set(), total: 0, exhausted: false, queue: Promise.resolve() };
    feeds.set(key, feed);
  }
  const target = feed;
  const goal = Math.min(wanted, MAX_BROWSE_RESULTS);

  // Chain onto the feed's queue so concurrent callers never fetch the same page twice.
  const run = target.queue.then(async () => {
    let guard = 0;
    while (target.shows.length < goal && !target.exhausted && guard++ < 40) {
      const page = await get<ListTitlesResponse>("/titles", {
        ...params,
        pageToken: target.nextToken,
      });
      if (!target.total) target.total = page.totalCount ?? 0;

      for (const show of toShows(page.titles, overrides)) {
        if (target.seen.has(show.id) || (keep && !keep(show))) continue;
        target.seen.add(show.id);
        target.shows.push(show);
      }

      target.nextToken = page.nextPageToken || undefined;
      if (!target.nextToken || !page.titles?.length) target.exhausted = true;
    }
  });

  target.queue = run.catch(() => undefined);
  await run;
  return target;
}

const SORT_MOST_VOTED = { sortBy: "SORT_BY_USER_RATING_COUNT", sortOrder: "DESC" } as const;

const TYPES_MOVIE = ["MOVIE"];
const TYPES_TV = ["TV_SERIES", "TV_MINI_SERIES"];
const TYPES_ALL = [...TYPES_MOVIE, ...TYPES_TV];

export interface BrowseQuery {
  type?: ShowType | null;
  genre?: string | null;
  search?: string | null;
  page: number;
  limit: number;
}

export interface BrowseResult {
  shows: CatalogShow[];
  total: number;
  page: number;
  limit: number;
}

function hasGenre(show: CatalogShow, genre: string): boolean {
  const needle = genre.toLowerCase();
  return show.genres.some((g) => g.toLowerCase() === needle);
}

export async function browse(query: BrowseQuery): Promise<BrowseResult> {
  const { type, genre, page, limit } = query;
  const search = query.search?.trim();
  const start = (page - 1) * limit;

  // Free-text search: IMDb's own title search, filtered locally.
  if (search) {
    const res = await get<ListTitlesResponse>("/search/titles", { query: search, limit: 50 });
    let shows = toShows(res.titles);
    if (type) shows = shows.filter((show) => show.type === type);
    if (genre) shows = shows.filter((show) => hasGenre(show, genre));
    return { shows: shows.slice(start, start + limit), total: shows.length, page, limit };
  }

  const params: Params = { ...SORT_MOST_VOTED };
  let keep: ((show: CatalogShow) => boolean) | undefined;
  let overrides: Parameters<typeof toShow>[1];

  if (type === "anime") {
    params.types = TYPES_ALL;
    params.genres = genre && genre !== "Animation" ? ["Animation", genre] : ["Animation"];
    params.countryCodes = ["JP"];
    overrides = { type: "anime" };
    keep = (show) => hasGenre(show, "Animation") && (!genre || hasGenre(show, genre));
  } else {
    params.types = type === "movie" ? TYPES_MOVIE : type === "tv" ? TYPES_TV : TYPES_ALL;
    if (genre) {
      params.genres = [genre];
      keep = (show) => hasGenre(show, genre);
    }
  }

  const feed = await loadFeed(params, start + limit, keep, overrides);

  const total = feed.exhausted
    ? feed.shows.length
    : Math.min(Math.max(feed.total, feed.shows.length), MAX_BROWSE_RESULTS);

  return { shows: feed.shows.slice(start, start + limit), total, page, limit };
}

/** Most-voted titles released in the last couple of years. */
export async function trending(limit: number): Promise<CatalogShow[]> {
  const feed = await loadFeed(
    { types: TYPES_ALL, startYear: new Date().getFullYear() - 1, ...SORT_MOST_VOTED },
    limit,
    undefined,
    { trending: true },
  );
  return feed.shows.slice(0, limit);
}

/** Well-rated, widely-seen recent titles with artwork — used for the hero. */
export async function featured(limit = 6): Promise<CatalogShow[]> {
  const feed = await loadFeed(
    {
      types: TYPES_ALL,
      startYear: new Date().getFullYear() - 3,
      minAggregateRating: 7.5,
      ...SORT_MOST_VOTED,
    },
    limit,
    (show) => !show.backdropUrl.includes("placehold.co") && show.description.length > 40,
    { featured: true },
  );
  return feed.shows.slice(0, limit);
}

export async function getShow(id: number | string): Promise<CatalogShow | null> {
  const imdbId = toImdbId(id);

  let title: ImdbTitle;
  try {
    title = await get<ImdbTitle>(`/titles/${imdbId}`);
  } catch (error) {
    if (error instanceof ImdbError && error.status === 404) return null;
    throw error;
  }

  let episodes: number | null = null;
  if (TV_KINDS.has(kindOf(title))) {
    try {
      const res = await get<SeasonsResponse>(`/titles/${imdbId}/seasons`);
      const count = (res.seasons ?? []).reduce((sum, s) => sum + (s.episodeCount ?? 0), 0);
      episodes = count > 0 ? count : null;
    } catch {
      // Episode counts are a nicety; the page works without them.
    }
  }

  return toShow(title, { episodes });
}

export interface CatalogStats {
  totalShows: number;
  totalMovies: number;
  totalAnime: number;
  totalTv: number;
  avgRating: number;
  totalGenres: number;
}

export async function stats(): Promise<CatalogStats> {
  const count = async (params: Params) =>
    (await get<ListTitlesResponse>("/titles", { ...params, ...SORT_MOST_VOTED })).totalCount ?? 0;

  const [totalMovies, totalTv, totalAnime, top] = await Promise.all([
    count({ types: TYPES_MOVIE }),
    count({ types: TYPES_TV }),
    count({ types: TYPES_ALL, genres: ["Animation"], countryCodes: ["JP"] }),
    browse({ page: 1, limit: 50 }),
  ]);

  const rated = top.shows.filter((show) => show.rating > 0);
  const avgRating = rated.length
    ? Math.round((rated.reduce((sum, show) => sum + show.rating, 0) / rated.length) * 100) / 100
    : 0;

  return {
    totalShows: totalMovies + totalTv,
    totalMovies,
    totalAnime,
    totalTv,
    avgRating,
    totalGenres: IMDB_GENRES.length,
  };
}

/** IMDb's fixed genre vocabulary. */
export const IMDB_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western",
] as const;
