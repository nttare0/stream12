/**
 * Client-side API.
 *
 * The UI was written against an OpenAPI-generated client that issues
 * `fetch("/api/...")` calls. Instead of running a server, `installLocalApi()`
 * patches `window.fetch` once at startup and answers those `/api/*` requests
 * in the browser, filling them with IMDb data from `omdb.ts`.
 *
 * No titles are stored in the app. If IMDb data cannot be loaded the request
 * fails with a 503 and a `showtime:source-error` event is dispatched so the
 * UI can say so.
 */
import type { ShowType } from "./catalog";
import * as omdb from "./omdb";

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

export const SOURCE_ERROR_EVENT = "showtime:source-error";

const READ_ONLY = "The catalog is read-only: titles come live from IMDb.";

async function handle(
  pathname: string,
  method: string,
  params: URLSearchParams,
): Promise<Response> {
  const path = pathname.slice(API_PREFIX.length) || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "healthz") return json({ status: "ok" });

  // OMDb cannot filter by genre, so no genre list is offered.
  if (segments[0] === "genres") return json([]);

  if (segments[0] === "shows") {
    if (method !== "GET") return json({ message: READ_ONLY }, 405);

    if (segments.length === 1) {
      return json(
        await omdb.browse({
          type: params.get("type") as ShowType | null,
          genre: params.get("genre"),
          search: params.get("search"),
          page: num(params.get("page"), 1),
          limit: num(params.get("limit"), 20),
        }),
      );
    }

    const key = segments[1];

    if (key === "featured") return json(await omdb.featured());
    if (key === "trending") return json(await omdb.trending(num(params.get("limit"), 10)));

    if (/^\d+$/.test(key)) {
      const show = await omdb.getShow(key);
      return show ? json(show) : json({ message: "Show not found" }, 404);
    }
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
      const message = error instanceof Error ? error.message : "IMDb data unavailable";
      console.warn("[showtime] could not load IMDb data:", error);
      window.dispatchEvent(new CustomEvent(SOURCE_ERROR_EVENT, { detail: message }));
      return json({ message }, 503);
    }
  };
}
