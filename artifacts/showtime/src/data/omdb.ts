/**
 * IMDb data, fetched straight from the browser.
 *
 * Source: the OMDb API (https://www.omdbapi.com) — a free API over IMDb
 * titles, ratings and posters. There is no server of ours in between and no
 * title is stored in this codebase: everything shown is requested at runtime.
 *
 * OMDb can only do two things: search titles by a word in their name, and
 * return full details for one IMDb id. It has no "list everything" or
 * "most popular" endpoint, so the browse rows are built by searching a
 * rotating set of everyday words, newest years first.
 *
 * The free key allows 1,000 requests a day, shared by every visitor, so
 * answers are cached in the browser. Set `VITE_OMDB_API_KEY` to use your own.
 */
import type { CatalogShow, ShowType } from "./catalog";

const API_URL = "https://www.omdbapi.com/";
const API_KEY: string = (import.meta.env.VITE_OMDB_API_KEY as string | undefined) || "dfe4e9e7";

const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_PREFIX = "omdb:v1:";
const SEARCH_TTL_MS = 12 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OMDB_PAGE_SIZE = 10;
const OMDB_MAX_PAGE = 100;

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

interface OmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface OmdbSearchResponse {
  Search?: OmdbSearchItem[];
  totalResults?: string;
  Response: "True" | "False";
  Error?: string;
}

interface OmdbDetail extends OmdbSearchItem {
  Runtime?: string;
  Genre?: string;
  Plot?: string;
  Country?: string;
  imdbRating?: string;
  totalSeasons?: string;
  Response: "True" | "False";
  Error?: string;
}

export class OmdbError extends Error {}

// ---------------------------------------------------------------------------
// HTTP + caching
// ---------------------------------------------------------------------------

const inflight = new Map<string, Promise<unknown>>();

function readCache<T>(key: string, ttl: number): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as { at: number; data: T };
    if (Date.now() - entry.at > ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, data: unknown): void {
  const value = JSON.stringify({ at: Date.now(), data });
  try {
    localStorage.setItem(CACHE_PREFIX + key, value);
  } catch {
    // Storage is full: drop our own entries once and retry.
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(CACHE_PREFIX + key, value);
    } catch {
      // Still no room, or storage is disabled — carry on uncached.
    }
  }
}

type Params = Record<string, string | number | undefined>;

