export default function Loading() {
  return (
    <div className="min-h-screen bg-white p-4 pt-12">
      <div className="max-w-md mx-auto">
        <div className="h-8 w-48 bg-surface-100 rounded-lg mb-8 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-surface-100 rounded-2xl w-full animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
