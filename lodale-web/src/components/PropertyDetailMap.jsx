import { useEffect, useRef } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [6.5244, 3.3792]; // Lagos, Nigeria

export default function PropertyDetailMap({
  latitude,
  longitude,
  title = "Property Location",
  address = "",
  city = "",
  state = ""
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const centerCoords = hasValidCoords ? [lat, lng] : DEFAULT_CENTER;
  const fullLocationStr = [address, city, state].filter(Boolean).join(", ");

  const googleMapsUrl = hasValidCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocationStr || "Lagos, Nigeria")}`;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: centerCoords,
      zoom: hasValidCoords ? 15 : 12,
      scrollWheelZoom: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = L.marker(centerCoords).addTo(map);
    marker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #2C4633; font-size: 13px;">${title}</strong><br/>
        <span style="font-size: 11px; color: #555;">${fullLocationStr || "Property Location"}</span>
      </div>
    `);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="bg-white dark:bg-[#12221C] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-4 text-left">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Location & Neighbourhood Map
        </h3>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-moss-50 hover:bg-moss-100 text-moss-800 dark:bg-[#E5C583]/15 dark:text-[#E5C583] dark:hover:bg-[#E5C583]/25 font-bold text-xs rounded-xl transition-all border border-moss-200 dark:border-[#E5C583]/30 flex items-center gap-1.5 shadow-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
        </a>
      </div>

      {fullLocationStr && (
        <p className="text-xs text-ink-600 dark:text-cream-100/70 flex items-center gap-1">
          <span>{fullLocationStr}</span>
        </p>
      )}

      {/* Interactive Map Box */}
      <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-ink-200 dark:border-white/10 shadow-md">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
      </div>
    </div>
  );
}
