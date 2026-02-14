// ===========================================
// Health Check Types
// ===========================================

export type ServiceName = "supabase" | "stripe" | "resend";
export type StatusLevel = "healthy" | "degraded" | "down";

export interface ServiceStatus {
  status: StatusLevel;
  configured: boolean;
  connected?: boolean;
  latency_ms?: number;
  error?: string;
}

export interface RouteStatus {
  path: string;
  reachable: boolean;
  status_code?: number;
}

export interface EnvCheckResult {
  configured: number;
  missing: string[];
  total: number;
  all_critical_present: boolean;
}

export interface HealthResponse {
  status: StatusLevel;
  production_ready: boolean;
  timestamp: string;
  version: string;
  environment: string;

  services: {
    supabase: ServiceStatus;
    stripe: ServiceStatus;
    resend: ServiceStatus;
  };

  routes: {
    auth_callback: RouteStatus;
    stripe_webhook: RouteStatus;
  };

  env: EnvCheckResult;
}
