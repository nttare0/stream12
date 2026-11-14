/**
 * Client-side API.
 *
 * The UI was written against an OpenAPI-generated client that issues
 * `fetch("/api/...")` calls. Instead of running a server, `installLocalApi()`
 * patches `window.fetch` once at startup and answers those `/api/*` requests
 * in the browser.
 *
 * Data comes live from IMDb (see `imdb.ts`). The small catalog bundled with
 * the app is only a safety net: if the IMDb API cannot be reached, the same
 * request is answered from that catalog so the site never renders empty.
 * The catalog is read-only — IMDb is the source of truth.
 */
import { genres, shows, type CatalogShow, type ShowType } from "./catalog";
import * as imdb from "./imdb";

const API_PREFIX = "/api";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function num(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return value !== null && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function listShows(params: URLSearchParams): Response {
  const type = params.get("type");
  const genre = params.get("genre");
  const search = params.get("search");
  const page = num(params.get("page"), 1);
  const limit = num(params.get("limit"), 20);

  let result = shows;

  if (type) result = result.filter((show) => show.type === type);
  if (genre) {
    const needle = genre.toLowerCase();
    result = result.filter((show) =>
      show.genres.some((g) => g.toLowerCase() === needle),
    );
  }
  if (search) {
    const needle = search.trim().toLowerCase();
    result = result.filter(
      (show) =>
        show.title.toLowerCase().includes(needle) ||
        show.description.toLowerCase().includes(needle) ||
        show.genres.some((g) => g.toLowerCase().includes(needle)),
    );
  }

  const total = result.length;
  const start = (page - 1) * limit;

  return json({
    shows: result.slice(start, start + limit),
    total,
    page,
    limit,
  });
}

function showStats(): Response {
  const count = (type: CatalogShow["type"]) =>
    shows.filter((show) => show.type === type).length;

  const avgRating = shows.length
    ? Math.round((shows.reduce((sum, show) => sum + show.rating, 0) / shows.length) * 100) /
      100
    : 0;

  return json({
    totalShows: shows.length,
    totalMovies: count("movie"),
    totalAnime: count("anime"),
    totalTv: count("tv"),
    avgRating,
    totalGenres: genres.length,
  });
}

function getShow(id: string): Response {
  const show = shows.find((entry) => String(entry.id) === id);
  return show ? json(show) : json({ message: "Show not found" }, 404);
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const READ_ONLY = "The catalog is read-only: titles come live from IMDb.";

function genreList(names: readonly string[]): Response {
  return json(names.map((name, index) => ({ id: index + 1, name, showCount: 0 })));
}

/** Ids this small belong to the bundled catalog, never to a real IMDb title. */
function isBundledId(id: string): boolean {
  return shows.some((entry) => String(entry.id) === id);
}

/** Answer from IMDb; if that fails for any reason, answer from the bundled catalog. */
async function live(fromImdb: () => Promise<Response>, fromBundle: () => Response): Promise<Response> {
  try {
    return await fromImdb();
  } catch (error) {
    console.warn("[showtime] IMDb API unavailable, using bundled catalog:", error);
    return fromBundle();
  }
}

async function handle(
  pathname: string,
  method: string,
  params: URLSearchParams,
): Promise<Response> {
  const path = pathname.slice(API_PREFIX.length) || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "healthz") return json({ status: "ok" });

  if (segments[0] === "genres") return genreList(imdb.IMDB_GENRES);

  if (segments[0] === "shows") {
    if (method !== "GET") return json({ message: READ_ONLY }, 405);

    // /api/shows
    if (segments.length === 1) {
      return live(
        async () =>
          json(
            await imdb.browse({
              type: params.get("type") as ShowType | null,
              genre: params.get("genre"),
              search: params.get("search"),
              page: num(params.get("page"), 1),
              limit: num(params.get("limit"), 20),
            }),
          ),
        () => listShows(params),
      );
    }

    const key = segments[1];

    if (key === "stats") return live(async () => json(await imdb.stats()), showStats);

    if (key === "featured") {
      return live(
        async () => json(await imdb.featured()),
        () => json(shows.filter((show) => show.featured)),
      );
    }

    if (key === "trending") {
      const limit = num(params.get("limit"), 10);
      return live(
        async () => json(await imdb.trending(limit)),
        () => json(shows.filter((show) => show.trending).slice(0, limit)),
      );
    }

    if (isBundledId(key)) return getShow(key);

    return live(
      async () => {
        const show = await imdb.getShow(key);
        return show ? json(show) : json({ message: "Show not found" }, 404);
      },
      () => getShow(key),
    );
  }

  return json({ message: `No local handler for ${method} ${pathname}` }, 404);
}

/**
 * Patch `window.fetch` so any request for `/api/...` is answered locally.
 * Requests to anything else (assets, images, external URLs) pass through
 * untouched. Safe to call more than once.
 */
export function installLocalApi(): void {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __localApiInstalled?: boolean }).__localApiInstalled) return;

  const originalFetch = window.fetch.bind(window);
  (window as unknown as { __localApiInstalled?: boolean }).__localApiInstalled = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    let parsed: URL;
    try {
      parsed = new URL(url, window.location.href);
    } catch {
      return originalFetch(input as RequestInfo, init);
    }

    // Only intercept same-origin /api/* traffic.
    const sameOrigin = parsed.origin === window.location.origin;
    const isApiPath =
      parsed.pathname === API_PREFIX || parsed.pathname.startsWith(`${API_PREFIX}/`);

    if (!sameOrigin || !isApiPath) {
      return originalFetch(input as RequestInfo, init);
    }

    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase();

    try {
      return await handle(parsed.pathname, method, parsed.searchParams);
    } catch (error) {
      return json(
        { message: error instanceof Error ? error.message : "Local API error" },
        500,
      );
    }
  };
}
