export function KPISkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-surface-primary border border-border">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-tertiary" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-20 rounded bg-surface-tertiary" />
            <div className="h-3 w-12 rounded bg-surface-tertiary" />
          </div>
        </div>
        <div className="h-9 w-24 rounded bg-surface-tertiary" />
        <div className="h-2 w-full rounded bg-surface-tertiary" />
      </div>
    </div>
  );
}