function get<T extends { Response: string; Error?: string }>(params: Params, ttl: number): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const key = query.toString();

  const cached = readCache<T>(key, ttl);
  if (cached !== undefined) return Promise.resolve(cached);

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_URL}?${key}&apikey=${encodeURIComponent(API_KEY)}`, {
        signal: controller.signal,
      });
      const data = (await res.json()) as T;
      // "Not found" is a normal, cacheable answer; anything else is a real failure.
      if (data.Response === "False" && !/not found|too many results/i.test(data.Error ?? "")) {
        throw new OmdbError(data.Error || `OMDb responded ${res.status}`);
      }
      writeCache(key, data);
      return data;
    } finally {
      clearTimeout(timer);
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
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
// Mapping OMDb records onto the app's show shape
// ---------------------------------------------------------------------------

/** IMDb posters live on Amazon's image CDN, which resizes on request. */
function sizedImage(url: string, width: number): string {
  if (!url.includes("media-amazon.com")) return url;
  return url.replace(/\._V1_.*(\.\w+)$/, `._V1_QL75_UX${width}_$1`);
}

function hasPoster(item: OmdbSearchItem): boolean {
  return !!item.Poster && item.Poster !== "N/A";
}

function text(value: string | undefined): string {
  return value && value !== "N/A" ? value : "";
}

type Overrides = Partial<Pick<CatalogShow, "type" | "trending" | "featured">>;

function toShow(item: OmdbSearchItem | OmdbDetail, overrides: Overrides = {}): CatalogShow | null {
  if (item.Type !== "movie" && item.Type !== "series") return null;
  if (!item.imdbID || !item.Title) return null;

  const detail = item as OmdbDetail;
  const genres = text(detail.Genre)
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 5);

  const isAnime = genres.includes("Animation") && text(detail.Country).includes("Japan");
  const type: ShowType =
    overrides.type ?? (isAnime ? "anime" : item.Type === "movie" ? "movie" : "tv");

  const thisYear = new Date().getFullYear();
  const yearText = item.Year ?? "";
  const year = parseInt(yearText, 10) || thisYear;
  const openEnded = /\d{4}[–-]\s*$/.test(yearText);
  const status: CatalogShow["status"] =
    year > thisYear ? "upcoming" : item.Type === "series" && openEnded ? "ongoing" : "completed";

  const poster = hasPoster(item)
    ? item.Poster
    : `https://placehold.co/380x562/1a1a2e/f59e0b?text=${encodeURIComponent(item.Title)}`;

  return {
    id: toNumericId(item.imdbID),
    title: item.Title,
    type,
    description: text(detail.Plot),
    genres,
    year,
    rating: parseFloat(text(detail.imdbRating)) || 0,
    posterUrl: sizedImage(poster, 380),
    backdropUrl: sizedImage(poster, 1280),
    episodes: null,
    duration: parseInt(text(detail.Runtime), 10) || null,
    status,
    trending: overrides.trending ?? false,
    featured: overrides.featured ?? false,
    createdAt: new Date(Date.UTC(year, 0, 1)).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

type OmdbType = "movie" | "series";

function omdbType(type: ShowType | null | undefined): OmdbType | undefined {
  if (type === "movie") return "movie";
  if (type === "tv" || type === "anime") return "series";
  return undefined;
}

async function searchPage(
  term: string,
  page: number,
  type?: OmdbType,
  year?: number,
): Promise<{ items: OmdbSearchItem[]; total: number }> {
  const res = await get<OmdbSearchResponse>({ s: term, type, y: year, page }, SEARCH_TTL_MS);
  return { items: res.Search ?? [], total: Number(res.totalResults) || 0 };
}

// ---------------------------------------------------------------------------
// Discovery feeds: browse rows without a search term
// ---------------------------------------------------------------------------

/** Everyday words that appear in many titles. They only steer the search. */
const SEED_WORDS = [
  "love", "night", "world", "man", "life", "last", "day", "war",
  "girl", "dark", "king", "star", "home", "time", "city", "blood",
];

/** Words that, in a title, almost always mean Japanese animation. */
const ANIME_WORDS = [
  "isekai", "monogatari", "tensei", "senpai", "maou", "shoujo",
  "sensei", "yuusha", "gakuen", "densetsu", "ninja", "samurai",
];

interface FeedStep {
  term: string;
  year?: number;
  page: number;
}

interface Feed {
  steps: FeedStep[];
  next: number;
  shows: CatalogShow[];
  seen: Set<number>;
  queue: Promise<void>;
}

interface FeedSpec {
  key: string;
  type?: OmdbType;
  words: string[];
  wordOffset?: number;
  years?: number[];
  pagesPerTerm: number;
  overrides?: Overrides;
}

const feeds = new Map<string, Feed>();

function recentYears(count: number): number[] {
  const thisYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => thisYear - i);
}

function planSteps(spec: FeedSpec): FeedStep[] {
  const offset = spec.wordOffset ?? 0;
  const words = spec.words.map((_, i) => spec.words[(i + offset) % spec.words.length]);
  const years: (number | undefined)[] = spec.years ?? [undefined];

  const steps: FeedStep[] = [];
  for (const year of years) {
    for (let page = 1; page <= spec.pagesPerTerm; page++) {
      for (const term of words) steps.push({ term, year, page });
    }
  }
  return steps;
}

async function loadFeed(spec: FeedSpec, wanted: number): Promise<Feed> {
  let feed = feeds.get(spec.key);
  if (!feed) {
    feed = { steps: planSteps(spec), next: 0, shows: [], seen: new Set(), queue: Promise.resolve() };
    feeds.set(spec.key, feed);
  }
  const target = feed;

  // Chain onto the feed's queue so concurrent callers never repeat a request.
  const run = target.queue.then(async () => {
    while (target.shows.length < wanted && target.next < target.steps.length) {
      const step = target.steps[target.next];
      const { items } = await searchPage(step.term, step.page, spec.type, step.year);
      target.next++;

      for (const item of items) {
        if (!hasPoster(item)) continue;
        const show = toShow(item, spec.overrides);
        if (!show || target.seen.has(show.id)) continue;
        target.seen.add(show.id);
        target.shows.push(show);
      }
    }
  });

  target.queue = run.catch(() => undefined);
  await run;
  return target;
}

