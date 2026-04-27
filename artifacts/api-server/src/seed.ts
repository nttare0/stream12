import { db, showsTable } from "@workspace/db";
import { getOmdbById, mapOmdbToShow, type ShowType } from "./services/omdb";

interface CuratedItem {
  imdbId: string;
  type?: ShowType;
  featured?: boolean;
  trending?: boolean;
  episodes?: number | null;
}

const CURATED: CuratedItem[] = [
  // Movies — featured & trending
  { imdbId: "tt15239678", type: "movie", featured: true, trending: true },  // Dune: Part Two
  { imdbId: "tt15398776", type: "movie", featured: true, trending: true },  // Oppenheimer
  { imdbId: "tt0816692",  type: "movie", trending: true },                  // Interstellar
  { imdbId: "tt0468569",  type: "movie", trending: true },                  // The Dark Knight
  { imdbId: "tt1375666",  type: "movie" },                                  // Inception
  { imdbId: "tt6751668",  type: "movie" },                                  // Parasite
  { imdbId: "tt1745960",  type: "movie", trending: true },                  // Top Gun: Maverick
  { imdbId: "tt10872600", type: "movie" },                                  // Spider-Man: No Way Home
  { imdbId: "tt0245429",  type: "anime", featured: true },                  // Spirited Away
  { imdbId: "tt4508902",  type: "anime" },                                  // Your Name

  // TV Shows
  { imdbId: "tt2788316",  type: "tv", featured: true, trending: true },     // Shogun (2024)
  { imdbId: "tt3581920",  type: "tv", featured: true, trending: true },     // The Last of Us
  { imdbId: "tt11198330", type: "tv", trending: true },                     // House of the Dragon
  { imdbId: "tt7660850",  type: "tv" },                                     // Succession
  { imdbId: "tt0903747",  type: "tv", trending: true },                     // Breaking Bad
  { imdbId: "tt4574334",  type: "tv", trending: true },                     // Stranger Things
  { imdbId: "tt2306299",  type: "tv" },                                     // Vikings
  { imdbId: "tt0944947",  type: "tv" },                                     // Game of Thrones

  // Anime
  { imdbId: "tt2560140",  type: "anime", featured: true, trending: true, episodes: 87 },  // Attack on Titan
  { imdbId: "tt12343534", type: "anime", trending: true, episodes: 47 },                  // Jujutsu Kaisen
  { imdbId: "tt0388629",  type: "anime", episodes: 1100 },                                // One Piece
  { imdbId: "tt0213338",  type: "anime", episodes: 26 },                                  // Cowboy Bebop
  { imdbId: "tt9335498",  type: "anime", trending: true, episodes: 55 },                  // Demon Slayer
  { imdbId: "tt11032374", type: "anime", episodes: 24 },                                  // Chainsaw Man
  { imdbId: "tt0417299",  type: "anime", episodes: 64 },                                  // Fullmetal Alchemist: Brotherhood
];

async function fetchAndMap(item: CuratedItem) {
  const detail = await getOmdbById(item.imdbId);
  if (!detail) {
    console.warn(`  ✗ ${item.imdbId} — not found on OMDB`);
    return null;
  }
  const mapped = mapOmdbToShow(detail, {
    type: item.type,
    featured: item.featured,
    trending: item.trending,
    episodes: item.episodes,
  });
  console.log(`  ✓ ${detail.Title} (${mapped.type}, ⭐${mapped.rating})`);
  return mapped;
}

async function seed() {
  const force = process.argv.includes("--force");

  const existing = await db.select().from(showsTable).limit(1);
  if (existing.length > 0 && !force) {
    console.log("Database already seeded. Run with --force to reseed.");
    return;
  }

  if (force && existing.length > 0) {
    console.log("Clearing existing shows...");
    await db.delete(showsTable);
  }

  console.log(`Fetching ${CURATED.length} titles from OMDB...`);
  const results = await Promise.all(CURATED.map(fetchAndMap));
  const shows = results.filter((s): s is NonNullable<typeof s> => s !== null);

  if (shows.length === 0) {
    console.error("No shows fetched from OMDB. Aborting.");
    return;
  }

  await db.insert(showsTable).values(shows);
  console.log(`\n✓ Seeded ${shows.length} shows from OMDB.`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
