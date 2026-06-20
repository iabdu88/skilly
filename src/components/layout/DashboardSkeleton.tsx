// Rendered by loading.tsx files while server components stream in.
// Matches the header + content layout so there's no layout shift on load.
export function DashboardSkeleton({ variant = "stats" }: { variant?: "stats" | "cards" | "list" }) {
  return (
    <div className="flex flex-col">
      {/* Header shimmer — mirrors the real Header height and controls */}
      <div className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="h-4 w-40 bg-muted/60 rounded animate-pulse ms-10 lg:ms-0" />
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-muted/60 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-muted/60 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-muted/60 animate-pulse" />
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Page title */}
        <div className="space-y-1.5">
          <div className="h-7 w-52 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted/40 rounded animate-pulse" />
        </div>

        {variant === "stats" && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-4 border border-border space-y-3">
                  <div className="w-6 h-6 bg-muted/60 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted/60 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
                </div>
              ))}
            </div>
            {/* List rows */}
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-card rounded-2xl border border-border animate-pulse" />
              ))}
            </div>
          </>
        )}

        {variant === "cards" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="w-full h-32 bg-muted/60 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-muted/60 rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                  <div className="h-1.5 w-full bg-muted/40 rounded-full animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {variant === "list" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="h-12 border-b border-border bg-muted/20 animate-pulse" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 border-b border-border/50 last:border-0 flex items-center px-4 gap-4">
                <div className="h-4 w-1/3 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-muted/40 rounded animate-pulse ms-auto" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
