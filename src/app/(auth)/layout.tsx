import type { ReactNode } from "react";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <DomMaxProvider>{children}</DomMaxProvider>;
}
