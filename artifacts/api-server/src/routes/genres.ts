import { Router } from "express";
import { db, showsTable } from "@workspace/db";

const router = Router();

router.get("/genres", async (req, res) => {
  const allShows = await db.select({ genres: showsTable.genres }).from(showsTable);
  const genreCount: Record<string, number> = {};
  allShows.forEach((s) => {
    s.genres.forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  const genres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, showCount], index) => ({
      id: index + 1,
      name,
      showCount,
    }));

  res.json(genres);
});

export default router;
