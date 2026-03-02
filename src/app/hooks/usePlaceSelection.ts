import { useState, useCallback } from "react";
import { referenceService } from "@/services/api";
import { SearchableSelectOption } from "@/app/Components/SearchableSelectComponent/SearchableSelectComponent";

interface UsePlaceSelectionProps {
  onPlaceSelect: (
    field: string,
    placeId: string,
    option?: SearchableSelectOption,
  ) => void;
  onPlaceCreated: (
    context: "origen" | "destino",
    placeId: number,
    placeName: string,
    placeData?: any,
  ) => void;
}

export function usePlaceSelection({
  onPlaceSelect,
  onPlaceCreated,
}: UsePlaceSelectionProps) {
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [placeModalContext, setPlaceModalContext] = useState<
    "origen" | "destino" | null
  >(null);

  const handlePlaceSearch = useCallback(
    async (query: string): Promise<SearchableSelectOption[]> => {
      try {
        const results = await referenceService.searchPlaces(query);
        return results.map((place) => ({
          value: (place.place_id || place.id)?.toString() || "",
          label: place.name || place.nombre || "",
          data: place,
        }));
      } catch (error) {
        console.error("Error searching places:", error);
        return [];
      }
    },
    [],
  );

  const handlePlaceSelect = useCallback(
    async (
      field: string,
      placeId: string,
      option?: SearchableSelectOption,
    ) => {
      onPlaceSelect(field, placeId, option);
    },
    [onPlaceSelect],
  );

  const handleCreatePlace = useCallback((context: "origen" | "destino") => {
    setPlaceModalContext(context);
    setIsPlaceModalOpen(true);
  }, []);

  const handlePlaceCreatedInternal = useCallback(
    (placeId: number, placeName: string, placeData?: any) => {
      if (placeModalContext) {
        onPlaceCreated(placeModalContext, placeId, placeName, placeData);
      }
      setIsPlaceModalOpen(false);
      setPlaceModalContext(null);
    },
    [placeModalContext, onPlaceCreated],
  );

  return {
    isPlaceModalOpen,
    placeModalContext,
    setIsPlaceModalOpen,
    handlePlaceSearch,
    handlePlaceSelect,
    handleCreatePlace,
    handlePlaceCreated: handlePlaceCreatedInternal,
  };
}
