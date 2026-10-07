import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  value: { lat: number; lon: number } | null;
  onPick: (lat: number, lon: number) => void;
}

export default function MapPicker({ value, onPick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { maxBounds: [[19.5, 86.5], [27.5, 93.5]], minZoom: 6 }).setView(
      value ? [value.lat, value.lon] : [23.7, 90.35],
      value ? 10 : 7,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => pickRef.current(e.latlng.lat, e.latlng.lng));
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marker.current?.remove();
    if (value) {
      marker.current = L.circleMarker([value.lat, value.lon], {
        radius: 10, color: "#2E7D32", fillColor: "#2E7D32", fillOpacity: 0.6, weight: 3,
      }).addTo(m);
    }
  }, [value]);

  return <div ref={el} className="h-72 w-full overflow-hidden rounded-2xl border" role="application" />;
}
