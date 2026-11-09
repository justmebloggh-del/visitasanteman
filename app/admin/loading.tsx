export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-12" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-1/3 rounded bg-forest-soft" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-forest-soft" />)}</div>
    </div>
  );
}
