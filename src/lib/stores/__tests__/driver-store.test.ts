import { describe, it, expect, beforeEach } from "vitest";
import { useDriverStore } from "../driver-store";

describe("Driver Store", () => {
  beforeEach(() => {
    // Reset store before each test
    useDriverStore.getState().resetDriverState();
  });

  describe("Initial State", () => {
    it("should have correct initial values", () => {
      const state = useDriverStore.getState();

      expect(state.currentRouteId).toBeNull();
      expect(state.currentStopIndex).toBe(0);
      expect(state.isTrackingLocation).toBe(false);
      expect(state.lastLocation).toBeNull();
      expect(state.isOnline).toBe(true);
    });
  });

  describe("Route Management", () => {
    it("should set current route", () => {
      const { setCurrentRoute } = useDriverStore.getState();
      const routeId = "test-route-123";

      setCurrentRoute(routeId);

      expect(useDriverStore.getState().currentRouteId).toBe(routeId);
    });

    it("should clear current route when set to null", () => {
      const { setCurrentRoute } = useDriverStore.getState();

      setCurrentRoute("test-route-123");
      setCurrentRoute(null);

      expect(useDriverStore.getState().currentRouteId).toBeNull();
    });

    it("should set current stop index", () => {
      const { setCurrentStopIndex } = useDriverStore.getState();

      setCurrentStopIndex(5);

      expect(useDriverStore.getState().currentStopIndex).toBe(5);
    });
  });

  describe("Location Tracking", () => {
    it("should enable location tracking", () => {
      const { setTrackingEnabled } = useDriverStore.getState();

      setTrackingEnabled(true);

      expect(useDriverStore.getState().isTrackingLocation).toBe(true);
    });

    it("should disable location tracking", () => {
      const { setTrackingEnabled } = useDriverStore.getState();

      setTrackingEnabled(true);
      setTrackingEnabled(false);

      expect(useDriverStore.getState().isTrackingLocation).toBe(false);
    });

    it("should set location data", () => {
      const { setLocation } = useDriverStore.getState();
      const location = {
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 10,
        timestamp: "2024-01-15T12:00:00Z",
      };

      setLocation(location);

      expect(useDriverStore.getState().lastLocation).toEqual(location);
    });
  });

  describe("Online Status", () => {
    it("should set online status to false", () => {
      const { setOnlineStatus } = useDriverStore.getState();

      setOnlineStatus(false);

      expect(useDriverStore.getState().isOnline).toBe(false);
    });

    it("should set online status to true", () => {
      const { setOnlineStatus } = useDriverStore.getState();

      setOnlineStatus(false);
      setOnlineStatus(true);

      expect(useDriverStore.getState().isOnline).toBe(true);
    });
  });

  describe("Reset State", () => {
    it("should reset all state to initial values", () => {
      const state = useDriverStore.getState();

      // Set various state values
      state.setCurrentRoute("route-123");
      state.setCurrentStopIndex(3);
      state.setTrackingEnabled(true);
      state.setOnlineStatus(false);
      state.setLocation({
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 10,
        timestamp: "2024-01-15T12:00:00Z",
      });

      // Reset
      state.resetDriverState();

      // Verify all reset
      const resetState = useDriverStore.getState();
      expect(resetState.currentRouteId).toBeNull();
      expect(resetState.currentStopIndex).toBe(0);
      expect(resetState.isTrackingLocation).toBe(false);
      expect(resetState.lastLocation).toBeNull();
      expect(resetState.isOnline).toBe(true);
    });
  });
});
