import { Info, Plus, ShieldCheck } from "lucide-react";
import { INCOME_RANGES, PRESET_HOUSE_RULES } from "../../../utils/incomeRanges";
import { AMENITY_CATEGORIES } from "../../../utils/propertyUtils";

export default function Step3AmenitiesRules({
  wasBulkGenerated = false,
  unitsList = [],
  description = "",
  setDescription = () => {},
  selectedAmenities = [],
  toggleAmenity = () => {},
  customAddedAmenities = [],
  customAmenityInput = "",
  setCustomAmenityInput = () => {},
  handleAddCustomAmenity = () => {},
  requiredIncomeRange = "No Minimum Income",
  setRequiredIncomeRange = () => {},
  employmentRequirement = "Any Employment",
  setEmploymentRequirement = () => {},
  requiresGuarantor = false,
  setRequiresGuarantor = () => {},
  selectedHouseRules = [],
  setSelectedHouseRules = () => {},
  customRuleInput = "",
  setCustomRuleInput = () => {},
  rules = "",
  setRules = () => {}
}) {
  const safeDesc = description || "";
  const safeRules = rules || "";
  const safeAmenities = selectedAmenities || [];
  const safeCustomAmenities = customAddedAmenities || [];
  const safeHouseRules = selectedHouseRules || [];
  const safeUnits = unitsList || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* INFORMATIONAL CALLOUT BANNER FOR COMPOUND FACILITIES (Show only when bulk generated) */}
      {wasBulkGenerated && safeUnits.length > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
          <Info className="h-4 w-4 shrink-0 text-emerald-700 dark:text-[#E5C583] mt-0.5" />
          <div>
            <span className="font-bold">Compound & Shared Facilities: </span>
            We've pre-selected amenities and house rules based on your unit configurations in Step 2. Here, you can add overall compound-wide features (e.g. 24/7 Security Gate, Central Power Generator, Compound Parking) or click <span className="font-bold text-emerald-700 dark:text-[#E5C583]">"Next Step"</span> to proceed.
          </div>
        </div>
      )}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">Property Description & Overview</label>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{safeDesc.length}/1000</span>
        </div>
        <textarea
          rows={2}
          maxLength={1000}
          value={safeDesc}
          onChange={(e) => setDescription(e.target.value)}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${Math.max(44, Math.min(e.target.scrollHeight, 300))}px`;
          }}
          placeholder="Describe compound highlights, floor layout, security details, or neighborhood features (max 1000 chars)..."
          className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none resize-none leading-relaxed break-words"
        />
      </div>

      <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
        {(AMENITY_CATEGORIES || []).map((cat) => (
          <div key={cat.title}>
            <div className="text-[11px] font-bold text-slate-700 dark:text-[#E5C583] uppercase mb-2">{cat.title}</div>
            <div className="flex flex-wrap gap-2">
              {(cat.items || []).map((amenity) => {
                const isSelected = safeAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#2C4633] text-white border-transparent dark:bg-[#E5C583] dark:text-[#263b33]"
                        : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}{amenity}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* VISUAL DISPLAY OF CUSTOM ADDED AMENITIES */}
        {safeCustomAmenities.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-white/10">
            <div className="text-[11px] font-bold text-[#2C4633] dark:text-[#E5C583] uppercase mb-2 flex items-center justify-between">
              <span>Your Custom Amenities ({safeCustomAmenities.length})</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Click × to remove</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {safeCustomAmenities.map((amenity) => (
                <span
                  key={amenity}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-[#2C4633] text-white border-transparent dark:bg-[#E5C583] dark:text-[#263b33] flex items-center gap-1.5 shadow-xs"
                >
                  <span>✓ {amenity}</span>
                  <button
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className="ml-1 text-xs opacity-80 hover:opacity-100 font-bold border-none bg-transparent cursor-pointer text-white dark:text-[#263b33]"
                    title="Remove custom amenity"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOM AMENITY INPUT SECTION */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-[#E5C583] uppercase mb-2">
            Add Custom Amenity
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customAmenityInput}
              onChange={(e) => setCustomAmenityInput(e.target.value)}
              maxLength={500}
              placeholder="e.g. Smart Door Lock, Private Swimming Pool..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomAmenity();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomAmenity}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer border-none outline-none shrink-0 flex items-center gap-1 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      </div>

      {/* LANDLORD TENANT QUALIFICATION & HOUSE RULES SETUP */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C4633] dark:text-[#E5C583] flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" /> Tenant Qualification & Property Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
              Minimum Required Income Range (Annual / yr)
            </label>
            <select
              value={requiredIncomeRange}
              onChange={(e) => setRequiredIncomeRange(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none font-medium"
            >
              <option value="No Minimum Income">No Minimum Income Required</option>
              {(INCOME_RANGES || []).map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
              Employment Requirement
            </label>
            <select
              value={employmentRequirement}
              onChange={(e) => setEmploymentRequirement(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none font-medium"
            >
              <option value="Any Employment">Any Employment / Flexible</option>
              <option value="Employed Only">Employed / Salary Earners Only</option>
              <option value="Self-Employed / Business Owners">Self-Employed / Business Owners</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="formRequiresGuarantor"
            checked={requiresGuarantor}
            onChange={(e) => setRequiresGuarantor(e.target.checked)}
            className="h-4 w-4 rounded accent-[#2C4633] dark:accent-[#E5C583] cursor-pointer"
          />
          <label htmlFor="formRequiresGuarantor" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
            Mandatory Guarantor Required for Applicants
          </label>
        </div>

        {/* House Rules Checklist */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10">
          <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
            House Rules Checklist (Tenants must confirm compliance before applying)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(PRESET_HOUSE_RULES || []).map((rule) => {
              const isSelected = safeHouseRules.includes(rule);
              return (
                <button
                  key={rule}
                  type="button"
                  onClick={() => {
                    setSelectedHouseRules(prev =>
                      (prev || []).includes(rule) ? (prev || []).filter(r => r !== rule) : [...(prev || []), rule]
                    );
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#2C4633] text-white border-transparent dark:bg-[#E5C583] dark:text-[#263b33]"
                      : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}{rule}
                </button>
              );
            })}
          </div>

          {/* Custom House Rule Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customRuleInput}
              onChange={(e) => setCustomRuleInput(e.target.value)}
              placeholder="Add custom rule (e.g. No Single Women, Single Occupancy Only)..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (customRuleInput.trim() && !safeHouseRules.includes(customRuleInput.trim())) {
                    setSelectedHouseRules(prev => [...(prev || []), customRuleInput.trim()]);
                    setCustomRuleInput("");
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (customRuleInput.trim() && !safeHouseRules.includes(customRuleInput.trim())) {
                  setSelectedHouseRules(prev => [...(prev || []), customRuleInput.trim()]);
                  setCustomRuleInput("");
                }
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer border-none outline-none shrink-0"
            >
              + Add Rule
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">Additional Overview Notes (Optional)</label>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{safeRules.length}/500</span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={safeRules}
          onChange={(e) => setRules(e.target.value)}
          placeholder="Additional instructions or notes (max 500 chars)..."
          className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none resize-none leading-relaxed break-words"
        />
      </div>
    </div>
  );
}
