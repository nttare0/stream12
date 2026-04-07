import { Link } from "wouter";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { type Show } from "@workspace/api-client-react";
import { ShowCard, ShowCardSkeleton } from "./ShowCard";
import { useRef, useState, useCallback } from "react";

interface ShowRowProps {
  title: string;
  shows?: Show[];
  isLoading?: boolean;
  href?: string;
  accent?: string;
}

export function ShowRow({ title, shows, isLoading, href, accent }: ShowRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(updateScrollState, 400);
  };

  if (!isLoading && (!shows || shows.length === 0)) return null;

  return (
    <section className="py-5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {accent && <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accent }} />}
            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {href && (
              <Link href={href} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory -mx-4 px-4"
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-none w-36 md:w-44 lg:w-48 snap-start">
                  <ShowCardSkeleton />
                </div>
              ))
            : shows?.map((show) => (
                <div key={show.id} className="flex-none w-36 md:w-44 lg:w-48 snap-start">
                  <ShowCard show={show} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
