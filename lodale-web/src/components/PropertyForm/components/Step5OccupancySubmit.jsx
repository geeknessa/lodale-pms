import { Building2 } from "lucide-react";
import Input from "../../Input";
import Button from "../../Button";

export default function Step5OccupancySubmit({
  isMultiUnit = false,
  unitsList = [],
  setUnitsList = () => {},
  occupied = null,
  setOccupied = () => {},
  tenantName = "",
  setTenantName = () => {},
  tenantContact = "",
  setTenantContact = () => {},
  leaseStartDate = "",
  setLeaseStartDate = () => {},
  availableFrom = "",
  setAvailableFrom = () => {},
  isEditing = false,
  isFormFullyValid = true
}) {
  const safeUnits = unitsList || [];
  const safeTenantName = tenantName || "";
  const safeTenantContact = tenantContact || "";

  return (
    <div className="space-y-6 animate-in fade-in">
      {isMultiUnit ? (
        <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#E5C583] flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" />
              <span>Multi-Unit Portfolio Occupancy ({safeUnits.length} Units)</span>
            </h3>
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Portfolio Mode
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Specify occupancy status for your portfolio units. You can set all units as vacant for public tenant search, or configure unit-by-unit occupancy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOccupied(false);
                setUnitsList((prev) => (prev || []).map((u) => ({ ...u, status: "vacant" })));
              }}
              className={`p-4 rounded-xl border-2 font-bold text-xs text-left transition-all cursor-pointer ${
                occupied === false
                  ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent shadow-xs"
                  : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
              }`}
            >
              <div>⚡ All Units Vacant & Available</div>
              <div className="text-[11px] font-normal opacity-80 mt-1">List all {safeUnits.length} units on public tenant search</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOccupied(true);
              }}
              className={`p-4 rounded-xl border-2 font-bold text-xs text-left transition-all cursor-pointer ${
                occupied === true
                  ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent shadow-xs"
                  : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
              }`}
            >
              <div>👥 Unit-by-Unit Occupancy</div>
              <div className="text-[11px] font-normal opacity-80 mt-1">Configure occupied vs vacant per unit</div>
            </button>
          </div>

          {occupied === true && (
            <div className="space-y-3 mt-3">
              <div className="border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12221C] overflow-hidden">
                <div className="p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Portfolio Units Occupancy Status
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {safeUnits.map((unit, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{unit.unit_name}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">({unit.bedrooms || 1} Bed • {unit.bathrooms || 1} Bath)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUnitsList((prev) => (prev || []).map((u, i) => (i === idx ? { ...u, status: "vacant" } : u)));
                          }}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                            unit.status !== "occupied"
                              ? "bg-emerald-600 text-white border-transparent"
                              : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/15"
                          }`}
                        >
                          Vacant
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUnitsList((prev) => (prev || []).map((u, i) => (i === idx ? { ...u, status: "occupied" } : u)));
                          }}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                            unit.status === "occupied"
                              ? "bg-amber-700 text-white border-transparent"
                              : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/15"
                          }`}
                        >
                          Occupied
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TENANT ONBOARDING INVITATION DETAILS */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-[#E5C583] uppercase tracking-wider mb-1">
                  Tenant Onboarding Invitation Details
                </div>
                <div>
                  <Input id="tNameBulk" label="Tenant Name *" value={safeTenantName} onChange={(e) => setTenantName(e.target.value)} maxLength={500} required />
                  <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">{safeTenantName.length}/500</div>
                </div>
                <div>
                  <Input id="tContactBulk" label="Tenant Email/Phone *" value={safeTenantContact} onChange={(e) => setTenantContact(e.target.value)} maxLength={500} required />
                  <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">{safeTenantContact.length}/500</div>
                </div>
                <Input id="lStartBulk" label="Lease Start Date *" type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12221C] mt-3">
            <Input id="availBulk" label="Available From *" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} required />
          </div>
        </div>
      ) : (
        <>
          <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">Occupancy Status *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOccupied(false)}
              className={`p-4 rounded-xl border-2 font-bold text-xs text-left transition-all cursor-pointer ${
                occupied === false
                  ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent"
                  : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
              }`}
            >
              Vacant (Public Listing)
            </button>
            <button
              type="button"
              onClick={() => setOccupied(true)}
              className={`p-4 rounded-xl border-2 font-bold text-xs text-left transition-all cursor-pointer ${
                occupied === true
                  ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent"
                  : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
              }`}
            >
              Occupied (Invite Current Tenant)
            </button>
          </div>

          {occupied === true && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
              <div>
                <Input id="tName" label="Tenant Name *" value={safeTenantName} onChange={(e) => setTenantName(e.target.value)} maxLength={500} required />
                <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">{safeTenantName.length}/500</div>
              </div>
              <div>
                <Input id="tContact" label="Tenant Email/Phone *" value={safeTenantContact} onChange={(e) => setTenantContact(e.target.value)} maxLength={500} required />
                <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">{safeTenantContact.length}/500</div>
              </div>
              <Input id="lStart" label="Lease Start Date *" type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} required />
            </div>
          )}

          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <Input id="avail" label="Available From *" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} required />
          </div>
        </>
      )}

      <div className="space-y-2 mt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={!isFormFullyValid}
          className={`w-full py-3 text-xs font-bold transition-all ${
            !isFormFullyValid
              ? "opacity-50 cursor-not-allowed bg-slate-400 dark:bg-slate-700"
              : "cursor-pointer"
          }`}
        >
          {!isFormFullyValid
            ? "🔒 Complete All Required Fields to Submit"
            : isEditing
            ? "Save Property Changes"
            : "Complete Property Submission"}
        </Button>
        {!isFormFullyValid && (
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 text-center">
            Submission is locked until Step 1, Step 2, Step 4 (Legal Proof & Photos), and Step 5 (Occupancy) are completed.
          </p>
        )}
      </div>
    </div>
  );
}
