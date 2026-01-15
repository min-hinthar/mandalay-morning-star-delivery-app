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
      expect(state.pendingActions).toEqual([]);
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

  describe("Pending Actions Queue", () => {
    it("should add pending action", () => {
      const { addPendingAction } = useDriverStore.getState();
      const action = {
        type: "status_update" as const,
        stopId: "stop-123",
        routeId: "route-123",
        data: { status: "delivered" },
      };

      addPendingAction(action);

      const { pendingActions } = useDriverStore.getState();
      expect(pendingActions).toHaveLength(1);
      expect(pendingActions[0].type).toBe("status_update");
      expect(pendingActions[0].stopId).toBe("stop-123");
      expect(pendingActions[0].id).toBeDefined();
      expect(pendingActions[0].createdAt).toBeDefined();
    });

    it("should add multiple pending actions", () => {
      const { addPendingAction } = useDriverStore.getState();

      addPendingAction({
        type: "status_update",
        stopId: "stop-1",
        routeId: "route-123",
        data: {},
      });

      addPendingAction({
        type: "photo_upload",
        stopId: "stop-2",
        routeId: "route-123",
        data: {},
      });

      expect(useDriverStore.getState().pendingActions).toHaveLength(2);
    });

    it("should remove pending action by id", () => {
      const { addPendingAction, removePendingAction } = useDriverStore.getState();

      addPendingAction({
        type: "status_update",
        stopId: "stop-1",
        routeId: "route-123",
        data: {},
      });

      const actionId = useDriverStore.getState().pendingActions[0].id;

      removePendingAction(actionId);

      expect(useDriverStore.getState().pendingActions).toHaveLength(0);
    });

    it("should clear all pending actions", () => {
      const { addPendingAction, clearPendingActions } = useDriverStore.getState();

      addPendingAction({
        type: "status_update",
        stopId: "stop-1",
        routeId: "route-123",
        data: {},
      });

      addPendingAction({
        type: "exception",
        stopId: "stop-2",
        routeId: "route-123",
        data: {},
      });

      clearPendingActions();

      expect(useDriverStore.getState().pendingActions).toHaveLength(0);
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
      state.addPendingAction({
        type: "status_update",
        stopId: "stop-1",
        routeId: "route-123",
        data: {},
      });

      // Reset
      state.resetDriverState();

      // Verify all reset
      const resetState = useDriverStore.getState();
      expect(resetState.currentRouteId).toBeNull();
      expect(resetState.currentStopIndex).toBe(0);
      expect(resetState.isTrackingLocation).toBe(false);
      expect(resetState.lastLocation).toBeNull();
      expect(resetState.pendingActions).toEqual([]);
      expect(resetState.isOnline).toBe(true);
    });
  });
});
