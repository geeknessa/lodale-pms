import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Check, Loader2, Compass } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [6.5244, 3.3792]; // Lagos, Nigeria default

export default function PropertyLocationPickerMap({
  initialLat,
  initialLng,
  initialAddress = "",
  initialCity = "",
  initialState = "",
  onLocationSelect
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(() => {
    const lat = parseFloat(initialLat);
    const lng = parseFloat(initialLng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return [lat, lng];
    }
    return DEFAULT_CENTER;
  });

  const [locationDetails, setLocationDetails] = useState({
    address: initialAddress,
    city: initialCity,
    state: initialState,
    latitude: initialLat || "",
    longitude: initialLng || ""
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const center = selectedCoords;
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 14,
      scrollWheelZoom: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create draggable marker
    const marker = L.marker(center, { draggable: true }).addTo(map);
    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Handle marker drag end
    marker.on("dragend", async (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateLocationFromCoords(lat, lng);
    });

    // Handle map click
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateLocationFromCoords(lat, lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when props change externally
  useEffect(() => {
    const lat = parseFloat(initialLat);
    const lng = parseFloat(initialLng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([lat, lng], 15);
        markerRef.current.setLatLng([lat, lng]);
        setSelectedCoords([lat, lng]);
      }
    }
  }, [initialLat, initialLng]);

  // Reverse geocode lat/lng to get address
  const updateLocationFromCoords = async (lat, lng) => {
    const formattedLat = parseFloat(lat).toFixed(6);
    const formattedLng = parseFloat(lng).toFixed(6);
    setSelectedCoords([lat, lng]);

    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      
      let fetchedAddress = "";
      let fetchedCity = "";
      let fetchedState = "";

      if (data && data.address) {
        const a = data.address;
        fetchedAddress = [a.road, a.suburb, a.neighbourhood, a.residential]
          .filter(Boolean)
          .join(", ") || data.display_name?.split(",")[0] || "";

        fetchedCity = a.city || a.town || a.city_district || a.county || a.state_district || "";
        fetchedState = a.state || "";
      }

      const updated = {
        address: fetchedAddress || locationDetails.address,
        city: fetchedCity || locationDetails.city,
        state: fetchedState || locationDetails.state,
        latitude: formattedLat,
        longitude: formattedLng
      };

      setLocationDetails(updated);
      if (onLocationSelect) onLocationSelect(updated);
    } catch (err) {
      console.warn("Reverse geocoding failed:", err);
      const fallback = {
        ...locationDetails,
        latitude: formattedLat,
        longitude: formattedLng
      };
      setLocationDetails(fallback);
      if (onLocationSelect) onLocationSelect(fallback);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Search location via Nominatim API
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const queryWithCountry = searchQuery.toLowerCase().includes("nigeria")
        ? searchQuery
        : `${searchQuery}, Nigeria`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCountry)}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error("Location search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select location from search dropdown
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }

    const a = result.address || {};
    const fetchedAddress = [a.road, a.suburb, a.neighbourhood]
      .filter(Boolean)
      .join(", ") || result.display_name.split(",")[0];

    const fetchedCity = a.city || a.town || a.city_district || a.county || "";
    const fetchedState = a.state || "";

    const updated = {
      address: fetchedAddress,
      city: fetchedCity,
      state: fetchedState,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    };

    setLocationDetails(updated);
    setSelectedCoords([lat, lng]);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    if (onLocationSelect) onLocationSelect(updated);
  };

  // Auto-detect browser GPS
  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
      }
      updateLocationFromCoords(lat, lng);
    });
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Map Search Bar */}
      <div className="relative">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 dark:text-cream-100/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, landmark, area (e.g. Lekki Phase 1, Victoria Island)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/10 rounded-xl text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583] shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#0B1512] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Find Pin</span>
          </button>

          <button
            type="button"
            onClick={handleDetectGPS}
            title="Auto-detect my current GPS location"
            className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Compass className="h-4 w-4" /> GPS
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-[1000] left-0 right-0 mt-1.5 bg-white dark:bg-[#12221C] border border-ink-200 dark:border-white/15 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-ink-100 dark:divide-white/5">
            {searchResults.map((res) => (
              <button
                key={res.place_id}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left p-3 text-xs hover:bg-moss-50 dark:hover:bg-white/5 text-ink-800 dark:text-cream-100 flex items-start gap-2 cursor-pointer transition-colors"
              >
                <MapPin className="h-4 w-4 text-moss-600 dark:text-[#E5C583] shrink-0 mt-0.5" />
                <span className="line-clamp-2">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Box */}
      <div className="relative rounded-2xl overflow-hidden border border-ink-200 dark:border-white/10 shadow-md">
        <div ref={mapContainerRef} className="h-64 w-full z-0" />
        
        <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-[#12221C]/90 backdrop-blur-md p-2.5 rounded-xl border border-ink-100 dark:border-white/10 text-[11px] text-ink-700 dark:text-cream-100/80 flex items-center justify-between z-[500]">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Navigation className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583] shrink-0" />
            <span className="truncate">
              {isReverseGeocoding ? (
                <span className="italic text-amber-600 dark:text-amber-400">Locating coordinates...</span>
              ) : (
                `Lat: ${locationDetails.latitude || selectedCoords[0].toFixed(4)}, Lng: ${locationDetails.longitude || selectedCoords[1].toFixed(4)}`
              )}
            </span>
          </div>
          <span className="text-[10px] text-moss-700 dark:text-[#E5C583] font-semibold shrink-0">
            💡 Drag pin or click map to move
          </span>
        </div>
      </div>
    </div>
  );
}
