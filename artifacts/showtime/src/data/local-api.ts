/**
 * Client-side API.
 *
 * The UI was written against an OpenAPI-generated client that issues
 * `fetch("/api/...")` calls. Instead of running a server, `installLocalApi()`
 * patches `window.fetch` once at startup and answers those `/api/*` requests
 * straight from the in-code catalog. Everything is synchronous local data, so
 * the promise still resolves on a microtask, exactly like a network call.
 */
import { genres, shows, type CatalogShow } from "./catalog";

const API_PREFIX = "/api";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function empty(status: number): Response {
  return new Response(null, { status });
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

function updateShow(id: string, body: unknown): Response {
  const show = shows.find((entry) => String(entry.id) === id);
  if (!show) return json({ message: "Show not found" }, 404);

  const patch = (body ?? {}) as Partial<CatalogShow>;
  Object.assign(show, patch, { id: show.id });

  return json(show);
}

function deleteShow(id: string): Response {
  const index = shows.findIndex((entry) => String(entry.id) === id);
  if (index < 0) return json({ message: "Show not found" }, 404);

  shows.splice(index, 1);
  return empty(204);
}

function createShow(body: unknown): Response {
  const nextId = shows.reduce((max, show) => Math.max(max, show.id), 0) + 1;
  const input = (body ?? {}) as Partial<CatalogShow>;

  const created: CatalogShow = {
    id: nextId,
    title: input.title ?? "Untitled",
    type: input.type ?? "movie",
    description: input.description ?? "",
    genres: input.genres ?? [],
    year: input.year ?? new Date().getFullYear(),
    rating: input.rating ?? 0,
    posterUrl: input.posterUrl ?? "",
    backdropUrl: input.backdropUrl ?? input.posterUrl ?? "",
    episodes: input.episodes ?? null,
    duration: input.duration ?? null,
    status: input.status ?? "completed",
    trending: input.trending ?? false,
    featured: input.featured ?? false,
    createdAt: new Date().toISOString(),
  };

  shows.unshift(created);
  return json(created, 201);
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function handle(pathname: string, method: string, params: URLSearchParams, body: unknown): Response {
  const path = pathname.slice(API_PREFIX.length) || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "healthz") return json({ status: "ok" });

  if (segments[0] === "genres") return json(genres);

  if (segments[0] === "shows") {
    // /api/shows
    if (segments.length === 1) {
      if (method === "POST") return createShow(body);
      return listShows(params);
    }

    const [, key, maybeId] = segments;

    if (key === "stats") return showStats();
    if (key === "featured") return json(shows.filter((show) => show.featured));
    if (key === "trending") {
      const limit = num(params.get("limit"), 10);
      return json(shows.filter((show) => show.trending).slice(0, limit));
    }

    const id = maybeId ?? key;
    if (method === "PATCH") return updateShow(id, body);
    if (method === "DELETE") return deleteShow(id);
    return getShow(id);
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

    let body: unknown = undefined;
    const rawBody = init?.body;
    if (typeof rawBody === "string" && rawBody.trim() !== "") {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }

    try {
      return handle(parsed.pathname, method, parsed.searchParams, body);
    } catch (error) {
      return json(
        { message: error instanceof Error ? error.message : "Local API error" },
        500,
      );
    }
  };
}
