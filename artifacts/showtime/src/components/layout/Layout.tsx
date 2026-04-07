import { Navbar } from "./Navbar";
import { Link } from "wouter";
import { Play, Film, Tv, Zap, Layers } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] text-foreground flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080810] mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 justify-between mb-8">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="font-black text-lg text-white tracking-tight">SHOWTIME</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                Discover the best movies, anime, and TV shows from around the world. Your cinematic universe, all in one place.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Browse</h4>
                <div className="flex flex-col gap-2">
                  {[
                    { href: "/shows?type=movie", label: "Movies", icon: Film },
                    { href: "/shows?type=tv", label: "TV Shows", icon: Tv },
                    { href: "/shows?type=anime", label: "Anime", icon: Zap },
                    { href: "/shows", label: "All Shows", icon: Layers },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Genres</h4>
                <div className="flex flex-col gap-2">
                  {["Action", "Drama", "Sci-Fi", "Fantasy", "Thriller"].map((g) => (
                    <Link key={g} href={`/shows?genre=${encodeURIComponent(g)}`} className="text-sm text-white/50 hover:text-white transition-colors">
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
            <p>© {new Date().getFullYear()} Showtime. All rights reserved.</p>
            <p>For entertainment discovery only. All content belongs to respective owners.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
