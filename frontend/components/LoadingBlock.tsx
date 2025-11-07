export function LoadingBlock() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="h-24 bg-slate-200 rounded" />
    </div>
  );
}
