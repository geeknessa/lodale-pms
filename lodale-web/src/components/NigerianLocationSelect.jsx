import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, MapPin, Check } from "lucide-react";

export const NIGERIAN_LOCATIONS = [
  "Lagos - Lekki Phase 1",
  "Lagos - Victoria Island",
  "Lagos - Yaba",
  "Lagos - Ikeja",
  "Lagos - Surulere",
  "Lagos - Maryland",
  "Lagos - Ikoyi",
  "Lagos - Ajah",
  "FCT - Abuja (Maitama)",
  "FCT - Abuja (Gwarinpa)",
  "FCT - Abuja (Asokoro)",
  "FCT - Abuja (Guzape)",
  "FCT - Abuja (Wuse)",
  "Abia - Umuahia",
  "Abia - Aba",
  "Adamawa - Yola",
  "Akwa Ibom - Uyo",
  "Anambra - Awka",
  "Anambra - Onitsha",
  "Bauchi - Bauchi",
  "Bayelsa - Yenagoa",
  "Benue - Makurdi",
  "Borno - Maiduguri",
  "Cross River - Calabar",
  "Delta - Asaba",
  "Delta - Warri",
  "Ebonyi - Abakaliki",
  "Edo - Benin City",
  "Ekiti - Ado Ekiti",
  "Enugu - Enugu",
  "Gombe - Gombe",
  "Imo - Owerri",
  "Jigawa - Dutse",
  "Kaduna - Kaduna",
  "Kano - Kano",
  "Katsina - Katsina",
  "Kebbi - Birnin Kebbi",
  "Kogi - Lokoja",
  "Kwara - Ilorin",
  "Nasarawa - Lafia",
  "Niger - Minna",
  "Ogun - Abeokuta",
  "Ondo - Akure",
  "Osun - Osogbo",
  "Oyo - Ibadan",
  "Plateau - Jos",
  "Rivers - Port Harcourt",
  "Sokoto - Sokoto",
  "Taraba - Jalingo",
  "Yobe - Damaturu",
  "Zamfara - Gusau"
];

export default function NigerianLocationSelect({ value, onChange, className = "", placeholder = "Select Location..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = NIGERIAN_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelect = (loc) => {
    onChange(loc);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between cursor-pointer px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1C3328] text-ink-900 dark:text-white text-[13.5px] transition-all hover:border-moss-600 dark:hover:border-[#E5C583] ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <MapPin className="h-4 w-4 shrink-0 text-moss-600 dark:text-[#E5C583]" />
          <span className="truncate">{value || placeholder}</span>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[300] left-0 right-0 mt-1.5 max-h-60 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12221C] shadow-xl overflow-hidden flex flex-col">
          {/* Search Header */}
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50 dark:bg-[#172A22]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1F362C] border border-neutral-200 dark:border-neutral-700">
              <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="w-full bg-transparent text-[12.5px] text-ink-900 dark:text-white outline-none placeholder:text-neutral-400"
                autoFocus
              />
            </div>
          </div>

          {/* Locations list */}
          <div className="overflow-y-auto py-1 max-h-48">
            {filteredLocations.length === 0 ? (
              <div className="px-4 py-3 text-xs text-neutral-400 text-center">
                No location matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const isSelected = value === loc;
                return (
                  <div
                    key={loc}
                    onClick={() => handleSelect(loc)}
                    className={`flex items-center justify-between px-3.5 py-2 text-[13px] cursor-pointer transition-colors ${isSelected
                      ? "bg-moss-100/70 dark:bg-[#1E382A] text-moss-700 dark:text-[#E5C583] font-semibold"
                      : "text-ink-900 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/5"
                      }`}
                  >
                    <span className="truncate">{loc}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-moss-700 dark:text-[#E5C583]" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
