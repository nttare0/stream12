import { Layout } from "@/components/layout/Layout";
import { ShowCard, ShowCardSkeleton } from "@/components/shared/ShowCard";
import { useListShows, useListGenres, type ListShowsType } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, FilterX, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export function Browse() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const typeParam = params.get("type") as ListShowsType | null;
  const genreParam = params.get("genre");
  const qParam = params.get("search");
  const pageParam = Number(params.get("page") || "1");

  const [searchInput, setSearchInput] = useState(qParam || "");

  const { data: genresData } = useListGenres();
  const { data: showsData, isLoading } = useListShows({
    type: typeParam || undefined,
    genre: genreParam || undefined,
    search: qParam || undefined,
    page: pageParam,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    setSearchInput(qParam || "");
  }, [qParam]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchStr);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) newParams.delete(k);
      else newParams.set(k, v);
    });
    newParams.delete("page");
    setLocation(`/shows?${newParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput || null });
  };

  const setPage = (p: number) => {
    const newParams = new URLSearchParams(searchStr);
    newParams.set("page", String(p));
    setLocation(`/shows?${newParams.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const types: { label: string; value: ListShowsType | null; color: string }[] = [
    { label: "All", value: null, color: "bg-white/10 text-white" },
    { label: "Movies", value: "movie", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    { label: "TV Shows", value: "tv", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { label: "Anime", value: "anime", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  ];

  const totalPages = Math.ceil((showsData?.total ?? 0) / PAGE_SIZE);
  const hasFilters = !!(typeParam || genreParam || qParam);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">
            {qParam ? `Results for "${qParam}"` : "Browse Shows"}
          </h1>
          <p className="text-white/40 text-sm">
            {showsData ? `${showsData.total} titles found` : "Discovering..."}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-60 xl:w-64 flex-shrink-0 space-y-6">
            {/* Search */}
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="search"
                  placeholder="Search titles..."
                  className="w-full pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-10 focus-visible:border-primary focus-visible:bg-white/8 transition-all"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </form>

            {/* Type filter */}
            <div>
              <h3 className="font-bold text-sm text-white/60 uppercase tracking-wider flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Type
              </h3>
              <div className="flex flex-col gap-1">
                {types.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => updateFilters({ type: t.value })}
                    className={cn(
                      "text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all border",
                      typeParam === t.value || (!typeParam && !t.value)
                        ? cn("border", t.color)
                        : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre filter */}
            {genresData && genresData.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-white/60 uppercase tracking-wider mb-3">Genres</h3>
                <div className="flex flex-wrap gap-1.5">
                  {genresData.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => updateFilters({ genre: genreParam === g.name ? null : g.name })}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                        genreParam === g.name
                          ? "bg-primary border-primary text-black font-bold"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {g.name}
                      <span className="ml-1 opacity-50">{g.showCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasFilters && (
              <button
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => setLocation("/shows")}
              >
                <FilterX className="w-4 h-4" /> Clear Filters
              </button>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ShowCardSkeleton key={i} />
                ))}
              </div>
            ) : showsData?.shows.length ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {showsData.shows.map((show) => (
                    <ShowCard key={show.id} show={show} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage(pageParam - 1)}
                      disabled={pageParam <= 1}
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          "w-9 h-9 rounded-lg border text-sm font-medium transition-all",
                          p === pageParam
                            ? "bg-primary border-primary text-black font-bold"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(pageParam + 1)}
                      disabled={pageParam >= totalPages}
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/10">
                  <Search className="w-8 h-8 text-white/20" />
                </div>
                <h2 className="text-xl font-bold mb-2">No shows found</h2>
                <p className="text-white/40 text-sm mb-6">Try adjusting your filters or search term</p>
                <button
                  onClick={() => setLocation("/shows")}
                  className="px-5 py-2.5 bg-primary/20 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
