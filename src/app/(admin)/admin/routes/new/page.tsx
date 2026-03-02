import type { Metadata } from "next";
import { RouteBuilderClient } from "@/components/ui/admin/routes/RouteBuilder";

export const metadata: Metadata = {
  title: "New Route | Admin",
};

export default function NewRoutePage() {
  return <RouteBuilderClient />;
}
