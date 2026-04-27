export function SkeletonCard() {
  return (
    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a2e] border border-white/5 relative">
      <div className="absolute inset-0 shimmer" />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2.5 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="absolute inset-0 bg-[#0f0f1a] overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-50" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center pt-16">
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-2">
            <div className="h-6 bg-white/10 rounded w-16" />
            <div className="h-6 bg-white/10 rounded w-20" />
            <div className="h-6 bg-white/10 rounded w-14" />
          </div>
          <div className="h-14 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="flex gap-3 pt-3">
            <div className="h-12 bg-white/10 rounded-lg w-36" />
            <div className="h-12 bg-white/10 rounded-lg w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="w-full h-[50vh] bg-[#1a1a2e] relative overflow-hidden">
        <div className="absolute inset-0 shimmer" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
      </div>
      <div className="container mx-auto px-4 -mt-40 relative z-10 flex gap-8">
        <div className="w-56 flex-shrink-0 space-y-4">
          <div className="aspect-[2/3] bg-[#1a1a2e] rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="h-12 bg-[#1a1a2e] rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>
        <div className="flex-1 pt-32 space-y-4">
          <div className="flex gap-2">
            {[80, 60, 90, 70].map((w, i) => (
              <div key={i} className="h-7 bg-[#1a1a2e] rounded overflow-hidden relative" style={{ width: `${w}px` }}>
                <div className="absolute inset-0 shimmer" />
              </div>
            ))}
          </div>
          <div className="h-12 bg-[#1a1a2e] rounded w-3/4 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="flex gap-2">
            {[70, 80, 60, 75].map((w, i) => (
              <div key={i} className="h-6 bg-[#1a1a2e] rounded-full overflow-hidden relative" style={{ width: `${w}px` }}>
                <div className="absolute inset-0 shimmer" />
              </div>
            ))}
          </div>
          {[100, 90, 95, 70].map((w, i) => (
            <div key={i} className="h-4 bg-[#1a1a2e] rounded relative overflow-hidden" style={{ width: `${w}%` }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
