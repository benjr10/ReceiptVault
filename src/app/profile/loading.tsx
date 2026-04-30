export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        <header className="px-4 pt-12 pb-4 flex items-center justify-center relative">
          <div className="absolute left-4 w-6 h-6 bg-surface-100 rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-surface-100 rounded animate-pulse" />
          <div className="absolute right-4 w-9 h-9 bg-surface-100 rounded-full animate-pulse" />
        </header>

        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-surface-100 mb-4 animate-pulse" />
            <div className="h-6 w-32 bg-surface-100 rounded mb-2 animate-pulse" />
            <div className="h-4 w-48 bg-surface-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="mt-8 px-4 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-20 bg-surface-50 rounded animate-pulse ml-1" />
              <div className="h-32 bg-surface-100 rounded-2xl w-full animate-pulse shadow-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
