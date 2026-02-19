/**
 * Earnings computation library
 *
 * Shared logic for computing driver earnings from route_stops data.
 */

export { computeRouteEarnings, aggregateByPeriod } from "./compute";

export type { RouteEarning, EarningsPeriod, ChartDataPoint } from "./compute";
