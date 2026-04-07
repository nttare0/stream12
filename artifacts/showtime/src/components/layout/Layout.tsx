import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-white/5 py-8 mt-auto bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Showtime. Crafted for the cinematic experience.</p>
        </div>
      </footer>
    </div>
  );
}
