import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useWards } from "@/hooks/useThermoraData";
import type { Ward } from "@/api/client";

interface WardContextValue {
  wards: Ward[];
  selectedWardId: number | undefined;
  setSelectedWardId: (id: number) => void;
  selectedWard: Ward | undefined;
  isLoading: boolean;
}

const WardContext = createContext<WardContextValue | undefined>(undefined);

export function WardProvider({ children }: { children: ReactNode }) {
  const { data: wards, isLoading } = useWards();
  const [selectedWardId, setSelectedWardId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!selectedWardId && wards && wards.length > 0) {
      // Default to the highest-population ward for a meaningful first view
      const sorted = [...wards].sort((a, b) => b.population - a.population);
      setSelectedWardId(sorted[0].id);
    }
  }, [wards, selectedWardId]);

  const selectedWard = useMemo(
    () => wards?.find((w) => w.id === selectedWardId),
    [wards, selectedWardId]
  );

  return (
    <WardContext.Provider
      value={{ wards: wards ?? [], selectedWardId, setSelectedWardId, selectedWard, isLoading }}
    >
      {children}
    </WardContext.Provider>
  );
}

export function useWardContext() {
  const ctx = useContext(WardContext);
  if (!ctx) throw new Error("useWardContext must be used within WardProvider");
  return ctx;
}
