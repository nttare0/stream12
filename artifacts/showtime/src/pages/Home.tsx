import { Layout } from "@/components/layout/Layout";
import { ShowRow } from "@/components/shared/ShowRow";
import { useGetFeaturedShows, useGetTrendingShows, useListShows } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Play, Info, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Home() {
  const { data: featuredShows, isLoading: isLoadingFeatured } = useGetFeaturedShows();
  const { data: trendingShows, isLoading: isLoadingTrending } = useGetTrendingShows({ limit: 10 });
  const { data: movies, isLoading: isLoadingMovies } = useListShows({ type: "movie", limit: 10 });
  const { data: anime, isLoading: isLoadingAnime } = useListShows({ type: "anime", limit: 10 });
  const { data: tv, isLoading: isLoadingTv } = useListShows({ type: "tv", limit: 10 });

  const heroShow = featuredShows?.[0];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative w-full h-[70vh] min-h-[500px] flex items-end pb-16 pt-32">
        {isLoadingFeatured ? (
          <div className="absolute inset-0 bg-card animate-pulse" />
        ) : heroShow ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img 
                src={heroShow.backdropUrl || heroShow.posterUrl} 
                alt={heroShow.title} 
                className="w-full h-full object-cover opacity-60 mix-blend-screen scale-105 transform-gpu blur-[2px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
            </div>
            
            <div className="container mx-auto px-4 relative z-10 w-full">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <div className="flex items-center gap-3 mb-4 text-sm font-medium">
                  <span className="px-2 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider text-xs">
                    {heroShow.type}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    {heroShow.rating.toFixed(1)}
                  </span>
                  <span className="text-white/70">{heroShow.year}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
                  {heroShow.title}
                </h1>
                <p className="text-lg text-white/70 mb-8 line-clamp-3 leading-relaxed">
                  {heroShow.description}
                </p>
                <div className="flex items-center gap-4">
                  <Button asChild size="lg" className="gap-2 font-semibold">
                    <Link href={`/shows/${heroShow.id}`}>
                      <Play className="w-5 h-5 fill-current" /> Watch Now
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md">
                    <Link href={`/shows/${heroShow.id}`}>
                      <Info className="w-5 h-5" /> More Info
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </section>

      <div className="relative z-20 -mt-10 pb-20 space-y-4">
        <ShowRow 
          title="Trending Now" 
          shows={trendingShows} 
          isLoading={isLoadingTrending} 
          href="/shows?trending=true"
        />
        <ShowRow 
          title="Cinematic Movies" 
          shows={movies?.shows} 
          isLoading={isLoadingMovies} 
          href="/shows?type=movie"
        />
        <ShowRow 
          title="Acclaimed Anime" 
          shows={anime?.shows} 
          isLoading={isLoadingAnime} 
          href="/shows?type=anime"
        />
        <ShowRow 
          title="Binge-Worthy TV" 
          shows={tv?.shows} 
          isLoading={isLoadingTv} 
          href="/shows?type=tv"
        />
      </div>
    </Layout>
  );
}
