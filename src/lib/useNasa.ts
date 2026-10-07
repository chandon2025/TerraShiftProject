import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNasaConditions } from "./nasa.functions";
import { useApp } from "./store";

export function useNasa() {
  const { farm } = useApp();
  const fn = useServerFn(getNasaConditions);
  const loc = farm.location;
  return useQuery({
    queryKey: ["nasa", loc?.lat, loc?.lon],
    queryFn: () => fn({ data: { lat: loc!.lat, lon: loc!.lon } }),
    enabled: !!loc,
    staleTime: 6 * 3600 * 1000,
    retry: 1,
  });
}
