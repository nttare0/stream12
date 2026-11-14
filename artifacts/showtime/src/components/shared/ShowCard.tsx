import { Link } from "wouter";
import { Star, Play } from "lucide-react";
import { type Show } from "@workspace/api-client-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShowCardProps {
  show: Show;
  className?: string;
}

const typeColors: Record<string, string> = {
  movie: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  anime: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  tv: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function ShowCard({ show, className }: ShowCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/shows/${show.id}`}
      className={cn(
        "group block relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a2e] border border-white/5 cursor-pointer card-glow transition-all duration-300 hover:scale-[1.03] hover:z-10",
        className
      )}
    >
      {/* Poster image */}
      {!imgLoaded && !imgError && (
        <div className="absolute inset-0 bg-[#1a1a2e]">
          <div className="absolute inset-0 shimmer" />
        </div>
      )}
      <img
        src={imgError ? "https://placehold.co/400x600/1a1a2e/555?text=No+Poster" : show.posterUrl}
        alt={show.title}
        className={cn(
          "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
          imgLoaded ? "img-fade-in" : "opacity-0"
        )}
        onLoad={() => setImgLoaded(true)}
        onError={() => { setImgError(true); setImgLoaded(true); }}
      />

      {/* Always-visible bottom gradient */}
      <div className="absolute inset-0 poster-gradient" />

      {/* Type badge top-left */}
      <div className="absolute top-2 left-2">
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
          typeColors[show.type] ?? "bg-white/10 text-white/60 border-white/10"
        )}>
          {show.type}
        </span>
      </div>

      {/* Rating top-right */}
      {show.rating > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-semibold">
          <Star className="w-3 h-3 fill-[#f5c518] text-[#f5c518]" />
          <span className="text-white">{show.rating.toFixed(1)}</span>
        </div>
      )}

      {/* Play button center (on hover) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center play-pulse shadow-lg shadow-primary/40">
          <Play className="w-5 h-5 text-black fill-current ml-0.5" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-bold text-sm leading-tight text-white mb-1 line-clamp-2 drop-shadow-lg">
          {show.title}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-white/60">
          <span>{show.year}</span>
          {show.episodes && <span>{show.episodes} eps</span>}
          {show.duration && <span>{show.duration} min</span>}
        </div>
      </div>
    </Link>
  );
}

export function ShowCardSkeleton() {
  return (
    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a2e] border border-white/5 relative">
      <div className="absolute inset-0 shimmer" />
      <div className="absolute top-2 left-2 w-10 h-4 bg-white/10 rounded" />
      <div className="absolute top-2 right-2 w-10 h-4 bg-white/10 rounded" />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2.5 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}
