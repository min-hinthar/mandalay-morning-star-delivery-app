/**
 * Tests for useMutePreference hook (CFIX-10)
 *
 * Covers: SSR-safe default, localStorage hydration, invalid value recovery,
 * explicit setMuted + toggleMuted, persistence, storage throw recovery.
 *
 * Note: the global test setup (src/test/setup.ts) installs an inert localStorage
 * stub. This file installs a real in-memory localStorage for each test so we
 * can exercise the actual persistence path of the hook.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMutePreference } from "../useMutePreference";

const STORAGE_KEY = "trackingAudioMuted";

function createInMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  } satisfies Storage;
}

describe("useMutePreference", () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      value: createInMemoryStorage(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it("returns default unmuted on first render", () => {
    const { result } = renderHook(() => useMutePreference());
    // Synchronous first render — useEffect not yet run
    expect(result.current.isMuted).toBe(false);
  });

  it("hydrates from localStorage on mount", async () => {
    localStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useMutePreference());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.isMuted).toBe(true);
  });

  it("ignores invalid localStorage value", async () => {
    localStorage.setItem(STORAGE_KEY, "garbage");
    const { result } = renderHook(() => useMutePreference());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.isMuted).toBe(false);
  });

  it("defaults to unmuted when key absent", async () => {
    const { result } = renderHook(() => useMutePreference());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.isMuted).toBe(false);
  });

  it("setMuted(true) persists to localStorage", async () => {
    const { result } = renderHook(() => useMutePreference());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    act(() => {
      result.current.setMuted(true);
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
    expect(result.current.isMuted).toBe(true);
  });

  it("setMuted(false) writes 'false'", async () => {
    localStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useMutePreference());
    await waitFor(() => expect(result.current.isMuted).toBe(true));
    act(() => {
      result.current.setMuted(false);
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
    expect(result.current.isMuted).toBe(false);
  });

  it("toggleMuted flips state and persists", async () => {
    const { result } = renderHook(() => useMutePreference());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    act(() => {
      result.current.toggleMuted();
    });
    expect(result.current.isMuted).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
    act(() => {
      result.current.toggleMuted();
    });
    expect(result.current.isMuted).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("survives localStorage throwing on getItem", async () => {
    // Install a storage that throws on any read
    Object.defineProperty(window, "localStorage", {
      value: {
        get length() {
          return 0;
        },
        key: () => null,
        getItem: () => {
          throw new Error("QuotaExceeded");
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      } satisfies Storage,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useMutePreference());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.isMuted).toBe(false);
  });
});
