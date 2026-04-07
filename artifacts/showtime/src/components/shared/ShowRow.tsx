import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { type Show } from "@workspace/api-client-react";
import { ShowCard, ShowCardSkeleton } from "./ShowCard";

interface ShowRowProps {
  title: string;
  shows?: Show[];
  isLoading?: boolean;
  href?: string;
}

export function ShowRow({ title, shows, isLoading, href }: ShowRowProps) {
  if (!isLoading && (!shows || shows.length === 0)) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {href && (
            <Link href={href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group">
              View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
        
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 snap-x">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-none w-36 md:w-48 lg:w-56 snap-start">
                <ShowCardSkeleton />
              </div>
            ))
          ) : (
            shows?.map((show) => (
              <div key={show.id} className="flex-none w-36 md:w-48 lg:w-56 snap-start">
                <ShowCard show={show} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
