export function SkeletonCard({ className = '' }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
}

export function StatsBarSkeleton() {
  return (
    <div className="flex gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-1 bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="h-3 bg-gray-200 rounded animate-pulse mx-auto w-8 mb-2" />
          <div className="h-7 bg-gray-200 rounded animate-pulse mx-auto w-10 mb-1" />
          <div className="h-2 bg-gray-100 rounded animate-pulse mx-auto w-14" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-64" />
          </div>
          <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
