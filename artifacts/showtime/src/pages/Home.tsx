import { Layout } from "@/components/layout/Layout";
import { ShowRow } from "@/components/shared/ShowRow";
import { useGetFeaturedShows, useGetTrendingShows, useListShows } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Play, Info, Star, ChevronLeft, ChevronRight, Clock, Tv2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { SkeletonHero } from "@/components/shared/SkeletonCard";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  movie: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  anime: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  tv: "bg-blue-500/20 text-blue-300 border-blue-500/40",
};

export function Home() {
  const { data: featuredShows, isLoading: isLoadingFeatured } = useGetFeaturedShows();
  const { data: trendingShows, isLoading: isLoadingTrending } = useGetTrendingShows({ limit: 12 });
  const { data: movies, isLoading: isLoadingMovies } = useListShows({ type: "movie", limit: 12 });
  const { data: anime, isLoading: isLoadingAnime } = useListShows({ type: "anime", limit: 12 });
  const { data: tv, isLoading: isLoadingTv } = useListShows({ type: "tv", limit: 12 });

  const [heroIndex, setHeroIndex] = useState(0);
  const total = featuredShows?.length ?? 0;
  const heroShow = featuredShows?.[heroIndex];

  const next = useCallback(() => setHeroIndex((i) => (i + 1) % Math.max(total, 1)), [total]);
  const prev = useCallback(() => setHeroIndex((i) => (i - 1 + total) % Math.max(total, 1)), [total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next, total]);

  return (
    <Layout>
      {/* === HERO === */}
      <section className="relative w-full h-[75vh] min-h-[520px] max-h-[720px] overflow-hidden">
        {isLoadingFeatured ? (
          <SkeletonHero />
        ) : heroShow ? (
          <>
            {/* Background image stack — show all, only active one visible */}
            {featuredShows?.map((show, i) => (
              <div
                key={show.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1000",
                  i === heroIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <img
                  src={show.backdropUrl || show.posterUrl}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}

            {/* Gradient overlays — strong left & bottom for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/85 via-50% to-[#0a0a0f]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 via-25% to-transparent" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Content — vertically centered, left-aligned, properly padded */}
            <div className="relative z-10 h-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-center pt-16">
              <div key={heroShow.id} className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Top meta row */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border",
                    typeColors[heroShow.type] ?? "bg-white/10 text-white/70 border-white/20"
                  )}>
                    {heroShow.type === "tv" ? "TV Series" : heroShow.type}
                  </span>
                  <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-[#f5c518] text-[#f5c518]" />
                    <span className="text-white">{heroShow.rating.toFixed(1)}</span>
                    <span className="text-white/40">/ 10</span>
                  </span>
                  <span className="flex items-center gap-1 text-white/50 text-xs px-2 py-1">
                    <Calendar className="w-3.5 h-3.5" /> {heroShow.year}
                  </span>
                  {heroShow.duration && (
                    <span className="flex items-center gap-1 text-white/50 text-xs px-2 py-1">
                      <Clock className="w-3.5 h-3.5" /> {heroShow.duration}m
                    </span>
                  )}
                  {heroShow.episodes && (
                    <span className="flex items-center gap-1 text-white/50 text-xs px-2 py-1">
                      <Tv2 className="w-3.5 h-3.5" /> {heroShow.episodes} eps
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 leading-[1.05] tracking-tight drop-shadow-2xl">
                  {heroShow.title}
                </h1>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {heroShow.genres.slice(0, 4).map((g) => (
                    <span key={g} className="px-2.5 py-0.5 rounded-full text-xs bg-white/10 backdrop-blur-sm border border-white/10 text-white/80">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-white/80 mb-7 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
                  {heroShow.description}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/watch/${heroShow.id}`}>
                    <button className="flex items-center gap-2 px-7 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-all hover:scale-[1.03] shadow-xl shadow-primary/30 text-sm">
                      <Play className="w-5 h-5 fill-current" /> Watch Now
                    </button>
                  </Link>
                  <Link href={`/shows/${heroShow.id}`}>
                    <button className="flex items-center gap-2 px-7 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 backdrop-blur-md transition-all text-sm">
                      <Info className="w-5 h-5" /> Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom-right controls: arrows + dots */}
            {total > 1 && (
              <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-2">
                  {featuredShows?.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        i === heroIndex
                          ? "w-8 h-1.5 bg-primary"
                          : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={prev}
                  aria-label="Previous"
                  className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 backdrop-blur flex items-center justify-center text-white/80 hover:text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next"
                  className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 backdrop-blur flex items-center justify-center text-white/80 hover:text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* === CONTENT ROWS === */}
      <div className="relative z-20 py-8 space-y-2 bg-[#0a0a0f]">
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
