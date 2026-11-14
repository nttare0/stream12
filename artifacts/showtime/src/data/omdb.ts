/**
 * IMDb data, fetched straight from the browser.
 *
 * Source: the OMDb API (https://www.omdbapi.com) — a free API over IMDb
 * titles, ratings and posters. There is no server of ours in between and no
 * title is stored in this codebase: everything shown is requested at runtime.
 *
 * OMDb can only do two things: search titles by a word in their name, and
 * return full details for one IMDb id. It has no "list everything" or
 * "most popular" endpoint, so the browse rows are built by searching everyday
 * words in an order drawn afresh on every visit, newest years first.
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
  "love", "night", "world", "man", "life", "last", "day", "war", "girl", "dark",
  "king", "star", "home", "time", "city", "blood", "dead", "house", "black", "red",
  "story", "secret", "lost", "game", "summer", "road", "fire", "heart", "dream", "moon",
  "sun", "sea", "river", "island", "ghost", "angel", "devil", "queen", "prince", "hero",
  "woman", "boy", "family", "father", "mother", "brother", "sister", "friend", "child", "wife",
  "school", "street", "town", "land", "mountain", "sky", "ocean", "winter", "christmas", "wedding",
  "murder", "killer", "crime", "police", "mystery", "detective", "escape", "hunt", "revenge", "justice",
  "dragon", "monster", "zombie", "alien", "space", "future", "legend", "magic", "curse", "shadow",
  "white", "blue", "gold", "wild", "big", "little", "new", "first", "final", "return",
  "money", "power", "dance", "music", "song", "party", "show", "team", "race", "fight",
  "journey", "paradise", "kingdom", "empire", "soldier", "battle", "storm", "ice", "desert", "forest",
  "doctor", "agent", "spy", "hotel", "train", "ship", "bridge", "garden", "kiss", "truth",
];

/** Words that, in a title, almost always mean Japanese animation. */
const ANIME_WORDS = [
  "isekai", "monogatari", "tensei", "senpai", "maou", "shoujo", "sensei", "yuusha",
  "gakuen", "densetsu", "ninja", "samurai", "shonen", "mahou", "yokai", "shinobi",
  "gundam", "pokemon", "digimon", "naruto", "dragon ball", "one piece", "sailor moon",
  "evangelion", "kaiju", "yu-gi-oh", "doraemon", "precure", "kamen", "sword art",
  "kimi", "boku", "watashi", "ore", "hime", "tenshi", "akuma", "sekai", "koi", "yume",
];

const OLDEST_YEAR = 1950;

interface FeedStep {
  term: string;
  year?: number;
  page: number;
}

interface Feed {
  /** Search words in an order drawn afresh on every visit. */
  words: string[];
  years: (number | undefined)[];
  next: number;
  /** Word and year pairs with no further result pages. */
  drained: Set<string>;
  exhausted: boolean;
  shows: CatalogShow[];
  seen: Set<number>;
  queue: Promise<void>;
}

interface FeedSpec {
  key: string;
  type?: OmdbType;
  words: string[];
  years?: number[];
  overrides?: Overrides;
}

const feeds = new Map<string, Feed>();

/** Searches issued together per round; their results are interleaved. */
const FEED_BATCH = 3;

function yearsBack(count: number): number[] {
  const thisYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => thisYear - i);
}

function allYears(): number[] {
  return yearsBack(new Date().getFullYear() - OLDEST_YEAR + 1);
}

function shuffled<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The n-th search of a feed. Every word is tried against every year, newest
 * years first, and only then does the feed move on to the next result page,
 * so it keeps producing titles for as long as OMDb has any.
 */
function stepAt(feed: Feed, n: number): FeedStep | null {
  const wordIndex = n % feed.words.length;
  const cycle = Math.floor(n / feed.words.length);
  const page = Math.floor(cycle / feed.years.length) + 1;
  if (page > OMDB_MAX_PAGE) return null;
  // Neighbouring words look at neighbouring years, so one round spans a few.
  const year = feed.years[(cycle + (wordIndex % FEED_BATCH)) % feed.years.length];
  return { term: feed.words[wordIndex], year, page };
}

function drainKey(step: FeedStep): string {
  return `${step.term}|${step.year ?? ""}`;
}

function nextBatch(feed: Feed): FeedStep[] {
  const batch: FeedStep[] = [];
  while (batch.length < FEED_BATCH) {
    const step = stepAt(feed, feed.next);
    if (!step) {
      feed.exhausted = true;
      break;
    }
    feed.next++;
    if (!feed.drained.has(drainKey(step))) batch.push(step);
  }
  return batch;
}

async function loadFeed(spec: FeedSpec, wanted: number): Promise<Feed> {
  let feed = feeds.get(spec.key);
  if (!feed) {
    feed = {
      words: shuffled(spec.words),
      years: spec.years ?? [undefined],
      next: 0,
      drained: new Set(),
      exhausted: false,
      shows: [],
      seen: new Set(),
      queue: Promise.resolve(),
    };
    feeds.set(spec.key, feed);
  }
  const target = feed;

  // Chain onto the feed's queue so concurrent callers never repeat a request.
  const run = target.queue.then(async () => {
    // Bound the work of one call: empty answers must not drain the daily quota.
    let rounds = Math.ceil(Math.max(wanted - target.shows.length, 0) / OMDB_PAGE_SIZE) + 8;

    while (target.shows.length < wanted && !target.exhausted && rounds-- > 0) {
      // Take a few search words at once and deal their results out in turn,
      // so a row is not ten titles that all share one word.
      const batch = nextBatch(target);
      if (batch.length === 0) break;

      const results = await Promise.all(
        batch.map((step) => searchPage(step.term, step.page, spec.type, step.year)),
      );
      results.forEach((result, i) => {
        const step = batch[i];
        if (result.items.length < OMDB_PAGE_SIZE || result.total <= step.page * OMDB_PAGE_SIZE) {
          target.drained.add(drainKey(step));
        }
      });

      const longest = Math.max(...results.map((r) => r.items.length));
      for (let i = 0; i < longest; i++) {
        for (const { items } of results) {
          const item = items[i];
          if (!item || !hasPoster(item)) continue;
          const show = toShow(item, spec.overrides);
          if (!show || target.seen.has(show.id)) continue;
          target.seen.add(show.id);
          target.shows.push(show);
        }
      }
    }
  });

  target.queue = run.catch(() => undefined);
  await run;
  return target;
}

function feedFor(type: ShowType | null | undefined): FeedSpec {
  if (type === "anime") {
    return { key: "anime", type: "series", words: ANIME_WORDS, overrides: { type: "anime" } };
  }
  if (type === "movie") return { key: "movie", type: "movie", words: SEED_WORDS, years: allYears() };
  if (type === "tv") return { key: "tv", type: "series", words: SEED_WORDS, years: allYears() };
  return { key: "all", words: SEED_WORDS, years: allYears() };
}

const TRENDING_FEED: FeedSpec = {
  key: "trending",
  words: SEED_WORDS,
  years: yearsBack(2),
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
  // The feed has no known end; advertise one more page for as long as it keeps producing.
  const total = feed.exhausted ? feed.shows.length : Math.max(feed.shows.length, start + limit) + limit;

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
