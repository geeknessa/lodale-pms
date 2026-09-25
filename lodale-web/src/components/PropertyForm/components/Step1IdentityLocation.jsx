import { Building2, Check, MapPin } from "lucide-react";
import Input from "../../Input";
import SearchableDropdown from "../../SearchableDropdown";
import { ALL_NIGERIAN_STATES, NIGERIAN_STATES_CITIES } from "../../../utils/nigerianStatesCities";

export default function Step1IdentityLocation({
  propertyType = "",
  setPropertyType = () => {},
  houseSubtype = "",
  setHouseSubtype = () => {},
  isMultiUnit = false,
  displayName = "",
  setDisplayName = () => {},
  address = "",
  setAddress = () => {},
  stateName = "Lagos",
  setStateName = () => {},
  cityName = "",
  setCityName = () => {}
}) {
  const safeDisplayName = displayName || "";
  const safeAddress = address || "";

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-2">
          Select Building Category *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {[
            { id: "single_house", label: "Single House", desc: "Bungalow, duplex, terrace, or detached home" },
            { id: "apartment_building", label: "Apartment Building", desc: "Block of flats or multi-family building" },
            { id: "estate", label: "Gated Estate", desc: "Housing estate with multiple blocks/houses" },
            { id: "hostel", label: "Student Hostel", desc: "Student accommodation with rooms/wings" },
            { id: "boys_quarters", label: "Boys Quarters (BQ)", desc: "Outbuilding / Self-contained BQ unit" },
            { id: "commercial_building", label: "Commercial Building", desc: "Offices, shops, plazas, or commercial units" }
          ].map((typeObj) => {
            const isSelected = propertyType === typeObj.id;
            return (
              <button
                key={typeObj.id}
                type="button"
                onClick={() => setPropertyType(typeObj.id)}
                className={`dap-option-card ${isSelected ? "selected" : ""}`}
              >
                <div className="dap-option-icon">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="dap-option-title flex items-center justify-between">
                    <span>{typeObj.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" />}
                  </div>
                  <div className="dap-option-desc">{typeObj.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {propertyType === "single_house" && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 animate-in fade-in mb-4">
            <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
              Specify House Type (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "duplex", label: "Duplex" },
                { id: "bungalow", label: "Bungalow" },
                { id: "terrace", label: "Terrace / Semi-Detached" },
                { id: "detached", label: "Detached House" },
                { id: "other", label: "Other House" }
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setHouseSubtype(sub.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer outline-none ${
                    houseSubtype === sub.id
                      ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent font-bold"
                      : "bg-white dark:bg-[#16241F] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/15"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#E5C583] flex items-center gap-1.5 mb-3">
          <MapPin className="h-4 w-4" /> Location & Address Details
        </h3>

        <div className="mb-4">
          <Input
            id="displayName"
            label={isMultiUnit ? "Building / Estate / Complex Name *" : "Property / Estate Display Name *"}
            value={safeDisplayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={isMultiUnit ? "e.g. Royal Palms Court or Block A Apartments" : "e.g. Green Valley Estate or Sunshine Apartments"}
            maxLength={500}
            multiline={true}
            rows={2}
            required
          />
          <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1 mb-3">
            {safeDisplayName.length}/500
          </div>
        </div>

        <div className="mb-4">
          <Input
            id="address"
            label="Full Street Address *"
            value={safeAddress}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Plot 14, Admiralty Way, Lekki Phase 1"
            maxLength={500}
            multiline={true}
            rows={2}
            light={false}
            required
          />
          <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1 mb-4">
            {safeAddress.length}/500
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 z-20">
          <SearchableDropdown
            id="state"
            label="State / Region *"
            value={stateName}
            onChange={(selectedState) => {
              setStateName(selectedState);
              const newCities = NIGERIAN_STATES_CITIES[selectedState] || [];
              if (!newCities.includes(cityName)) {
                setCityName("");
              }
            }}
            options={ALL_NIGERIAN_STATES}
            placeholder="Select or search state..."
            required
          />

          <SearchableDropdown
            id="city"
            label="City / Area *"
            value={cityName}
            onChange={(selectedCity) => setCityName(selectedCity)}
            options={NIGERIAN_STATES_CITIES[stateName] || []}
            placeholder={stateName ? `Select area in ${stateName}...` : "Select state first..."}
            required
          />
        </div>
      </div>
    </div>
  );
}
