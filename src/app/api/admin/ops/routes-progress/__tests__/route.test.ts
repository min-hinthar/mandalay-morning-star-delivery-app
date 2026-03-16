import { describe, it } from "vitest";

/**
 * Unit Tests: GET /api/admin/ops/routes-progress
 *
 * Wave 0 test scaffold for MOBL-04 API endpoint.
 * Stubs are populated with real assertions in Plan 04.
 */

describe("GET /api/admin/ops/routes-progress", () => {
  it.todo("returns 401 without auth");
  it.todo("returns today's non-completed routes");
  it.todo("excludes completed routes");
  it.todo("excludes planned routes");
  it.todo("includes driver name from profiles join");
  it.todo("includes stats_json in response");
});
