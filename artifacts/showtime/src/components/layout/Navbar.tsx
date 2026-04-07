import { Link, useLocation } from "wouter";
import { Search, Film, Tv, PlaySquare } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/shows?search=${encodeURIComponent(search.trim())}`);
    } else {
      setLocation(`/shows`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <PlaySquare className="w-6 h-6 fill-current" />
            <span className="font-bold text-xl tracking-tight">SHOWTIME</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-foreground/80 hover:text-primary transition-colors">Home</Link>
            <Link href="/shows?type=movie" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
              <Film className="w-4 h-4" /> Movies
            </Link>
            <Link href="/shows?type=tv" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
              <Tv className="w-4 h-4" /> TV Shows
            </Link>
            <Link href="/shows?type=anime" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
              <PlaySquare className="w-4 h-4" /> Anime
            </Link>
            <Link href="/shows" className="text-foreground/80 hover:text-primary transition-colors">Browse All</Link>
            <Link href="/admin" className="text-foreground/80 hover:text-primary transition-colors">Admin</Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full max-w-xs hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search shows..." 
            className="w-full pl-9 bg-white/5 border-white/10 focus-visible:border-primary rounded-full h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>
    </nav>
  );
}
