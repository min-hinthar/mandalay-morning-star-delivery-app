import type { ProfileRole } from "@/types/database";

export interface ProfileCheck {
  role: ProfileRole;
}

export interface RouteParams {
  params: Promise<{ id: string }>;
}
