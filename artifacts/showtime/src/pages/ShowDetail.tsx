import { Layout } from "@/components/layout/Layout";
import { useGetShow, useGetTrendingShows, useListShows } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Star, Clock, Calendar, CheckCircle2, Tv2, Play, BookmarkPlus, Share2, ChevronRight } from "lucide-react";
import { ShowCard, ShowCardSkeleton } from "@/components/shared/ShowCard";
import { motion } from "framer-motion";
import { SkeletonDetailPage } from "@/components/shared/SkeletonCard";
import { cn } from "@/lib/utils";
import { useState } from "react";

const typeColors: Record<string, string> = {
  movie: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  anime: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  tv: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function ShowDetail() {
  const [, params] = useRoute("/shows/:id");
  const id = Number(params?.id);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: show, isLoading } = useGetShow(id, { query: { enabled: !!id } });
  const { data: trendingShows, isLoading: isLoadingTrending } = useGetTrendingShows({ limit: 8 });
  const { data: related, isLoading: isLoadingRelated } = useListShows(
    show ? { type: show.type, limit: 6 } : {},
    { query: { enabled: !!show } }
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <SkeletonDetailPage />;

  if (!show) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-bold">Show not found</h1>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">Go home</Link>
        </div>
      </Layout>
    );
  }

  const episodeCount = show.episodes ?? 0;
  const fakeEpisodes = show.type !== "movie" && episodeCount > 0
    ? Array.from({ length: Math.min(episodeCount, 12) }, (_, i) => ({
        ep: i + 1,
        title: `Episode ${i + 1}`,
        duration: show.duration ?? 24,
      }))
    : [];

  return (
    <Layout>
      {/* Backdrop hero */}
      <div className="relative w-full h-[55vh] md:h-[65vh] min-h-[400px] overflow-hidden">
        <motion.img
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          src={show.backdropUrl || show.posterUrl}
          alt={show.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 -mt-44 md:-mt-56 pb-24">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

          {/* Poster + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-shrink-0 flex flex-col items-center lg:items-start w-full lg:w-56 xl:w-64"
          >
            <div className="w-44 md:w-52 lg:w-full aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#1a1a2e]">
              <img
                src={show.posterUrl}
                alt={show.title}
                className="w-full h-full object-cover img-fade-in"
              />
            </div>

            {/* Action buttons */}
            <div className="w-44 md:w-52 lg:w-full mt-4 space-y-3">
              <Link href={`/watch/${show.id}`} className="block">
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/30 text-sm">
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </button>
              </Link>

              <div className="flex gap-2">
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    bookmarked
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <BookmarkPlus className="w-4 h-4" />
                  {bookmarked ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex-1 min-w-0 pt-0 lg:pt-44 xl:pt-52"
          >
            {/* Type + status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn("px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border", typeColors[show.type] ?? "bg-white/10 text-white/60 border-white/10")}>
                {show.type}
              </span>
              <span className={cn("px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border", {
                "bg-green-500/10 text-green-400 border-green-500/20": show.status === "ongoing",
                "bg-blue-500/10 text-blue-400 border-blue-500/20": show.status === "upcoming",
                "bg-white/5 text-white/40 border-white/10": show.status === "completed",
              })}>
                {show.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl xl:text-6xl font-black mb-4 tracking-tight leading-none text-white">
              {show.title}
            </h1>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
              <span className="flex items-center gap-1.5 font-semibold">
                <Star className="w-4 h-4 fill-[#f5c518] text-[#f5c518]" />
                <span className="text-white text-base">{show.rating.toFixed(1)}</span>
                <span className="text-white/40 text-xs">/10</span>
              </span>
              <div className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-1.5 text-white/60">
                <Calendar className="w-4 h-4" /> {show.year}
              </span>
              {show.duration && (
                <>
                  <div className="w-px h-4 bg-white/10" />
                  <span className="flex items-center gap-1.5 text-white/60">
                    <Clock className="w-4 h-4" /> {show.duration} min
                  </span>
                </>
              )}
              {show.episodes && (
                <>
                  <div className="w-px h-4 bg-white/10" />
                  <span className="flex items-center gap-1.5 text-white/60">
                    <Tv2 className="w-4 h-4" /> {show.episodes} episodes
                  </span>
                </>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {show.genres.map(g => (
                <Link key={g} href={`/shows?genre=${encodeURIComponent(g)}`}>
                  <span className="px-3 py-1 rounded-full text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 cursor-pointer transition-colors">
                    {g}
                  </span>
                </Link>
              ))}
            </div>

            {/* Synopsis */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 text-white/90 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Synopsis
              </h3>
              <p className="text-base text-white/65 leading-relaxed">{show.description}</p>
            </div>

            {/* Episode list */}
            {fakeEpisodes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    Episodes
                    {show.episodes && show.episodes > 12 && (
                      <span className="text-sm text-white/40 font-normal">(showing 12 of {show.episodes})</span>
                    )}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fakeEpisodes.map((ep) => (
                    <Link key={ep.ep} href={`/watch/${show.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-all group">
                        <div className="w-8 h-8 bg-white/5 group-hover:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                          <Play className="w-3.5 h-3.5 text-white/40 group-hover:text-primary fill-current transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">{ep.title}</p>
                          <p className="text-xs text-white/40">{ep.duration} min</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 flex-shrink-0 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related shows */}
            {!isLoadingRelated && related?.shows && related.shows.filter(s => s.id !== show.id).length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 text-white/90 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  More Like This
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {related.shows.filter(s => s.id !== show.id).slice(0, 6).map(s => (
                    <ShowCard key={s.id} show={s} />
                  ))}
                </div>
              </div>
            )}
            {isLoadingRelated && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <ShowCardSkeleton key={i} />)}
              </div>
            )}
          </motion.div>

          {/* Right sidebar — trending */}
          <aside className="w-full lg:w-56 xl:w-64 flex-shrink-0 pt-0 lg:pt-44 xl:pt-52 space-y-4">
            <h3 className="text-base font-bold text-white/80 flex items-center gap-2">
              <div className="w-1 h-5 bg-orange-500 rounded-full" />
              Trending
            </h3>
            <div className="flex flex-col gap-3">
              {isLoadingTrending
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-16 aspect-[2/3] rounded bg-[#1a1a2e] overflow-hidden relative flex-shrink-0">
                        <div className="absolute inset-0 shimmer" />
                      </div>
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-[#1a1a2e] rounded w-3/4" />
                        <div className="h-2.5 bg-[#1a1a2e] rounded w-1/2" />
                      </div>
                    </div>
                  ))
                : trendingShows?.filter(s => s.id !== show.id).slice(0, 5).map(s => (
                    <Link key={s.id} href={`/shows/${s.id}`} className="flex gap-3 group">
                      <div className="w-16 aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a2e] flex-shrink-0 border border-white/5 relative">
                        <img
                          src={s.posterUrl}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-2 leading-snug mb-1">
                          {s.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-[#f5c518] text-[#f5c518]" />
                            {s.rating.toFixed(1)}
                          </span>
                          <span>{s.year}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
