import { Camera, Info, Trash2 } from "lucide-react";
import DropdownWithOther from "../../DropdownWithOther";

export default function Step4LegalPhotos({
  docType = "",
  setDocType = () => {},
  docName = "",
  docInputRef = null,
  handleDocUpload = () => {},
  wasBulkGenerated = false,
  isMultiUnit = false,
  propertyPhotos = [],
  fileInputRef = null,
  handleFileUpload = () => {},
  coverPhotoIndex = 0,
  setCoverPhotoIndex = () => {},
  handleDeletePhoto = () => {},
  unitsList = [],
  handleDirectUnitImageUpload = () => {},
  handleDeleteUnitImage = () => {}
}) {
  const safePhotos = propertyPhotos || [];
  const safeUnits = unitsList || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">Proof of Ownership Legal Paper *</label>
          <span className="text-[10px] font-bold text-amber-700 dark:text-[#E5C583]">50MB Per File Limit</span>
        </div>
        <DropdownWithOther
          label="Document Type *"
          value={docType}
          onChange={(val) => setDocType(val)}
          options={["Certificate of Occupancy (C of O)", "Deed of Assignment", "Governor's Consent", "Purchase Document"]}
        />
        <input ref={docInputRef} type="file" accept=".pdf,.png,.jpg" onChange={handleDocUpload} className="hidden" />
        <button
          type="button"
          onClick={() => docInputRef?.current?.click()}
          className="mt-3 w-full py-2.5 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs border-none cursor-pointer"
        >
          {docName ? `Attached: ${docName}` : "Upload Legal Proof Document (Max 50MB)"}
        </button>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
        {/* INFORMATIONAL CALLOUT BANNER FOR BULK GENERATED COMPOUND PHOTOS */}
        {wasBulkGenerated && isMultiUnit && (
          <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-emerald-700 dark:text-[#E5C583] mt-0.5" />
            <div>
              <span className="font-bold">Building Exterior & Shared Compound Grounds: </span>
              Since your units were bulk-generated, each flat below has its own individual interior photo gallery card. Upload photos here for the overall building façade, entrance gate, parking area, and shared compound facilities.
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              {wasBulkGenerated && isMultiUnit ? "Building Compound Photos Gallery *" : "Property Photos Gallery *"}
            </label>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {wasBulkGenerated && isMultiUnit ? "Upload building exterior, gatehouse, and compound grounds photos (50MB max per photo)" : "Upload interior and exterior photos (50MB max per photo)"}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">{safePhotos.length}/5 attached</span>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef?.current?.click()}
          className="w-full py-2.5 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs border-none cursor-pointer"
        >
          Upload Photos ({safePhotos.length}/5 attached)
        </button>

        {/* CLEAN TEXT FILE LISTING OF UPLOADED IMAGES */}
        {safePhotos.length > 0 && (
          <div className="space-y-2 pt-2">
            {safePhotos.map((photo, idx) => {
              const fileName = typeof photo === "object" ? photo.name : `Property Photo ${idx + 1}.jpg`;
              const isCover = idx === coverPhotoIndex;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isCover
                      ? "bg-[#2C4633]/10 dark:bg-[#E5C583]/10 border-[#2C4633] dark:border-[#E5C583]"
                      : "bg-white dark:bg-[#16241F] border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <Camera className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583] shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {fileName}
                      </div>
                      {isCover && (
                        <span className="text-[10px] font-bold text-[#2C4633] dark:text-[#E5C583]">
                          ★ Primary Cover Image
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => setCoverPhotoIndex(idx)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer border-none bg-transparent"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePhoto(idx, e)}
                      className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer border-none bg-transparent"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INDIVIDUAL UNIT INTERIOR PHOTOS MANAGER FOR MULTI-UNIT PORTFOLIO */}
      {isMultiUnit && safeUnits.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" /> Individual Unit Interior Photos (Per Flat / Apartment)
              </label>
              <span className="text-[10px] font-semibold text-[#2C4633] dark:text-[#E5C583]">
                {safeUnits.filter(u => (u.images || u.photos || []).length > 0).length}/{safeUnits.length} Units Have Photos
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Each flat in your multi-unit property has unique interior spaces. Upload photos specific to each flat below.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {safeUnits.map((unit, unitIdx) => {
              const uImgs = unit.images || unit.photos || [];
              return (
                <div key={unitIdx} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#16241F] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{unit.unit_name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                        ({unit.bedrooms || 1} Bed, {unit.bathrooms || 1} Bath)
                      </span>
                    </div>
                    <label className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer hover:opacity-90 shrink-0">
                      + Upload Photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleDirectUnitImageUpload(unitIdx, e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uImgs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {uImgs.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative w-12 h-12 rounded-md overflow-hidden border border-slate-200 dark:border-white/10 group">
                          <img src={typeof img === "object" ? img.url : img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleDeleteUnitImage(unitIdx, imgIdx)}
                            className="absolute top-0 right-0 bg-rose-600 text-white w-4 h-4 rounded-bl flex items-center justify-center text-[10px] font-bold opacity-90 hover:opacity-100"
                            title="Remove unit photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 italic py-1">
                      No interior photos added yet for {unit.unit_name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
