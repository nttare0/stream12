import { Link, useLocation } from "wouter";
import { Search, Film, Tv, Menu, X, Zap, Home, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/shows?search=${encodeURIComponent(search.trim())}`);
      setSearchOpen(false);
      setSearch("");
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/shows?type=movie", label: "Movies", icon: Film },
    { href: "/shows?type=tv", label: "TV Shows", icon: Tv },
    { href: "/shows?type=anime", label: "Anime", icon: Zap },
    { href: "/shows", label: "Browse All", icon: Layers },
  ];

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50"
          : "bg-gradient-to-b from-black/70 to-transparent"
      )}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="font-black text-xl tracking-tight text-white">SHOWTIME</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  location === href || location.startsWith(href + "?")
                    ? "text-white bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Desktop search */}
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-44 lg:w-56 pl-8 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full text-sm focus-visible:border-primary focus-visible:bg-white/10 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="sm:hidden w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="sm:hidden px-4 pb-3 bg-[#0a0a0f]/95">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="search"
                placeholder="Search movies, anime, TV..."
                className="w-full pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </form>
          </div>
        )}

        {/* Mobile nav menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0a0a0f]/98 backdrop-blur-xl border-t border-white/5 px-4 py-4 flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
