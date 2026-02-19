import { Banknote } from "lucide-react";

export default function EarningsPage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Banknote className="h-6 w-6 text-secondary" />
        <h1 className="text-xl font-heading font-bold text-text-primary">Earnings</h1>
      </div>
      <div className="rounded-2xl bg-surface-primary p-6 shadow-card border border-border text-center">
        <p className="text-text-secondary">Coming soon</p>
      </div>
    </div>
  );
}
