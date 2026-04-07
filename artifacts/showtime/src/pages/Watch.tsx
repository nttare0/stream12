import { useRoute, Link } from "wouter";
import { useGetShow, useGetTrendingShows } from "@workspace/api-client-react";
import { ArrowLeft, Star, Calendar, Clock, Tv2, ExternalLink, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function Watch() {
  const [, params] = useRoute("/watch/:id");
  const id = Number(params?.id);
  const [selectedServer, setSelectedServer] = useState(0);

  const { data: show, isLoading } = useGetShow(id, { query: { enabled: !!id } });
  const { data: trending } = useGetTrendingShows({ limit: 8 });

  const servers = [
    { label: "Server 1", url: show ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(show.title + " official trailer")}` : "" },
    { label: "Server 2", url: show ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(show.title + " full movie")}` : "" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-white/5 h-14 flex items-center px-4 gap-4">
        <Link href={show ? `/shows/${show.id}` : "/"} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="w-px h-5 bg-white/10" />
        {isLoading ? (
          <Skeleton className="h-5 w-48 bg-white/10" />
        ) : (
          <span className="font-semibold text-sm truncate">{show?.title}</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {show && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(show.title + " trailer")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
            >
              Search YouTube <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="pt-14 flex flex-col lg:flex-row min-h-screen">
        {/* Main player area */}
        <main className="flex-1 flex flex-col">
          {/* Player */}
          <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                  <span className="text-white/40 text-sm">Loading player...</span>
                </div>
              </div>
            ) : show ? (
              <iframe
                key={selectedServer}
                src={servers[selectedServer].url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={show.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <span className="text-white/40">Show not found</span>
              </div>
            )}
          </div>

          {/* Server selector & info */}
          <div className="bg-[#111118] border-t border-white/5 px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Servers:</span>
            {servers.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedServer(i)}
                className={`px-3 py-1 rounded text-xs font-medium border transition-all ${
                  selectedServer === i
                    ? "bg-primary border-primary text-black"
                    : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-white/30 flex items-center gap-1">
              <Info className="w-3 h-3" /> Use YouTube search for full episodes
            </span>
          </div>

          {/* Show metadata below player */}
          {show && !isLoading && (
            <div className="px-4 py-5 bg-[#0e0e16] border-t border-white/5">
              <div className="flex flex-wrap items-start gap-4">
                <img
                  src={show.posterUrl}
                  alt={show.title}
                  className="w-16 h-24 object-cover rounded-md flex-shrink-0 border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold mb-1 truncate">{show.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-white/50">
                    <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {show.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {show.year}
                    </span>
                    {show.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {show.duration} min
                      </span>
                    )}
                    {show.episodes && (
                      <span className="flex items-center gap-1">
                        <Tv2 className="w-3.5 h-3.5" /> {show.episodes} episodes
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded uppercase tracking-wide text-[10px]">
                      {show.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded uppercase text-[10px] tracking-wide border ${
                      show.status === 'ongoing'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : show.status === 'upcoming'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {show.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {show.genres.map(g => (
                      <span key={g} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[11px] text-white/50">{g}</span>
                    ))}
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed line-clamp-3">{show.description}</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar: Up Next */}
        <aside className="w-full lg:w-80 bg-[#0e0e16] border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto">
          <div className="sticky top-14">
            <div className="px-4 py-3 border-b border-white/5">
              <h3 className="font-semibold text-sm text-white/80">Up Next</h3>
            </div>
            <div className="flex flex-col divide-y divide-white/5">
              {trending
                ? trending
                    .filter((s) => s.id !== id)
                    .map((s) => (
                      <Link
                        key={s.id}
                        href={`/watch/${s.id}`}
                        className="flex gap-3 p-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="relative flex-shrink-0 w-28 aspect-video rounded overflow-hidden bg-black">
                          <img
                            src={s.backdropUrl || s.posterUrl}
                            alt={s.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-black ml-0.5">
                                <polygon points="3,2 13,8 3,14" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug mb-1">
                            {s.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-white/40">
                            <span className="flex items-center gap-0.5 text-yellow-400">
                              <Star className="w-3 h-3 fill-current" />
                              {s.rating.toFixed(1)}
                            </span>
                            <span>{s.year}</span>
                            <span className="capitalize">{s.type}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-3">
                      <Skeleton className="w-28 aspect-video rounded bg-white/5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full bg-white/5" />
                        <Skeleton className="h-3 w-2/3 bg-white/5" />
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
