import dynamic from "next/dynamic";
import { MapSkeleton } from "./MapSkeleton";
import type { MapStop } from "./RouteBuilderMap";

export type { MapStop };

const RouteBuilderMapInner = dynamic(
  () => import("./RouteBuilderMap").then((mod) => ({ default: mod.RouteBuilderMap })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export function RouteBuilderMap(props: {
  stops: MapStop[];
  center?: [number, number];
  onStopClick?: (id: string) => void;
}) {
  return <RouteBuilderMapInner {...props} />;
}
