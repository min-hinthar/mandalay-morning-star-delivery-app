"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/hooks/useToastV8";

interface SimpleModeContextType {
  isSimpleMode: boolean;
  toggleSimpleMode: () => Promise<void>;
}

const SimpleModeContext = createContext<SimpleModeContextType>({
  isSimpleMode: false,
  toggleSimpleMode: async () => {},
});

export function useSimpleMode() {
  return useContext(SimpleModeContext);
}

interface SimpleModeProviderProps {
  initialMode: boolean;
  children: React.ReactNode;
}

export function SimpleModeProvider({ initialMode, children }: SimpleModeProviderProps) {
  const [isSimpleMode, setIsSimpleMode] = useState(initialMode);
  const router = useRouter();
  const isTogglingRef = useRef(false);

  const toggleSimpleMode = useCallback(async () => {
    // Ignore taps while a toggle is in flight — two overlapping PATCHes can
    // leave the optimistic state out of sync with the server.
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    const newMode = !isSimpleMode;
    setIsSimpleMode(newMode);

    try {
      const response = await fetch("/api/driver/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simpleMode: newMode }),
      });

      if (!response.ok) {
        setIsSimpleMode(!newMode);
        toast({ message: "Could not update mode. Try again.", type: "error" });
        return;
      }

      toast({
        message: newMode ? "Simple mode on" : "Simple mode off",
        type: "success",
      });
      // Re-sync server components that were rendered with the previous mode
      // (the layout passes simple_mode from the server into this provider).
      router.refresh();
    } catch {
      setIsSimpleMode(!newMode);
      toast({ message: "Could not update mode. Try again.", type: "error" });
    } finally {
      isTogglingRef.current = false;
    }
  }, [isSimpleMode, router]);

  return (
    <SimpleModeContext value={{ isSimpleMode, toggleSimpleMode }}>{children}</SimpleModeContext>
  );
}
