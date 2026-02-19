import { CalendarDays } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-secondary" />
        <h1 className="text-xl font-heading font-bold text-text-primary">Schedule</h1>
      </div>
      <div className="rounded-2xl bg-surface-primary p-6 shadow-card border border-border text-center">
        <p className="text-text-secondary">Coming in Phase 73</p>
      </div>
    </div>
  );
}
