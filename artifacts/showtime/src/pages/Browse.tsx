import { Layout } from "@/components/layout/Layout";
import { ShowCard, ShowCardSkeleton } from "@/components/shared/ShowCard";
import { useListShows, useListGenres, type ListShowsType } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, FilterX } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Browse() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  
  const typeParam = params.get("type") as ListShowsType | null;
  const genreParam = params.get("genre");
  const qParam = params.get("search");
  
  const [searchInput, setSearchInput] = useState(qParam || "");

  const { data: genresData } = useListGenres();
  const { data: showsData, isLoading } = useListShows({
    type: typeParam || undefined,
    genre: genreParam || undefined,
    search: qParam || undefined,
    limit: 20
  });

  const updateFilters = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchStr);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) newParams.delete(k);
      else newParams.set(k, v);
    });
    setLocation(`/shows?${newParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput || null });
  };

  const types: { label: string; value: ListShowsType | null }[] = [
    { label: "All", value: null },
    { label: "Movies", value: "movie" },
    { label: "TV Shows", value: "tv" },
    { label: "Anime", value: "anime" },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search..." 
                className="w-full pl-9 bg-card border-white/10"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-white/5 pb-2">
                <SlidersHorizontal className="w-4 h-4" /> Type
              </h3>
              <div className="flex flex-col gap-1">
                {types.map(t => (
                  <button
                    key={t.label}
                    onClick={() => updateFilters({ type: t.value })}
                    className={cn(
                      "text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      typeParam === t.value 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {genresData && genresData.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-white/5 pb-2">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {genresData.map(g => (
                    <button
                      key={g.id}
                      onClick={() => updateFilters({ genre: genreParam === g.name ? null : g.name })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        genreParam === g.name 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "bg-card border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                      )}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(typeParam || genreParam || qParam) && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setLocation("/shows")}
              >
                <FilterX className="w-4 h-4 mr-2" /> Clear Filters
              </Button>
            )}
          </aside>

          {/* Main Grid */}
          <main className="flex-1">
            <h1 className="text-3xl font-bold mb-6">
              {qParam ? `Results for "${qParam}"` : "Discover Shows"}
              {showsData && <span className="text-muted-foreground text-lg ml-3 font-normal">({showsData.total})</span>}
            </h1>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <ShowCardSkeleton key={i} />
                ))}
              </div>
            ) : showsData?.shows.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {showsData.shows.map(show => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-white/5 rounded-xl">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">No shows found</h2>
                <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
