import { Router } from "express";
import { db, showsTable } from "@workspace/db";
import {
  ListShowsQueryParams,
  CreateShowBody,
  GetShowParams,
  UpdateShowParams,
  UpdateShowBody,
  DeleteShowParams,
  GetTrendingShowsQueryParams,
} from "@workspace/api-zod";
import { eq, ilike, and, sql, desc, count, avg } from "drizzle-orm";

const router = Router();

router.get("/shows/featured", async (req, res) => {
  const shows = await db
    .select()
    .from(showsTable)
    .where(eq(showsTable.featured, true))
    .limit(5)
    .orderBy(desc(showsTable.rating));
  res.json(shows.map(formatShow));
});

router.get("/shows/trending", async (req, res) => {
  const parsed = GetTrendingShowsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  const shows = await db
    .select()
    .from(showsTable)
    .where(eq(showsTable.trending, true))
    .limit(limit)
    .orderBy(desc(showsTable.rating));
  res.json(shows.map(formatShow));
});

router.get("/shows/stats", async (req, res) => {
  const [totalRow] = await db.select({ count: count() }).from(showsTable);
  const [movieRow] = await db
    .select({ count: count() })
    .from(showsTable)
    .where(eq(showsTable.type, "movie"));
  const [animeRow] = await db
    .select({ count: count() })
    .from(showsTable)
    .where(eq(showsTable.type, "anime"));
  const [tvRow] = await db
    .select({ count: count() })
    .from(showsTable)
    .where(eq(showsTable.type, "tv"));
  const [ratingRow] = await db.select({ avg: avg(showsTable.rating) }).from(showsTable);

  const allShows = await db.select({ genres: showsTable.genres }).from(showsTable);
  const genreSet = new Set<string>();
  allShows.forEach((s) => s.genres.forEach((g) => genreSet.add(g)));

  res.json({
    totalShows: totalRow.count,
    totalMovies: movieRow.count,
    totalAnime: animeRow.count,
    totalTv: tvRow.count,
    avgRating: parseFloat((Number(ratingRow.avg) || 0).toFixed(2)),
    totalGenres: genreSet.size,
  });
});

router.get("/shows", async (req, res) => {
  const parsed = ListShowsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { type, genre, search, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (type) conditions.push(eq(showsTable.type, type));
  if (genre) conditions.push(sql`${genre} = ANY(${showsTable.genres})`);
  if (search) conditions.push(ilike(showsTable.title, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [shows, totalResult] = await Promise.all([
    db.select().from(showsTable).where(where).limit(limit).offset(offset).orderBy(desc(showsTable.rating)),
    db.select({ count: count() }).from(showsTable).where(where),
  ]);

  res.json({
    shows: shows.map(formatShow),
    total: totalResult[0].count,
    page,
    limit,
  });
});

router.get("/shows/:id", async (req, res) => {
  const parsed = GetShowParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [show] = await db.select().from(showsTable).where(eq(showsTable.id, parsed.data.id));
  if (!show) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatShow(show));
});

router.post("/shows", async (req, res) => {
  const parsed = CreateShowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [show] = await db.insert(showsTable).values(parsed.data).returning();
  res.status(201).json(formatShow(show));
});

router.patch("/shows/:id", async (req, res) => {
  const paramsParsed = UpdateShowParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateShowBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const [show] = await db
    .update(showsTable)
    .set(bodyParsed.data)
    .where(eq(showsTable.id, paramsParsed.data.id))
    .returning();
  if (!show) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatShow(show));
});

router.delete("/shows/:id", async (req, res) => {
  const parsed = DeleteShowParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(showsTable).where(eq(showsTable.id, parsed.data.id));
  res.status(204).send();
});

function formatShow(show: typeof showsTable.$inferSelect) {
  return {
    ...show,
    rating: Number(show.rating),
    createdAt: show.createdAt.toISOString(),
  };
}

export default router;
