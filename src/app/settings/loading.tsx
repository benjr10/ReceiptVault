export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        <header className="px-4 pt-12 pb-4 flex items-center justify-between border-b border-surface-50">
          <div className="w-6 h-6 bg-surface-100 rounded-full animate-pulse" />
          <div className="h-6 w-32 bg-surface-100 rounded animate-pulse" />
          <div className="w-6 h-6 bg-transparent" />
        </header>

        <div className="p-4">
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-24 bg-surface-100 rounded-full animate-pulse" />
            <div className="h-10 w-24 bg-surface-50 rounded-full animate-pulse" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-surface-100 rounded-2xl w-full animate-pulse shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
