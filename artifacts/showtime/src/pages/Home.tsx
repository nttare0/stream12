import { Layout } from "@/components/layout/Layout";
import { ShowRow } from "@/components/shared/ShowRow";
import { useGetFeaturedShows, useGetTrendingShows, useListShows } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Play, Info, Star, ChevronLeft, ChevronRight, Clock, Tv2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { SkeletonHero } from "@/components/shared/SkeletonCard";
import { cn } from "@/lib/utils";

export function Home() {
  const { data: featuredShows, isLoading: isLoadingFeatured } = useGetFeaturedShows();
  const { data: trendingShows, isLoading: isLoadingTrending } = useGetTrendingShows({ limit: 12 });
  const { data: movies, isLoading: isLoadingMovies } = useListShows({ type: "movie", limit: 12 });
  const { data: anime, isLoading: isLoadingAnime } = useListShows({ type: "anime", limit: 12 });
  const { data: tv, isLoading: isLoadingTv } = useListShows({ type: "tv", limit: 12 });

  const [heroIndex, setHeroIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const heroShow = featuredShows?.[heroIndex];
  const total = featuredShows?.length ?? 0;

  const next = useCallback(() => {
    setImgLoaded(false);
    setHeroIndex((i) => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setImgLoaded(false);
    setHeroIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, total]);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative w-full min-h-[85vh] overflow-hidden flex items-end">
        {isLoadingFeatured ? (
          <SkeletonHero />
        ) : heroShow ? (
          <>
            {/* Backdrop */}
            <AnimatePresence mode="sync">
              <motion.div
                key={heroShow.id}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img
                  src={heroShow.backdropUrl || heroShow.posterUrl}
                  alt={heroShow.title}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-700",
                    imgLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImgLoaded(true)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" style={{ height: "30%" }} />

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={heroShow.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="container mx-auto px-4 relative z-10 pb-16 pt-28 w-full"
              >
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border",
                      heroShow.type === "movie"
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                        : heroShow.type === "anime"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    )}>
                      {heroShow.type}
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur px-2 py-1 rounded text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-[#f5c518] text-[#f5c518]" />
                      <span className="text-white">{heroShow.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-white/60 text-sm">{heroShow.year}</span>
                    {heroShow.duration && (
                      <span className="flex items-center gap-1 text-white/50 text-sm">
                        <Clock className="w-3.5 h-3.5" /> {heroShow.duration} min
                      </span>
                    )}
                    {heroShow.episodes && (
                      <span className="flex items-center gap-1 text-white/50 text-sm">
                        <Tv2 className="w-3.5 h-3.5" /> {heroShow.episodes} eps
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-none tracking-tight hero-glow">
                    {heroShow.title}
                  </h1>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {heroShow.genres.slice(0, 4).map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/60">
                        {g}
                      </span>
                    ))}
                  </div>

                  <p className="text-base text-white/70 mb-8 line-clamp-3 leading-relaxed max-w-xl">
                    {heroShow.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/watch/${heroShow.id}`}>
                      <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-all hover:scale-105 shadow-lg shadow-primary/30 text-sm">
                        <Play className="w-5 h-5 fill-current" /> Watch Now
                      </button>
                    </Link>
                    <Link href={`/shows/${heroShow.id}`}>
                      <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/10 backdrop-blur-sm transition-all text-sm">
                        <Info className="w-5 h-5" /> More Info
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Arrow controls */}
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {total > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {featuredShows?.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setImgLoaded(false); setHeroIndex(i); }}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === heroIndex
                        ? "w-6 h-2 bg-primary"
                        : "w-2 h-2 bg-white/30 hover:bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* Rows */}
      <div className="relative z-20 -mt-6 pb-20 space-y-2">
        <ShowRow
          title="Trending Now"
          shows={trendingShows}
          isLoading={isLoadingTrending}
          href="/shows"
          accent="#f97316"
        />
        <ShowRow
          title="Top Movies"
          shows={movies?.shows}
          isLoading={isLoadingMovies}
          href="/shows?type=movie"
          accent="#f97316"
        />
        <ShowRow
          title="Popular Anime"
          shows={anime?.shows}
          isLoading={isLoadingAnime}
          href="/shows?type=anime"
          accent="#a855f7"
        />
        <ShowRow
          title="Binge-Worthy TV"
          shows={tv?.shows}
          isLoading={isLoadingTv}
          href="/shows?type=tv"
          accent="#3b82f6"
        />
      </div>
    </Layout>
  );
}
