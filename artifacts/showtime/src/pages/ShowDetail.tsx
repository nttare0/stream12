import { Layout } from "@/components/layout/Layout";
import { useGetShow, useGetTrendingShows } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Star, Clock, Calendar, CheckCircle2, PlaySquare } from "lucide-react";
import { ShowCard } from "@/components/shared/ShowCard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ShowDetail() {
  const [, params] = useRoute("/shows/:id");
  const id = Number(params?.id);

  const { data: show, isLoading } = useGetShow(id, { query: { enabled: !!id } });
  const { data: trendingShows } = useGetTrendingShows({ limit: 5 });

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-[60vh] bg-card animate-pulse" />
        <div className="container mx-auto px-4 -mt-32 relative z-10 flex gap-8">
          <div className="w-64 h-96 bg-background rounded-lg animate-pulse border border-white/10" />
          <div className="flex-1 space-y-4 pt-32">
            <div className="h-10 bg-card rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-card rounded w-1/4 animate-pulse" />
            <div className="h-32 bg-card rounded w-full animate-pulse mt-8" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!show) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-bold">Show not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Backdrop */}
      <div className="relative w-full h-[50vh] md:h-[60vh] min-h-[400px]">
        <img 
          src={show.backdropUrl || show.posterUrl} 
          alt={show.title} 
          className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 -mt-32 md:-mt-48 pb-20">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Poster */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-48 md:w-64 lg:w-72 flex-shrink-0 mx-auto md:mx-0"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-primary/10 bg-card">
              <img 
                src={show.posterUrl} 
                alt={show.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <Button size="lg" className="w-full mt-6 gap-2 text-md font-bold h-12">
              <PlaySquare className="w-5 h-5 fill-current" /> Watch Trailer
            </Button>
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 pt-4 md:pt-32"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm font-medium">
              <span className="px-2.5 py-1 rounded-sm bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider text-xs">
                {show.type}
              </span>
              <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-sm border border-yellow-500/20">
                <Star className="w-4 h-4 fill-current" />
                {show.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground bg-white/5 px-2.5 py-1 rounded-sm border border-white/5">
                <Calendar className="w-4 h-4" /> {show.year}
              </span>
              {(show.duration || show.episodes) && (
                <span className="flex items-center gap-1.5 text-muted-foreground bg-white/5 px-2.5 py-1 rounded-sm border border-white/5">
                  <Clock className="w-4 h-4" /> 
                  {show.type === 'movie' ? `${show.duration} min` : `${show.episodes} eps`}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-muted-foreground bg-white/5 px-2.5 py-1 rounded-sm border border-white/5 capitalize">
                <CheckCircle2 className="w-4 h-4" /> {show.status}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              {show.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-8">
              {show.genres.map(g => (
                <span key={g} className="px-3 py-1 rounded-full text-sm bg-secondary/10 text-secondary border border-secondary/20 font-medium">
                  {g}
                </span>
              ))}
            </div>

            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-3 text-white">Synopsis</h3>
              <p className="text-lg text-white/70 leading-relaxed">
                {show.description}
              </p>
            </div>
          </motion.div>

          {/* Sidebar */}
          <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 pt-4 md:pt-32 space-y-6">
            <h3 className="text-xl font-bold border-b border-white/10 pb-3">Trending</h3>
            <div className="flex flex-col gap-4">
              {trendingShows?.filter(s => s.id !== show.id).slice(0, 4).map(s => (
                <ShowCard key={s.id} show={s} className="w-full" />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
