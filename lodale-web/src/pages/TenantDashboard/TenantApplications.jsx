import { useState, useEffect } from "react";
import { Search as SearchIcon, FileText, Clock, ChevronRight, Loader2 } from "lucide-react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { applicationService } from "../../services/applicationService";
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
              <div key={app.id} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12221C] shadow-sm flex flex-col hover:border-moss-300 dark:hover:border-moss-700 transition-colors cursor-pointer" onClick={() => navigate(`/listings/${app.propertyId}`)}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-[15px] text-ink-900 dark:text-white line-clamp-2">{app.propertyTitle || `Property #${app.propertyId}`}</h3>
                    <p className="text-[12px] text-ink-500 dark:text-cream-100/60 mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Applied: {app.date}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap ${
                    app.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    app.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {app.status || 'Pending'}
                  </span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
                  <span className="text-[12.5px] text-moss-700 dark:text-[#E5C583] font-semibold flex items-center gap-1">
                    View Property
                    <ChevronRight className="h-4 w-4" />
                  </span>
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
    </div>
  );
}
