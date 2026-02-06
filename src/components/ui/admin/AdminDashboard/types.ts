export interface KPIData {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format: "number" | "currency" | "percentage" | "duration";
  icon: "orders" | "revenue" | "drivers" | "exceptions" | "target" | "activity";
  variant?: "default" | "success" | "warning" | "danger";
  goal?: number;
}

export interface AdminDashboardProps {
  /** KPI data array */
  kpis: KPIData[];
  /** Whether data is loading */
  loading?: boolean;
  /** Whether data is refreshing in background */
  refreshing?: boolean;
  /** Callback when refresh is requested */
  onRefresh?: () => void;
  /** Additional className */
  className?: string;
}
