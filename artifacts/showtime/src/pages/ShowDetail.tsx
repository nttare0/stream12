import { Layout } from "@/components/layout/Layout";
import { useGetShow, useGetTrendingShows, useListShows } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Star, Clock, Calendar, Tv2, Play, BookmarkPlus, Share2, ChevronRight } from "lucide-react";
import { ShowCard, ShowCardSkeleton } from "@/components/shared/ShowCard";
import { SkeletonDetailPage } from "@/components/shared/SkeletonCard";
import { cn } from "@/lib/utils";
import { useState } from "react";

const typeColors: Record<string, string> = {
  movie: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  anime: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  tv: "bg-blue-500/20 text-blue-300 border-blue-500/40",
};

const statusColors: Record<string, string> = {
  ongoing: "bg-green-500/15 text-green-300 border-green-500/30",
  completed: "bg-white/5 text-white/50 border-white/10",
  upcoming: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};

export function ShowDetail() {
  const [, params] = useRoute("/shows/:id");
  const id = Number(params?.id);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: show, isLoading } = useGetShow(id, { query: { enabled: !!id } });
  const { data: trendingShows, isLoading: isLoadingTrending } = useGetTrendingShows({ limit: 8 });
  const { data: related, isLoading: isLoadingRelated } = useListShows(
    show ? { type: show.type, limit: 8 } : {},
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
      {/* === Backdrop hero (compact) === */}
      <div className="relative w-full h-[50vh] min-h-[380px] max-h-[520px] overflow-hidden">
        <img
          src={show.backdropUrl || show.posterUrl}
          alt=""
          className="w-full h-full object-cover object-center scale-110 blur-sm opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/80 via-transparent to-[#0a0a0f]/80" />
      </div>

      {/* === Content === */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-72 md:-mt-80 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] xl:grid-cols-[240px_1fr_280px] gap-6 lg:gap-8">

          {/* === Left: Poster + actions === */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="w-44 sm:w-52 lg:w-full aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/70 bg-[#1a1a2e]">
              <img src={show.posterUrl} alt={show.title} className="w-full h-full object-cover" />
            </div>

            <div className="w-44 sm:w-52 lg:w-full mt-4 space-y-2.5">
              <Link href={`/watch/${show.id}`} className="block">
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-all hover:scale-[1.02] shadow-lg shadow-primary/30 text-sm">
                  <Play className="w-4 h-4 fill-current" /> Watch Now
                </button>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all",
                    bookmarked
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  )}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  {bookmarked ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 text-xs font-medium transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copied ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          </div>

          {/* === Center: Main content === */}
          <div className="min-w-0 lg:pt-44 xl:pt-52">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border", typeColors[show.type])}>
                {show.type === "tv" ? "TV Series" : show.type}
              </span>
              <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border", statusColors[show.status])}>
                {show.status}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-[1.05] text-white">
              {show.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-sm">
              <span className="flex items-center gap-1.5 font-semibold">
                <Star className="w-4 h-4 fill-[#f5c518] text-[#f5c518]" />
                <span className="text-white text-base">{show.rating.toFixed(1)}</span>
                <span className="text-white/40 text-xs">/ 10</span>
              </span>
              <span className="flex items-center gap-1.5 text-white/60">
                <Calendar className="w-4 h-4" /> {show.year}
              </span>
              {show.duration && (
                <span className="flex items-center gap-1.5 text-white/60">
                  <Clock className="w-4 h-4" /> {show.duration}m
                </span>
              )}
              {show.episodes && (
                <span className="flex items-center gap-1.5 text-white/60">
                  <Tv2 className="w-4 h-4" /> {show.episodes} episodes
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
              {show.genres.map((g) => (
                <span key={g} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/70">
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="mb-8 bg-white/[0.03] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-bold mb-2 text-white/90 flex items-center gap-2 uppercase tracking-wider">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Synopsis
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">{show.description}</p>
            </div>

            {/* Episodes */}
            {fakeEpisodes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white/90 flex items-center gap-2 uppercase tracking-wider">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Episodes
                  </h3>
                  {show.episodes && show.episodes > 12 && (
                    <span className="text-xs text-white/40">12 of {show.episodes}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fakeEpisodes.map((ep) => (
                    <Link key={ep.ep} href={`/watch/${show.id}`}>
                      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 rounded-lg cursor-pointer transition-all group">
                        <div className="w-8 h-8 bg-white/5 group-hover:bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0 transition-colors">
                          <Play className="w-3.5 h-3.5 text-white/50 group-hover:text-primary fill-current transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/85 group-hover:text-white transition-colors truncate">{ep.title}</p>
                          <p className="text-[11px] text-white/40">{ep.duration} min</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 flex-shrink-0 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* More Like This */}
            {!isLoadingRelated && related?.shows && related.shows.filter((s) => s.id !== show.id).length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-4 text-white/90 flex items-center gap-2 uppercase tracking-wider">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  More Like This
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {related.shows.filter((s) => s.id !== show.id).slice(0, 8).map((s) => (
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
          </div>

          {/* === Right: Trending sidebar === */}
          <aside className="lg:pt-44 xl:pt-52 space-y-3">
            <h3 className="text-sm font-bold text-white/90 flex items-center gap-2 uppercase tracking-wider">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              Trending
            </h3>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 space-y-2">
              {isLoadingTrending
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-14 aspect-[2/3] rounded bg-[#1a1a2e] overflow-hidden relative flex-shrink-0">
                        <div className="absolute inset-0 shimmer" />
                      </div>
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-[#1a1a2e] rounded w-3/4" />
                        <div className="h-2.5 bg-[#1a1a2e] rounded w-1/2" />
                      </div>
                    </div>
                  ))
                : trendingShows
                    ?.filter((s) => s.id !== show.id)
                    .slice(0, 6)
                    .map((s, i) => (
                      <Link key={s.id} href={`/shows/${s.id}`} className="flex gap-3 group p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="text-2xl font-black text-white/15 group-hover:text-primary/40 transition-colors w-6 text-center flex-shrink-0 leading-none flex items-center">
                          {i + 1}
                        </div>
                        <div className="w-12 aspect-[2/3] rounded overflow-hidden bg-[#1a1a2e] flex-shrink-0 border border-white/5">
                          <img
                            src={s.posterUrl}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-xs font-semibold text-white/85 group-hover:text-white transition-colors line-clamp-2 leading-snug mb-1">
                            {s.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            {s.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-[#f5c518] text-[#f5c518]" />
                                {s.rating.toFixed(1)}
                              </span>
                            )}
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
