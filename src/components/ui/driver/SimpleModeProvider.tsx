"use client";

import { createContext, useContext, useState, useCallback } from "react";
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

  const toggleSimpleMode = useCallback(async () => {
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
      }
    } catch {
      setIsSimpleMode(!newMode);
      toast({ message: "Could not update mode. Try again.", type: "error" });
    }
  }, [isSimpleMode]);

  return (
    <SimpleModeContext value={{ isSimpleMode, toggleSimpleMode }}>{children}</SimpleModeContext>
  );
}
