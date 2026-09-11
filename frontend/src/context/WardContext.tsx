import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { State, District, Ward } from "@/api/client";

interface WardContextValue {
  states: State[];
  districts: District[];
  wards: Ward[];

  selectedStateId: number | undefined;
  selectedDistrictId: number | undefined;
  selectedWardId: number | undefined;

  setSelectedStateId: (id: number) => void;
  setSelectedDistrictId: (id: number) => void;
  setSelectedWardId: (id: number) => void;

  selectedWard: Ward | undefined;
  isLoading: boolean;
}

const WardContext = createContext<WardContextValue | undefined>(undefined);

export function WardProvider({ children }: { children: ReactNode }) {
  const { data: states, isLoading: statesLoading } = useQuery({
    queryKey: ["states"],
    queryFn: api.states,
  });

  const [selectedStateId, setSelectedStateId] = useState<number | undefined>(undefined);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | undefined>(undefined);
  const [selectedWardId, setSelectedWardIdState] = useState<number | undefined>(undefined);

  // Default to the first state once loaded
  useEffect(() => {
    if (!selectedStateId && Array.isArray(states) && states.length > 0) {
      setSelectedStateId(states[0].id);
    }
  }, [states, selectedStateId]);

  const { data: districts, isLoading: districtsLoading } = useQuery({
    queryKey: ["districts", selectedStateId],
    queryFn: () => api.districts(selectedStateId),
    enabled: !!selectedStateId,
  });

  // Default to the first district in the selected state
  useEffect(() => {
    if (Array.isArray(districts) && districts.length > 0) {
      const stillValid = districts.some((d) => d.id === selectedDistrictId);
      if (!stillValid) {
        setSelectedDistrictId(districts[0].id);
      }
    }
  }, [districts]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: wards, isLoading: wardsLoading } = useQuery({
    queryKey: ["wards", selectedDistrictId],
    queryFn: () => api.wards(selectedDistrictId),
    enabled: !!selectedDistrictId,
  });

  // Default to the highest-population ward in the selected district
  useEffect(() => {
    if (Array.isArray(wards) && wards.length > 0) {
      const stillValid = wards.some((w) => w.id === selectedWardId);
      if (!stillValid) {
        const sorted = [...wards].sort((a, b) => b.population - a.population);
        setSelectedWardIdState(sorted[0].id);
      }
    }
  }, [wards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Changing state resets district/ward downstream; changing district resets ward.
  function setSelectedStateIdAndReset(id: number) {
    setSelectedStateId(id);
    setSelectedDistrictId(undefined);
    setSelectedWardIdState(undefined);
  }
  function setSelectedDistrictIdAndReset(id: number) {
    setSelectedDistrictId(id);
    setSelectedWardIdState(undefined);
  }

  const selectedWard = useMemo(
    () => (Array.isArray(wards) ? wards.find((w) => w.id === selectedWardId) : undefined),
    [wards, selectedWardId]
  );

  return (
    <WardContext.Provider
      value={{
        states: Array.isArray(states) ? states : [],
        districts: Array.isArray(districts) ? districts : [],
        wards: Array.isArray(wards) ? wards : [],
        selectedStateId,
        selectedDistrictId,
        selectedWardId,
        setSelectedStateId: setSelectedStateIdAndReset,
        setSelectedDistrictId: setSelectedDistrictIdAndReset,
        setSelectedWardId: setSelectedWardIdState,
        selectedWard,
        isLoading: statesLoading || districtsLoading || wardsLoading,
      }}
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
