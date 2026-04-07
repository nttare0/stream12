import { Layout } from "@/components/layout/Layout";
import { 
  useGetShowStats, 
  useHealthCheck, 
  useListShows,
  useDeleteShow
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Activity, Plus, Trash2, Edit, Film, Tv, PlaySquare, BarChart } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function Admin() {
  const { data: stats, isLoading: statsLoading } = useGetShowStats();
  const { data: health, isLoading: healthLoading } = useHealthCheck();
  const { data: showsData, isLoading: showsLoading } = useListShows({ limit: 50 });
  const deleteShow = useDeleteShow();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this show?")) return;
    
    try {
      await deleteShow.mutateAsync({ id });
      toast({ title: "Show deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows/stats"] });
    } catch (error) {
      toast({ title: "Failed to delete show", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Activity className="w-4 h-4" /> 
              API Status: 
              {healthLoading ? (
                <span className="text-muted-foreground">Checking...</span>
              ) : health?.status === "ok" ? (
                <span className="text-green-500 font-medium">Online</span>
              ) : (
                <span className="text-destructive font-medium">Offline</span>
              )}
            </span>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Show
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <BarChart className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-4xl font-bold mb-1">
              {statsLoading ? "-" : stats?.totalShows}
            </h3>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Shows</p>
          </div>
          <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <Film className="w-8 h-8 text-secondary mb-3" />
            <h3 className="text-4xl font-bold mb-1">
              {statsLoading ? "-" : stats?.totalMovies}
            </h3>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Movies</p>
          </div>
          <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <Tv className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-4xl font-bold mb-1">
              {statsLoading ? "-" : stats?.totalTv}
            </h3>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">TV Shows</p>
          </div>
          <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <PlaySquare className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="text-4xl font-bold mb-1">
              {statsLoading ? "-" : stats?.totalAnime}
            </h3>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Anime</p>
          </div>
        </div>

        {/* Shows Table */}
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold tracking-tight">Recent Content</h2>
          </div>
          {showsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading shows...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-white/5">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showsData?.shows.map((show) => (
                  <TableRow key={show.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium text-muted-foreground">#{show.id}</TableCell>
                    <TableCell className="font-bold">{show.title}</TableCell>
                    <TableCell className="uppercase text-xs tracking-wider font-medium text-primary">
                      {show.type}
                    </TableCell>
                    <TableCell>{show.year}</TableCell>
                    <TableCell>{show.rating.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(show.id)}
                          disabled={deleteShow.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
}
