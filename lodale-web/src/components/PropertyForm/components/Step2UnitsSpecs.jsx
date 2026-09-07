import { Building2, Info } from "lucide-react";
import Input from "../../Input";
import DropdownWithOther from "../../DropdownWithOther";

export default function Step2UnitsSpecs({
  propertyType,
  houseSubtype,
  isMultiUnit,
  setIsMultiUnit,
  blocksList,
  newBlockName,
  setNewBlockName,
  handleAddBlock,
  handleRemoveBlock,
  unitsList,
  unitAddTab,
  setUnitAddTab,
  manualUnitName,
  setManualUnitName,
  manualBeds,
  setManualBeds,
  manualBaths,
  setManualBaths,
  manualRent,
  setManualRent,
  manualRentPeriod,
  setManualRentPeriod,
  manualHostelPricingType,
  setManualHostelPricingType,
  handleAddSingleUnit,
  bulkPrefix,
  setBulkPrefix,
  bulkStartNum,
  setBulkStartNum,
  bulkCount,
  setBulkCount,
  bulkBeds,
  setBulkBeds,
  bulkBaths,
  setBulkBaths,
  bulkRent,
  setBulkRent,
  bulkRentPeriod,
  setBulkRentPeriod,
  bulkHostelPricingType,
  setBulkHostelPricingType,
  handleGenerateBulkUnits,
  csvFileInputRef,
  handleCsvFileUpload,
  handleDeleteAllUnits,
  editingUnitIndex,
  editingUnitForm,
  setEditingUnitForm,
  handleSaveEditUnit,
  handleCancelEditUnit,
  handleStartEditUnit,
  handleEditingUnitImageUpload,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  rent,
  setRent,
  rentCycle,
  setRentCycle,
  singleHostelPricingType,
  setSingleHostelPricingType,
  setUnitsList
}) {
  const getUnitNamePlaceholder = () => {
    if (propertyType === "single_house") {
      return houseSubtype === "duplex" ? "e.g. House A1 or Main Duplex" : "e.g. House A1";
    }
    if (propertyType === "apartment_building" || propertyType === "estate") {
      return "e.g. Flat 101";
    }
    if (propertyType === "hostel") {
      return "e.g. Room 12";
    }
    if (propertyType === "commercial_building") {
      return "e.g. Shop 4 or Suite 201";
    }
    if (propertyType === "boys_quarters") {
      return "e.g. BQ Unit 1";
    }
    return "e.g. Flat 101";
  };

  const handleRemoveUnit = (index) => {
    setUnitsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5">
        {propertyType === "single_house" && houseSubtype === "duplex" && (
          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" />
              <span>How is this Duplex managed? *</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={() => setIsMultiUnit(false)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-3 outline-none ${!isMultiUnit
                  ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent font-bold"
                  : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10"
                  }`}
              >
                <div className="font-bold text-sm">1</div>
                <div>
                  <div className="font-bold text-xs">Single Family Duplex</div>
                  <div className="text-[11px] opacity-80">Entire duplex rented to 1 tenant</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsMultiUnit(true)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-3 outline-none ${isMultiUnit
                  ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent font-bold"
                  : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10"
                  }`}
              >
                <div className="font-bold text-sm">2+</div>
                <div>
                  <div className="font-bold text-xs">Divided Duplex Flats</div>
                  <div className="text-[11px] opacity-80">Split into 2 or more units</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {isMultiUnit ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10">
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Building Blocks / Floors (Optional)
              </label>
              <div className="flex gap-2 items-start mb-3">
                <div className="flex-1">
                  <DropdownWithOther
                    value={newBlockName}
                    onChange={(val) => setNewBlockName(val)}
                    options={[
                      "Block A", "Block B", "Block C", "Block D",
                      "Floor 1", "Floor 2", "Floor 3", "Ground Floor"
                    ]}
                    placeholder="Select or type block name..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="px-4 py-2.5 h-[42px] text-xs font-bold rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer border-none outline-none shrink-0"
                >
                  + Add Block
                </button>
              </div>

              {blocksList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {blocksList.map((block, bIdx) => (
                    <span
                      key={bIdx}
                      className="px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-[#E5C583] border border-slate-200 dark:border-white/15 rounded-lg text-xs font-semibold flex items-center gap-2"
                    >
                      {block.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(block.name)}
                        className="text-rose-600 dark:text-rose-400 font-bold ml-1 cursor-pointer border-none bg-transparent"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Add Units to Portfolio ({unitsList.length} added)
                </span>
                <div className="flex gap-1 bg-slate-100 dark:bg-white/10 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUnitAddTab("manual")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${unitAddTab === "manual" ? "bg-white dark:bg-[#16241F] text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                      }`}
                  >
                    Single Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitAddTab("generator")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${unitAddTab === "generator" ? "bg-white dark:bg-[#16241F] text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                      }`}
                  >
                    Bulk Generator
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitAddTab("csv")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${unitAddTab === "csv" ? "bg-white dark:bg-[#16241F] text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                      }`}
                  >
                    CSV Upload
                  </button>
                </div>
              </div>

              {unitAddTab === "manual" && (
                <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10 mb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Unit Name / Number *
                      </label>
                      <input
                        type="text"
                        value={manualUnitName}
                        onChange={(e) => setManualUnitName(e.target.value)}
                        maxLength={500}
                        placeholder={getUnitNamePlaceholder()}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bedrooms</label>
                      <select
                        value={manualBeds}
                        onChange={(e) => setManualBeds(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                      >
                        <option value="1">1 Bed</option>
                        <option value="2">2 Beds</option>
                        <option value="3">3 Beds</option>
                        <option value="4">4 Beds</option>
                        <option value="5">5 Beds</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bathrooms</label>
                      <select
                        value={manualBaths}
                        onChange={(e) => setManualBaths(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                      >
                        <option value="1">1 Bath</option>
                        <option value="2">2 Baths</option>
                        <option value="3">3 Baths</option>
                        <option value="4">4 Baths</option>
                      </select>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 ${propertyType === "hostel" ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Rent Amount (₦)
                      </label>
                      <input
                        type="number"
                        value={manualRent}
                        onChange={(e) => setManualRent(e.target.value)}
                        placeholder="e.g. 2500000"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Rent Duration / Cycle *
                      </label>
                      <select
                        value={manualRentPeriod}
                        onChange={(e) => setManualRentPeriod(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                      >
                        <option value="annually">1 Year / Annually (per yr)</option>
                        <option value="session">1 Academic Session (8-9 mos)</option>
                        <option value="semester">1 Semester (4-5 mos)</option>
                        <option value="3_months">3 Months / Quarterly</option>
                        <option value="monthly">Monthly (per mo)</option>
                        <option value="summer">Summer Break (1-2 mos)</option>
                      </select>
                    </div>
                    {propertyType === "hostel" && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Pricing Basis *
                        </label>
                        <select
                          value={manualHostelPricingType}
                          onChange={(e) => setManualHostelPricingType(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                        >
                          <option value="per_bedspace">🛏️ Per Bedspace (Student)</option>
                          <option value="per_room">🚪 Per Room (Private Room)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleAddSingleUnit}
                      className="w-full py-2 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none"
                    >
                      + Add Unit to Portfolio
                    </button>
                  </div>
                </div>
              )}

              {unitAddTab === "generator" && (
                <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10 mb-4 space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
                    <Info className="h-4 w-4 shrink-0 text-emerald-700 dark:text-[#E5C583] mt-0.5" />
                    <div>
                      <span className="font-bold">Fast Portfolio Generator: </span>
                      Enter prefix, start number, and count below to instantly generate your unit inventory. Building shared amenities & rules will be set in <span className="font-bold text-[#2C4633] dark:text-[#E5C583]">Step 3</span>, and flat interior photos will be uploaded in <span className="font-bold text-[#2C4633] dark:text-[#E5C583]">Step 4</span>.
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <DropdownWithOther
                      label="Prefix"
                      value={bulkPrefix}
                      onChange={(val) => setBulkPrefix(val)}
                      options={["Flat ", "House ", "Room ", "Shop ", "Unit "]}
                    />
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Start #</label>
                      <input
                        type="number"
                        value={bulkStartNum}
                        onChange={(e) => setBulkStartNum(e.target.value)}
                        placeholder="101"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Count</label>
                      <input
                        type="number"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(e.target.value)}
                        placeholder="6"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 ${propertyType === "hostel" ? "sm:grid-cols-5" : "sm:grid-cols-4"} gap-2`}>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bedrooms</label>
                      <select
                        value={bulkBeds}
                        onChange={(e) => setBulkBeds(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                      >
                        <option value="1">1 Bed</option>
                        <option value="2">2 Beds</option>
                        <option value="3">3 Beds</option>
                        <option value="4">4 Beds</option>
                        <option value="5">5 Beds</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bathrooms</label>
                      <select
                        value={bulkBaths}
                        onChange={(e) => setBulkBaths(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                      >
                        <option value="1">1 Bath</option>
                        <option value="2">2 Baths</option>
                        <option value="3">3 Baths</option>
                        <option value="4">4 Baths</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">General Rent (₦)</label>
                      <input
                        type="number"
                        value={bulkRent}
                        onChange={(e) => setBulkRent(e.target.value)}
                        placeholder="e.g. 2500000"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Rent Period *</label>
                      <select
                        value={bulkRentPeriod}
                        onChange={(e) => setBulkRentPeriod(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                      >
                        <option value="annually">1 Year / Annually</option>
                        <option value="session">1 Academic Session</option>
                        <option value="semester">1 Semester</option>
                        <option value="3_months">3 Months / Quarterly</option>
                        <option value="monthly">Monthly</option>
                        <option value="summer">Summer Break</option>
                      </select>
                    </div>
                    {propertyType === "hostel" && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pricing Basis *</label>
                        <select
                          value={bulkHostelPricingType}
                          onChange={(e) => setBulkHostelPricingType(e.target.value)}
                          className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none font-medium"
                        >
                          <option value="per_bedspace">🛏️ Per Bedspace</option>
                          <option value="per_room">🚪 Per Room</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateBulkUnits}
                    className="w-full py-2.5 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none mt-2"
                  >
                    ⚡ Generate Units Batch
                  </button>
                </div>
              )}

              {unitAddTab === "csv" && (
                <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10 mb-4 text-center">
                  <input ref={csvFileInputRef} type="file" accept=".csv" onChange={handleCsvFileUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => csvFileInputRef.current?.click()}
                    className="py-2 px-4 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none"
                  >
                    Upload CSV Spreadsheet
                  </button>
                </div>
              )}

              {unitsList.length > 0 && (
                <div className="border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12221C] overflow-hidden">
                  <div className="p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-800 dark:text-slate-200">
                      Portfolio Units ({unitsList.length}) – Click "Edit" on any unit to customize rent, amenities, or rules
                    </span>
                    <button
                      type="button"
                      onClick={handleDeleteAllUnits}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
                          <th className="p-2.5">Unit Name</th>
                          <th className="p-2.5">Beds / Baths</th>
                          <th className="p-2.5">Rent Amount & Period</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {unitsList.map((u, i) => {
                          const isEditingRow = editingUnitIndex === i;

                          if (isEditingRow) {
                            return (
                              <tr key={i} className="bg-amber-50/70 dark:bg-amber-950/30">
                                <td colSpan={4} className="p-3 space-y-3">
                                  <div className="flex items-center justify-between border-b border-amber-200 dark:border-white/10 pb-2">
                                    <span className="font-bold text-xs text-amber-900 dark:text-[#E5C583]">
                                      Editing Unit Details ({u.unit_name})
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditUnit(i)}
                                        className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700"
                                      >
                                        Save Unit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEditUnit}
                                        className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-300 dark:bg-white/20 text-slate-800 dark:text-white border-none cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Name</label>
                                      <input
                                        type="text"
                                        value={editingUnitForm.unit_name}
                                        onChange={(e) => setEditingUnitForm(prev => ({ ...prev, unit_name: e.target.value }))}
                                        className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Beds & Baths</label>
                                      <div className="flex gap-1">
                                        <select
                                          value={editingUnitForm.bedrooms}
                                          onChange={(e) => setEditingUnitForm(prev => ({ ...prev, bedrooms: e.target.value }))}
                                          className="w-1/2 px-1 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white font-medium"
                                        >
                                          <option value="1">1 Bed</option>
                                          <option value="2">2 Beds</option>
                                          <option value="3">3 Beds</option>
                                          <option value="4">4 Beds</option>
                                          <option value="5">5 Beds</option>
                                        </select>
                                        <select
                                          value={editingUnitForm.bathrooms}
                                          onChange={(e) => setEditingUnitForm(prev => ({ ...prev, bathrooms: e.target.value }))}
                                          className="w-1/2 px-1 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white font-medium"
                                        >
                                          <option value="1">1 Bath</option>
                                          <option value="2">2 Baths</option>
                                          <option value="3">3 Baths</option>
                                          <option value="4">4 Baths</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Rent Amount & Period</label>
                                      <div className="flex gap-1">
                                        <input
                                          type="number"
                                          value={editingUnitForm.rent_amount}
                                          onChange={(e) => setEditingUnitForm(prev => ({ ...prev, rent_amount: e.target.value }))}
                                          className="w-2/3 px-2 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white"
                                        />
                                        <select
                                          value={editingUnitForm.rent_period}
                                          onChange={(e) => setEditingUnitForm(prev => ({ ...prev, rent_period: e.target.value }))}
                                          className="w-1/3 px-1 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white font-medium"
                                        >
                                          <option value="annually">/yr</option>
                                          <option value="session">/session</option>
                                          <option value="semester">/semester</option>
                                          <option value="3_months">/3 mos</option>
                                          <option value="monthly">/mo</option>
                                          <option value="summer">/summer</option>
                                        </select>
                                      </div>
                                    </div>
                                    {propertyType === "hostel" && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pricing Basis</label>
                                        <select
                                          value={editingUnitForm.pricing_type || "per_bedspace"}
                                          onChange={(e) => setEditingUnitForm(prev => ({ ...prev, pricing_type: e.target.value }))}
                                          className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white font-medium"
                                        >
                                          <option value="per_bedspace">🛏️ Bedspace</option>
                                          <option value="per_room">🚪 Room</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Overview (Optional)</label>
                                      <input
                                        type="text"
                                        value={editingUnitForm.description}
                                        onChange={(e) => setEditingUnitForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="e.g. Top floor corner flat"
                                        className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Amenities (Optional)</label>
                                      <input
                                        type="text"
                                        value={editingUnitForm.amenities}
                                        onChange={(e) => setEditingUnitForm(prev => ({ ...prev, amenities: e.target.value }))}
                                        placeholder="e.g. Prepaid Meter, Water Heater"
                                        className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Guidelines / Rules (Optional)</label>
                                      <input
                                        type="text"
                                        value={editingUnitForm.rules}
                                        onChange={(e) => setEditingUnitForm(prev => ({ ...prev, rules: e.target.value }))}
                                        placeholder="e.g. No Pets, Quiet Hours"
                                        className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-amber-200 dark:border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="block text-[10px] font-bold text-amber-900 dark:text-[#E5C583]">
                                        Unit Interior Photos ({u.unit_name})
                                      </label>
                                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                        {editingUnitForm.images?.length || 0} photo(s) attached
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-200 dark:bg-white/20 text-amber-950 dark:text-white cursor-pointer hover:opacity-90">
                                        📷 Upload Photos
                                        <input type="file" accept="image/*" multiple onChange={handleEditingUnitImageUpload} className="hidden" />
                                      </label>
                                    </div>
                                    {editingUnitForm.images && editingUnitForm.images.length > 0 && (
                                      <div className="flex flex-wrap gap-2 pt-1">
                                        {editingUnitForm.images.map((img, imgIdx) => (
                                          <div key={imgIdx} className="relative w-12 h-12 rounded-md overflow-hidden border border-amber-300 dark:border-white/20">
                                            <img src={typeof img === "object" ? img.url : img} alt="" className="w-full h-full object-cover" />
                                            <button
                                              type="button"
                                              onClick={() => setEditingUnitForm(prev => ({
                                                ...prev,
                                                images: prev.images.filter((_, idx) => idx !== imgIdx)
                                              }))}
                                              className="absolute top-0 right-0 bg-rose-600 text-white w-4 h-4 rounded-bl flex items-center justify-center text-[10px] font-bold"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          const getRentPeriodFormatted = (period, pricing) => {
                            const p = String(period || "").toLowerCase();
                            let s = "/yr";
                            if (p === "monthly" || (p.includes("month") && p !== "3_months")) s = "/mo";
                            else if (p === "semester") s = "/semester";
                            else if (p === "session") s = "/session";
                            else if (p === "3_months" || p.includes("quarter")) s = "/3 mos";
                            else if (p === "summer") s = "/summer break";

                            if (pricing === "per_bedspace") s += " • per bedspace";
                            else if (pricing === "per_room") s += " • per room";
                            return s;
                          };
                          const periodSuffix = getRentPeriodFormatted(u.rent_period, u.pricing_type || u.hostel_pricing_type);
                          const uPhotos = u.images || u.photos || [];
                          const hasUnitSpecs = u.description || u.amenities || u.rules || uPhotos.length > 0;

                          return (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="font-bold text-slate-900 dark:text-white">{u.unit_name}</div>
                                  {uPhotos.length > 0 ? (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800/40">
                                      📷 {uPhotos.length} photo{uPhotos.length > 1 ? "s" : ""}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                                      (No photos)
                                    </span>
                                  )}
                                </div>
                                {uPhotos.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {uPhotos.slice(0, 3).map((img, imgIdx) => (
                                      <img
                                        key={imgIdx}
                                        src={typeof img === "object" ? img.url : img}
                                        alt=""
                                        className="w-6 h-6 rounded object-cover border border-slate-200 dark:border-white/10"
                                      />
                                    ))}
                                    {uPhotos.length > 3 && (
                                      <span className="text-[9px] text-slate-500 self-center font-bold">+{uPhotos.length - 3}</span>
                                    )}
                                  </div>
                                )}
                                {u.description && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-0.5">
                                    {u.description}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300 font-medium">
                                {u.bedrooms || 1} Bed • {u.bathrooms || 1} Bath
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                  ₦{Number(u.rent_amount || 0).toLocaleString()}{periodSuffix}
                                </div>
                                {hasUnitSpecs && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {u.amenities && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800/40">
                                        ✨ {typeof u.amenities === "string" ? u.amenities : u.amenities.join(", ")}
                                      </span>
                                    )}
                                    {u.rules && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-[#E5C583] rounded border border-amber-200 dark:border-amber-800/40">
                                        📋 {typeof u.rules === "string" ? u.rules : u.rules.join(", ")}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditUnit(i)}
                                  className="text-amber-600 dark:text-[#E5C583] font-bold hover:underline border-none bg-transparent cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUnit(i)}
                                  className="text-rose-600 font-bold hover:underline border-none bg-transparent cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DropdownWithOther
                label="Bedrooms *"
                value={bedrooms}
                onChange={(val) => setBedrooms(val)}
                options={["1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms", "5 Bedrooms"]}
              />
              <DropdownWithOther
                label="Bathrooms *"
                value={bathrooms}
                onChange={(val) => setBathrooms(val)}
                options={["1 Bathroom", "2 Bathrooms", "3 Bathrooms", "4 Bathrooms"]}
              />
            </div>
            <div className={`grid grid-cols-1 ${propertyType === "hostel" ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Asking Rent (₦) *</label>
                <Input
                  id="rent"
                  type="number"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  placeholder="e.g. 2,500,000"
                  maxLength={500}
                  light={false}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Rent Duration / Cycle *</label>
                <select
                  value={rentCycle}
                  onChange={(e) => setRentCycle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none font-medium"
                >
                  <option value="annual">1 Year / Annually (per year)</option>
                  <option value="session">1 Academic Session (8-9 months)</option>
                  <option value="semester">1 Semester (4-5 months)</option>
                  <option value="3_months">3 Months / Quarterly</option>
                  <option value="monthly">Monthly (per month)</option>
                  <option value="summer">Summer Break (1-2 months)</option>
                </select>
              </div>
              {propertyType === "hostel" && (
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Pricing Basis *</label>
                  <select
                    value={singleHostelPricingType}
                    onChange={(e) => setSingleHostelPricingType(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none font-medium"
                  >
                    <option value="per_bedspace">🛏️ Per Bedspace (Student)</option>
                    <option value="per_room">🚪 Per Room (Private Room)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
