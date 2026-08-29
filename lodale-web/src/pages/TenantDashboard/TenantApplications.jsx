import { useState, useEffect } from "react";
import { Search as SearchIcon, FileText, Clock, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { applicationService } from "../../services/applicationService";
import { chatService } from "../../services/chatService";
import { propertyService } from "../../services/propertyService";
import { triggerToast } from "../../context/ToastContext";
import "./TenantSearch.css"; // Reuse some styles

export default function TenantApplications({ setActiveTab }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const apps = await applicationService.getMyApplications();
      setApplications(apps);
    } catch (e) {
      console.error("Failed to load applications:", e);
      setError("Could not load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApps = applications.filter(app => 
    app.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Document Upload Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAppForUpload, setSelectedAppForUpload] = useState(null);
  const [documentType, setDocumentType] = useState("Proof of Employment");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("File size exceeds 5MB limit.", "error");
        return;
      }
      setUploadFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadFile(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!uploadFile || !selectedAppForUpload) {
      triggerToast("Please select a valid document file.", "error");
      return;
    }
    setUploading(true);
    try {
      let landlordId = selectedAppForUpload.landlordId || selectedAppForUpload.landlord_id || selectedAppForUpload.landlord?.id;

      // Fallback: If landlordId wasn't returned in application payload, fetch property details directly
      if (!landlordId && selectedAppForUpload.propertyId) {
        try {
          const propRes = await propertyService.getPropertyById(selectedAppForUpload.propertyId);
          landlordId = propRes?.landlord_id || propRes?.landlordId;
        } catch (err) {
          console.error("Error fetching landlord id:", err);
        }
      }

      if (!landlordId) {
        triggerToast("Could not resolve landlord contact for this application.", "error");
        setUploading(false);
        return;
      }

      const messageText = `[DOCUMENT UPLOADED]\nDocument Type: ${documentType}\nFile Name: ${uploadFileName}\nData: ${uploadFile}`;
      await chatService.sendMessage(landlordId, messageText);
      
      triggerToast(`"${uploadFileName}" sent to landlord successfully!`, "success", "Document Uploaded");
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadFileName("");
      
      // Navigate to chat tab (tab index 2)
      if (setActiveTab) {
        sessionStorage.setItem("activeChatPartnerId", landlordId);
        setActiveTab(2);
      }
    } catch (err) {
      console.error("Upload document error:", err);
      triggerToast(err?.response?.data?.message || "Failed to send document to landlord.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="tenant-search-layout" style={{ height: "100%", overflowY: "auto", paddingBottom: "100px" }}>
      <div className="search-header-sticky">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-white">My Applications</h1>
            <p className="text-sm text-ink-500 dark:text-cream-100/70 mt-1">Track and manage your property rental applications.</p>
          </div>
        </div>

        <div className="search-controls-wrapper">
          <div className="search-input-group tour-search-bar" style={{ flex: 1, maxWidth: "400px" }}>
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by property or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="recommendations-container text-left" style={{ marginTop: "24px" }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-500 dark:text-cream-100/60">
            <Loader2 className="h-7 w-7 animate-spin text-moss-600 dark:text-[#E5C583]" />
            <span className="text-[13px] font-medium">Loading your applications...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20">
            <p className="text-[13px] text-rose-700 dark:text-rose-400 font-medium">{error}</p>
            <button onClick={loadApplications} className="mt-3 text-[12.5px] text-moss-700 dark:text-[#E5C583] underline font-semibold">
              Retry
            </button>
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map(app => (
              <div key={app.id} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12221C] shadow-sm flex flex-col hover:border-moss-300 dark:hover:border-moss-700 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-[15px] text-ink-900 dark:text-white line-clamp-2 cursor-pointer" onClick={() => navigate(`/listings/${app.propertyId}`)}>
                      {app.propertyTitle || `Property #${app.propertyId}`}
                    </h3>
                    <p className="text-[12px] text-ink-500 dark:text-cream-100/60 mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Applied: {app.date}
                    </p>
                    {app.landlordFirstName && (
                      <p className="text-[11px] font-semibold text-moss-700 dark:text-[#E5C583] mt-0.5">
                        Landlord: {app.landlordFirstName} {app.landlordLastName || ''}
                      </p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap ${
                    app.status === 'Approved' || app.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    app.status === 'Rejected' || app.status === 'declined' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {app.status || 'Pending'}
                  </span>
                </div>

                {/* Latest Landlord Request / Message */}
                {app.lastMessage && (
                  <div className="my-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-bold flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      💬 Latest Landlord Message / Request
                    </span>
                    <p className="italic line-clamp-2">{app.lastMessage}</p>
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedAppForUpload(app);
                      setShowUploadModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs rounded-lg transition-colors border border-amber-200 dark:border-amber-900/40 flex items-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" /> Upload Doc
                  </button>

                  <button
                    onClick={() => {
                      if (app.landlordId) {
                        sessionStorage.setItem("activeChatPartnerId", app.landlordId);
                      }
                      if (setActiveTab) setActiveTab(2); // Fix: Chat is tab index 2!
                    }}
                    className="px-3 py-1.5 bg-moss-600 hover:bg-moss-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Chat Landlord
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#12221C]/50 my-2">
            <div className="mb-3 flex justify-center"><FileText className="h-8 w-8 text-moss-600/50 dark:text-[#E5C583]/50" /></div>
            <h4 className="font-bold text-[15px] text-ink-900 dark:text-white mb-1">
              {searchQuery ? "No matching applications found." : "No applications yet"}
            </h4>
            <p className="text-[13px] text-[#6C6E73] dark:text-[#A3BCA7] max-w-sm mx-auto mb-5 leading-relaxed">
              {searchQuery ? "Try adjusting your search terms." : "When you apply for properties, they will appear here so you can track their status."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setActiveTab(1)}
                className="bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] text-[12.5px] font-bold px-5 py-2.5 rounded-xl"
              >
                Browse Properties
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Upload Requested Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-moss-600" /> Upload Requested Document
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg">×</button>
            </div>

            <p className="text-xs text-ink-600 dark:text-cream-100/70">
              Upload a document for <strong>{selectedAppForUpload?.propertyTitle}</strong>. The landlord will receive it immediately in your chat thread.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-cream-50 dark:bg-[#12221C] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600"
                >
                  <option value="Proof of Employment / Payslip">Proof of Employment / Payslip</option>
                  <option value="Government ID / NIN Verification">Government ID / NIN Verification</option>
                  <option value="Bank Statement">Bank Statement (6 Months)</option>
                  <option value="Guarantor Proof">Guarantor Document / Letter</option>
                  <option value="Other Document">Other Requested Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Select File (PDF or Image, max 5MB)</label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full text-xs text-ink-600 dark:text-cream-100/70 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-moss-100 file:text-moss-800 dark:file:bg-moss-900/50 dark:file:text-moss-300 hover:file:bg-moss-200"
                />
              </div>

              {uploadFileName && (
                <div className="p-3 bg-moss-50 dark:bg-moss-900/20 border border-moss-200 dark:border-moss-800/40 rounded-xl text-xs text-moss-900 dark:text-moss-300 font-medium truncate">
                  Attached: <strong>{uploadFileName}</strong>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2 text-xs font-bold bg-moss-600 hover:bg-moss-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Upload & Send to Landlord"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