function feedFor(type: ShowType | null | undefined): FeedSpec {
  if (type === "anime") {
    return { key: "anime", words: ANIME_WORDS, pagesPerTerm: 3, overrides: { type: "anime" } };
  }
  if (type === "movie") {
    return { key: "movie", type: "movie", words: SEED_WORDS, wordOffset: 4, years: recentYears(12), pagesPerTerm: 2 };
  }
  if (type === "tv") {
    return { key: "tv", type: "series", words: SEED_WORDS, wordOffset: 8, years: recentYears(12), pagesPerTerm: 2 };
  }
  return { key: "all", words: SEED_WORDS, wordOffset: 12, years: recentYears(12), pagesPerTerm: 2 };
}

const TRENDING_FEED: FeedSpec = {
  key: "trending",
  words: SEED_WORDS,
  years: recentYears(2),
  pagesPerTerm: 1,
  overrides: { trending: true },
};

// ---------------------------------------------------------------------------
// Public API used by local-api.ts
// ---------------------------------------------------------------------------

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

export async function browse(query: BrowseQuery): Promise<BrowseResult> {
  const { type, page, limit } = query;
  const start = (page - 1) * limit;
  // OMDb cannot filter by genre, so a genre is treated as a word to search for.
  const term = query.search?.trim() || query.genre?.trim();

  if (term) {
    const firstPage = Math.floor(start / OMDB_PAGE_SIZE) + 1;
    const lastPage = Math.min(Math.ceil((start + limit) / OMDB_PAGE_SIZE), OMDB_MAX_PAGE);
    const pages = await Promise.all(
      Array.from({ length: Math.max(lastPage - firstPage + 1, 0) }, (_, i) =>
        searchPage(term, firstPage + i, omdbType(type)),
      ),
    );

    const offset = start - (firstPage - 1) * OMDB_PAGE_SIZE;
    const overrides: Overrides = type === "anime" ? { type: "anime" } : {};
    const shows = pages
      .flatMap((p) => p.items)
      .slice(offset, offset + limit)
      .map((item) => toShow(item, overrides))
      .filter((show): show is CatalogShow => show !== null);

    const total = Math.min(pages[0]?.total ?? 0, OMDB_MAX_PAGE * OMDB_PAGE_SIZE);
    return { shows, total, page, limit };
  }

  const feed = await loadFeed(feedFor(type), start + limit);
  const exhausted = feed.next >= feed.steps.length;
  // The true size is unknown; always advertise one more page until the feed runs dry.
  const total = exhausted ? feed.shows.length : Math.max(feed.shows.length, start + limit) + limit;

  return { shows: feed.shows.slice(start, start + limit), total, page, limit };
}

export async function trending(limit: number): Promise<CatalogShow[]> {
  const feed = await loadFeed(TRENDING_FEED, limit);
  return feed.shows.slice(0, limit);
}

/** A handful of this year's titles with full details, for the home page hero. */
export async function featured(limit = 5): Promise<CatalogShow[]> {
  const candidates = (await trending(limit + 1)).slice(0, limit + 1);
  const detailed = await Promise.all(
    candidates.map((show) => getShow(show.id).catch(() => null)),
  );
  return detailed
    .filter((show): show is CatalogShow => !!show && show.description.length > 40)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map((show) => ({ ...show, featured: true }));
}

export async function getShow(id: number | string): Promise<CatalogShow | null> {
  const detail = await get<OmdbDetail>({ i: toImdbId(id), plot: "full" }, DETAIL_TTL_MS);
  if (detail.Response === "False") return null;

  const show = toShow(detail);
  if (!show) return null;

  if (!show.description) show.description = "No description available.";
  return show;
}
