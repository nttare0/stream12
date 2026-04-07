import { Link } from "wouter";
import { Star } from "lucide-react";
import { type Show } from "@workspace/api-client-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShowCardProps {
  show: Show;
  className?: string;
}

export function ShowCard({ show, className }: ShowCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link 
      href={`/shows/${show.id}`} 
      className={cn("group block relative aspect-[2/3] rounded-lg overflow-hidden bg-card border border-white/5 transition-all duration-300 hover:border-primary/50 glow-hover", className)}
    >
      <img 
        src={show.posterUrl || "https://placehold.co/400x600/1a1a1a/ffffff?text=No+Poster"} 
        alt={show.title}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          imgLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setImgLoaded(true)}
      />
      <div className="absolute inset-0 poster-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="font-bold text-lg leading-tight text-white mb-1 line-clamp-2">{show.title}</h3>
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span className="flex items-center gap-1 text-primary font-medium">
            <Star className="w-3 h-3 fill-current" />
            {show.rating.toFixed(1)}
          </span>
          <span>{show.year}</span>
        </div>
      </div>
    </Link>
  );
}

export function ShowCardSkeleton() {
  return (
    <div className="aspect-[2/3] rounded-lg bg-card animate-pulse border border-white/5" />
  );
}
