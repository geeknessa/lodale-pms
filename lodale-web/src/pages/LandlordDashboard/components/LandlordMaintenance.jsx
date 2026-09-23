import React, { useState, useEffect } from "react";
import { Wrench, CheckCircle2, Clock, AlertTriangle, MessageSquare, Search, Filter, Loader2, Plus, User, Building2 } from "lucide-react";
import { maintenanceService } from "../../../services/maintenanceService";
import { triggerToast } from "../../../context/ToastContext";
import RequestInfo from "./RequestInfo";

export default function LandlordMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      let list = [];
      if (typeof maintenanceService.getMyRequests === "function") {
        list = await maintenanceService.getMyRequests();
      }
      if (!Array.isArray(list) || list.length === 0) {
        try {
          const cached = localStorage.getItem("landlordMaintenanceRequests");
          if (cached) list = JSON.parse(cached);
        } catch (e) {}
      }

      const formatted = (Array.isArray(list) ? list : []).map((r) => ({
        id: r.id,
        title: r.title || r.type || "Maintenance Request",
        type: r.type || r.title || "Repair",
        details: r.description && r.description !== "No description provided." ? r.description : (r.details || r.title || "No details provided"),
        status: r.status ? (r.status.toLowerCase() === "open" || r.status.toLowerCase() === "pending" ? "Pending" : r.status.toLowerCase() === "in_progress" || r.status.toLowerCase() === "in progress" || r.status.toLowerCase() === "acknowledged" ? "In Progress" : "Resolved") : "Pending",
        priority: r.priority || "Normal",
        date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : (r.date || "Recently"),
        tenantName: r.tenant_name || r.tenantName || "Tenant",
        propertyTitle: r.property_title || r.propertyTitle || r.property_name || r.propertyName || "Leased Property"
      }));

      setRequests(formatted);
    } catch (e) {
      console.warn("Failed to load maintenance requests:", e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const dbStatus = newStatus.toLowerCase().replace(" ", "_");
      if (typeof maintenanceService.updateRequestStatus === "function") {
        await maintenanceService.updateRequestStatus(id, { status: dbStatus });
      }
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      triggerToast(`Request status updated to "${newStatus}"`, "success");
    } catch (e) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      triggerToast(`Request status set to "${newStatus}"`, "info");
    }
  };

  const filtered = requests.filter(r => {
    const titleMatch = (r.title || r.details || r.type || "").toLowerCase().includes(searchQuery.toLowerCase());
    const tenantMatch = (r.tenantName || r.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = filterStatus === "all" || (r.status || "").toLowerCase() === filterStatus.toLowerCase();
    return (titleMatch || tenantMatch) && statusMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl border border-ink-100 dark:border-white/10 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-cream-100 flex items-center gap-3">
            <Wrench className="h-6 w-6 text-moss-700 dark:text-[#E5C583]" />
            Tenant Maintenance & Repairs
          </h2>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-cream-100/70 mt-1">
            Track and resolve repair requests submitted by your tenants.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 dark:text-cream-100/40" />
          <input
            type="text"
            placeholder="Search by tenant or repair issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1E1E1E] border border-ink-200 dark:border-white/10 rounded-2xl text-xs text-ink-900 dark:text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-moss-600/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "pending", "in progress", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === status
                  ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-ink-950 shadow-sm"
                  : "bg-white dark:bg-[#1E1E1E] text-ink-600 dark:text-cream-100/70 hover:bg-ink-100 dark:hover:bg-white/5 border border-ink-100 dark:border-white/10"
              }`}
            >
              {status === "all" ? "All Requests" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-16 text-center text-ink-400 space-y-2 bg-white dark:bg-[#1E1E1E] rounded-3xl border border-ink-100 dark:border-white/10">
          <Loader2 className="h-7 w-7 mx-auto animate-spin text-moss-700 dark:text-[#E5C583]" />
          <p className="text-xs font-bold">Loading maintenance requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1E1E1E] rounded-3xl border border-dashed border-ink-200 dark:border-white/10 space-y-3">
          <Wrench className="h-10 w-10 mx-auto text-ink-300 dark:text-cream-100/30" />
          <h3 className="text-base font-bold text-ink-900 dark:text-cream-100">No maintenance requests found</h3>
          <p className="text-xs text-ink-500 dark:text-cream-100/70 max-w-md mx-auto">
            {filterStatus === "all"
              ? "When active tenants submit repair or maintenance requests, they will show up here for you to resolve."
              : `There are currently no repair requests marked as "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((req) => {
            const st = (req.status || "pending").toLowerCase();

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl border border-ink-100 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4 hover:border-moss-600/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full ${
                      st === "resolved"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : st === "in progress"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {req.status || "Pending"}
                    </span>
                    <span className="text-[11px] text-ink-400 dark:text-cream-100/50">
                      {req.date || "Recently"}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-ink-900 dark:text-cream-100">
                    {req.type || req.title || "Maintenance Request"}
                  </h4>

                  <p className="text-xs text-ink-600 dark:text-cream-100/80 line-clamp-2">
                    {req.details || req.description || "No additional details provided."}
                  </p>

                  <div className="pt-2 text-xs text-ink-500 dark:text-cream-100/60 flex items-center justify-between border-t border-ink-100 dark:border-white/10">
                    <span className="font-bold text-ink-800 dark:text-cream-100 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" />
                      {req.tenantName || req.name || "Tenant"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" />
                      {req.propertyTitle || req.leaseStatus || "Unit Property"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {st !== "resolved" && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, "Resolved")}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      Mark Resolved ✓
                    </button>
                  )}
                  {st === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, "In Progress")}
                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      In Progress
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="py-2 px-3 bg-ink-100 dark:bg-white/10 hover:bg-ink-200 dark:hover:bg-white/20 text-ink-800 dark:text-cream-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Modal */}
      {selectedRequest && (
        <RequestInfo
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={(newSt) => {
            handleUpdateStatus(selectedRequest.id, newSt);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}
