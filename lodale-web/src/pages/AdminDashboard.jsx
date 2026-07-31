import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Building2,
  MessageSquareWarning,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Eye,
  ChevronDown,
  Search,
  X,
  Filter,
  UserCheck,
  UserX,
  Ban,
  RefreshCw,
  LogOut,
  Star,
  MapPin,
  Calendar,
  TrendingUp,
  Flag,
  MoreVertical,
  ArrowUpRight,
  Loader2,
  BadgeCheck,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = {
  pendingListings: 14,
  openReviewFlags: 7,
  suspendedUsers: 3,
  pendingVerifications: 22,
  approvalsLast7d: 31,
  removalsLast7d: 4,
  totalUsers: 1284,
  totalProperties: 409,
};

const LISTING_QUEUE = [
  {
    id: "laq-001",
    property: {
      id: "prop-001",
      title: "Skyline Apartments, Block 4",
      address: "14 Adeola Odeku St, Victoria Island",
      city: "Lagos",
      type: "apartment",
      bedrooms: 3,
      rent: 2_400_000,
      images: [],
    },
    landlord: { name: "Chukwuemeka Okafor", email: "c.okafor@gmail.com", score: 4.7 },
    queueStatus: "queued",
    priority: "high",
    submittedAt: "2026-07-29T10:22:00Z",
  },
  {
    id: "laq-002",
    property: {
      id: "prop-002",
      title: "Lekki Phase 1 Duplex",
      address: "7B Admiralty Way, Lekki",
      city: "Lagos",
      type: "duplex",
      bedrooms: 4,
      rent: 5_500_000,
      images: [],
    },
    landlord: { name: "Adaeze Nwosu", email: "adaeze.nwosu@yahoo.com", score: 4.2 },
    queueStatus: "under_review",
    priority: "normal",
    submittedAt: "2026-07-28T08:00:00Z",
  },
  {
    id: "laq-003",
    property: {
      id: "prop-003",
      title: "Gwarinpa Estate Bungalow",
      address: "5th Avenue, Gwarinpa",
      city: "Abuja",
      type: "bungalow",
      bedrooms: 3,
      rent: 1_800_000,
      images: [],
    },
    landlord: { name: "Babatunde Fashola", email: "b.fashola@outlook.com", score: 3.9 },
    queueStatus: "queued",
    priority: "urgent",
    submittedAt: "2026-07-30T07:15:00Z",
  },
  {
    id: "laq-004",
    property: {
      id: "prop-004",
      title: "Maitama Mini Flat",
      address: "Plot 23 Tafawa Balewa Crescent",
      city: "Abuja",
      type: "apartment",
      bedrooms: 1,
      rent: 950_000,
      images: [],
    },
    landlord: { name: "Ngozi Iweala", email: "ngozi.i@protonmail.com", score: 5.0 },
    queueStatus: "approved",
    priority: "normal",
    submittedAt: "2026-07-27T14:00:00Z",
  },
  {
    id: "laq-005",
    property: {
      id: "prop-005",
      title: "Yaba Studio Apartment",
      address: "12 Agoro Street, Yaba",
      city: "Lagos",
      type: "studio",
      bedrooms: 0,
      rent: 600_000,
      images: [],
    },
    landlord: { name: "Tunde Adebayo", email: "tunde.adebayo@gmail.com", score: 4.0 },
    queueStatus: "rejected",
    priority: "normal",
    submittedAt: "2026-07-26T11:30:00Z",
  },
];

const REVIEW_QUEUE = [
  {
    id: "rmq-001",
    review: {
      id: "rev-001",
      body: "This landlord is a total scam. He collected 6 months upfront and never fixed the roof. Do not rent from him.",
      overallScore: 1,
      reviewerRole: "tenant",
    },
    reviewer: { name: "Amaka Obi", email: "amaka@gmail.com" },
    reviewee: { name: "Segun Bello", email: "segun.b@gmail.com" },
    reportedBy: { name: "Segun Bello" },
    reportReason: "false_information",
    reportBody: "The claims in this review are fabricated. I have receipts for all repairs.",
    queueStatus: "open",
    createdAt: "2026-07-30T09:00:00Z",
  },
  {
    id: "rmq-002",
    review: {
      id: "rev-002",
      body: "Worst tenant I have ever had. Broke everything and tried to extort me at the end of the lease.",
      overallScore: 1,
      reviewerRole: "landlord",
    },
    reviewer: { name: "Alhaji Musa Usman", email: "musa.usman@yahoo.com" },
    reviewee: { name: "Chidinma Eze", email: "chidinma.eze@gmail.com" },
    reportedBy: { name: "Chidinma Eze" },
    reportReason: "harassment",
    reportBody: "This review is retaliatory because I reported maintenance issues.",
    queueStatus: "under_review",
    createdAt: "2026-07-29T16:45:00Z",
  },
  {
    id: "rmq-003",
    review: {
      id: "rev-003",
      body: "Buy Bitcoin now!!! Great returns guaranteed!!!",
      overallScore: 5,
      reviewerRole: "tenant",
    },
    reviewer: { name: "Unknown Spammer", email: "bot123@tempmail.com" },
    reviewee: { name: "Folake Adeyemi", email: "folake.a@outlook.com" },
    reportedBy: { name: "Folake Adeyemi" },
    reportReason: "spam",
    reportBody: "This is obvious spam unrelated to any tenancy.",
    queueStatus: "open",
    createdAt: "2026-07-30T12:00:00Z",
  },
  {
    id: "rmq-004",
    review: {
      id: "rev-004",
      body: "Good landlord overall. A few minor delays in maintenance but otherwise a solid experience.",
      overallScore: 4,
      reviewerRole: "tenant",
    },
    reviewer: { name: "Emeka Nze", email: "emeka.nze@gmail.com" },
    reviewee: { name: "Ifeanyi Okeke", email: "ifeanyi.okeke@gmail.com" },
    reportedBy: { name: "Ifeanyi Okeke" },
    reportReason: "false_information",
    reportBody: "I believe the reviewer is my competitor, not an actual tenant.",
    queueStatus: "resolved_kept",
    createdAt: "2026-07-28T11:00:00Z",
  },
];

const USER_LIST = [
  {
    id: "usr-001",
    name: "Adaeze Nwosu",
    email: "adaeze.nwosu@yahoo.com",
    role: "landlord",
    idStatus: "verified",
    isActive: true,
    score: 4.2,
    properties: 3,
    joinedAt: "2025-03-12T00:00:00Z",
  },
  {
    id: "usr-002",
    name: "Chukwuemeka Okafor",
    email: "c.okafor@gmail.com",
    role: "landlord",
    idStatus: "verified",
    isActive: true,
    score: 4.7,
    properties: 5,
    joinedAt: "2024-11-01T00:00:00Z",
  },
  {
    id: "usr-003",
    name: "Amaka Obi",
    email: "amaka@gmail.com",
    role: "tenant",
    idStatus: "pending",
    isActive: true,
    score: 3.8,
    properties: 0,
    joinedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "usr-004",
    name: "Unknown Spammer",
    email: "bot123@tempmail.com",
    role: "tenant",
    idStatus: "unverified",
    isActive: false,
    score: 0,
    properties: 0,
    joinedAt: "2026-07-30T00:00:00Z",
  },
  {
    id: "usr-005",
    name: "Ngozi Iweala",
    email: "ngozi.i@protonmail.com",
    role: "landlord",
    idStatus: "verified",
    isActive: true,
    score: 5.0,
    properties: 2,
    joinedAt: "2024-06-20T00:00:00Z",
  },
  {
    id: "usr-006",
    name: "Babatunde Fashola",
    email: "b.fashola@outlook.com",
    role: "landlord",
    idStatus: "pending",
    isActive: true,
    score: 3.9,
    properties: 1,
    joinedAt: "2025-09-05T00:00:00Z",
  },
  {
    id: "usr-007",
    name: "Segun Bello",
    email: "segun.b@gmail.com",
    role: "landlord",
    idStatus: "verified",
    isActive: false,
    score: 2.1,
    properties: 1,
    joinedAt: "2025-01-20T00:00:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Status Badges ────────────────────────────────────────────────────────────

const LISTING_STATUS_STYLES = {
  queued:       "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved:     "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected:     "bg-red-100 text-red-800 border-red-200",
  escalated:    "bg-purple-100 text-purple-800 border-purple-200",
};

const PRIORITY_STYLES = {
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  high:   "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

const MODERATION_STATUS_STYLES = {
  open:             "bg-amber-100 text-amber-800 border-amber-200",
  under_review:     "bg-blue-100 text-blue-800 border-blue-200",
  resolved_kept:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  resolved_removed: "bg-slate-100 text-slate-700 border-slate-200",
  escalated:        "bg-purple-100 text-purple-800 border-purple-200",
};

const REPORT_REASON_LABELS = {
  spam:                "Spam",
  offensive_language:  "Offensive Language",
  false_information:   "False Information",
  harassment:          "Harassment",
  conflict_of_interest:"Conflict of Interest",
  other:               "Other",
};

function StatusBadge({ label, styleClass }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClass}`}>
      {label}
    </span>
  );
}

// ─── Action Modal ─────────────────────────────────────────────────────────────

function ActionModal({ title, description, children, onClose, confirmLabel, confirmClass, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-4 flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">{children}</div>
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-5 py-2 text-sm font-semibold text-white rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60 ${confirmClass}`}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION: Dashboard ───────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent }) {
  const colors = {
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   border: "border-amber-100" },
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    border: "border-blue-100"  },
    red:     { bg: "bg-red-50",     icon: "text-red-600",     border: "border-red-100"   },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
    purple:  { bg: "bg-purple-50",  icon: "text-purple-600",  border: "border-purple-100"},
  };
  const c = colors[accent] || colors.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-6 flex items-start gap-4`}>
      <div className={`p-3 rounded-xl ${c.bg}`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function DashboardSection() {
  const recentActivity = [
    { icon: CheckCircle2, color: "text-emerald-500", text: "Maitama Mini Flat approved by Admin Ngozi", time: "2h ago" },
    { icon: Flag, color: "text-amber-500", text: "New spam report on review by Amaka Obi", time: "3h ago" },
    { icon: UserX, color: "text-red-500", text: "User 'Unknown Spammer' suspended", time: "5h ago" },
    { icon: Building2, color: "text-blue-500", text: "Gwarinpa Estate Bungalow entered queue (urgent)", time: "8h ago" },
    { icon: BadgeCheck, color: "text-purple-500", text: "Identity verification approved for Adaeze Nwosu", time: "1d ago" },
    { icon: XCircle, color: "text-red-500", text: "Review (rmq-002) escalated to super admin", time: "1d ago" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Dashboard Overview</h2>
        <p className="text-slate-500 text-sm">Real-time platform health at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Building2}         label="Pending Listings"         value={STATS.pendingListings}       sub={`${STATS.approvalsLast7d} approved last 7 days`} accent="amber"   />
        <StatCard icon={MessageSquareWarning} label="Open Review Flags"     value={STATS.openReviewFlags}       sub={`${STATS.removalsLast7d} removed last 7 days`}   accent="red"     />
        <StatCard icon={UserX}             label="Suspended Users"           value={STATS.suspendedUsers}        sub="Active account restrictions"                     accent="purple"  />
        <StatCard icon={BadgeCheck}        label="Pending Verifications"     value={STATS.pendingVerifications}  sub="Identity checks awaiting review"                 accent="blue"    />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users}      label="Total Users"      value={STATS.totalUsers.toLocaleString()}      sub="Across all roles" accent="emerald" />
        <StatCard icon={Building2}  label="Total Properties" value={STATS.totalProperties.toLocaleString()} sub="Listed & managed"  accent="blue"    />
        <StatCard icon={TrendingUp} label="Approvals (7d)"   value={STATS.approvalsLast7d}                 sub="Listings approved this week" accent="amber" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
          <span className="text-xs text-slate-400">Last 48 hours</span>
        </div>
        <ul className="divide-y divide-slate-50">
          {recentActivity.map((item, i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
              <item.icon size={18} className={`flex-shrink-0 ${item.color}`} />
              <p className="text-sm text-slate-700 flex-1">{item.text}</p>
              <span className="text-xs text-slate-400 flex-shrink-0">{item.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── SECTION: Listing Approvals ───────────────────────────────────────────────

function ListingApprovalsSection() {
  const [filter, setFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'approve' | 'reject'
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState(LISTING_QUEUE);

  const filtered = useMemo(() => {
    if (filter === "all") return queue;
    return queue.filter((l) => l.queueStatus === filter);
  }, [filter, queue]);

  function openModal(listing, mode) {
    setSelectedListing(listing);
    setModalMode(mode);
    setNotes("");
    setRejectionReason("");
  }

  function closeModal() {
    setSelectedListing(null);
    setModalMode(null);
  }

  function handleConfirm() {
    if (!selectedListing) return;
    setLoading(true);
    setTimeout(() => {
      setQueue((prev) =>
        prev.map((l) =>
          l.id === selectedListing.id
            ? { ...l, queueStatus: modalMode === "approve" ? "approved" : "rejected" }
            : l
        )
      );
      setLoading(false);
      closeModal();
    }, 800);
  }

  const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "queued", label: "Queued" },
    { key: "under_review", label: "Under Review" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Listing Approvals</h2>
        <p className="text-slate-500 text-sm">Review and approve or reject property listings submitted by landlords.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === t.key
                ? "bg-[#344e41] text-white border-[#344e41]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Landlord</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900 truncate max-w-[200px]">{l.property.title}</p>
                    <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                      <MapPin size={11} />
                      <span className="text-xs truncate max-w-[180px]">{l.property.city} · {l.property.type} · {l.property.bedrooms}BR</span>
                    </div>
                    <p className="text-xs font-semibold text-[#344e41] mt-0.5">{formatNaira(l.property.rent)}/yr</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">{l.landlord.name}</p>
                    <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs">{l.landlord.score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={l.queueStatus.replace(/_/g, " ")}
                      styleClass={LISTING_STATUS_STYLES[l.queueStatus]}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={l.priority}
                      styleClass={PRIORITY_STYLES[l.priority]}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-600 text-xs">{formatDate(l.submittedAt)}</p>
                    <p className="text-slate-400 text-xs">{timeAgo(l.submittedAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {(l.queueStatus === "queued" || l.queueStatus === "under_review") && (
                        <>
                          <button
                            onClick={() => openModal(l, "approve")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() => openModal(l, "reject")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      {(l.queueStatus === "approved" || l.queueStatus === "rejected") && (
                        <span className="text-xs text-slate-400 italic">Decision made</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No listings match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedListing && (
        <ActionModal
          title={modalMode === "approve" ? "Approve Listing" : "Reject Listing"}
          description={selectedListing.property.title}
          onClose={closeModal}
          confirmLabel={modalMode === "approve" ? "Confirm Approval" : "Confirm Rejection"}
          confirmClass={modalMode === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
          onConfirm={handleConfirm}
          loading={loading}
        >
          {modalMode === "reject" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#344e41]/30 focus:border-[#344e41]"
              >
                <option value="">Select a reason…</option>
                <option value="insufficient_docs">Insufficient documentation</option>
                <option value="unverifiable_ownership">Cannot verify ownership</option>
                <option value="inaccurate_details">Inaccurate listing details</option>
                <option value="policy_violation">Platform policy violation</option>
                <option value="duplicate">Duplicate listing</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Verification Notes <span className="text-slate-400 font-normal">(internal)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes for the audit record…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#344e41]/30 focus:border-[#344e41]"
            />
          </div>
          {modalMode === "approve" && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-sm text-emerald-800">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <span>Approving will set the property status to <strong>Active Vacant</strong> and make it visible to tenants.</span>
            </div>
          )}
          {modalMode === "reject" && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-800">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>Rejecting returns the listing to <strong>Draft</strong> and notifies the landlord via email.</span>
            </div>
          )}
        </ActionModal>
      )}
    </div>
  );
}

// ─── SECTION: Review Moderation ───────────────────────────────────────────────

function ReviewModerationSection() {
  const [filter, setFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'keep' | 'remove'
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState(REVIEW_QUEUE);

  const filtered = useMemo(() => {
    if (filter === "all") return queue;
    return queue.filter((r) => r.queueStatus === filter);
  }, [filter, queue]);

  function openModal(report, mode) {
    setSelectedReport(report);
    setModalMode(mode);
    setNotes("");
  }

  function closeModal() {
    setSelectedReport(null);
    setModalMode(null);
  }

  function handleConfirm() {
    if (!selectedReport) return;
    setLoading(true);
    setTimeout(() => {
      setQueue((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? { ...r, queueStatus: modalMode === "keep" ? "resolved_kept" : "resolved_removed" }
            : r
        )
      );
      setLoading(false);
      closeModal();
    }, 800);
  }

  const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "under_review", label: "Under Review" },
    { key: "resolved_kept", label: "Kept" },
    { key: "resolved_removed", label: "Removed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Review Moderation</h2>
        <p className="text-slate-500 text-sm">Investigate reported reviews and decide to keep or remove them.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === t.key
                ? "bg-[#344e41] text-white border-[#344e41]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                {/* Report reason + status */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <StatusBadge label={REPORT_REASON_LABELS[r.reportReason] || r.reportReason} styleClass={MODERATION_STATUS_STYLES.open} />
                  <StatusBadge label={r.queueStatus.replace(/_/g, " ")} styleClass={MODERATION_STATUS_STYLES[r.queueStatus]} />
                  <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                </div>

                {/* Review body */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < r.review.overallScore ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">by {r.reviewer.name} ({r.review.reviewerRole})</span>
                  </div>
                  <p className="text-sm text-slate-700 italic">"{r.review.body}"</p>
                </div>

                {/* Report detail */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Reported by:</span> {r.reportedBy.name}
                  </p>
                  {r.reportBody && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">Report detail:</span> {r.reportBody}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {(r.queueStatus === "open" || r.queueStatus === "under_review") && (
                  <>
                    <button
                      onClick={() => openModal(r, "keep")}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                    >
                      <CheckCircle2 size={13} /> Keep Review
                    </button>
                    <button
                      onClick={() => openModal(r, "remove")}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
                    >
                      <Trash2 size={13} /> Remove Review
                    </button>
                  </>
                )}
                {(r.queueStatus === "resolved_kept" || r.queueStatus === "resolved_removed") && (
                  <span className="text-xs text-slate-400 italic text-right">Resolved</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <MessageSquareWarning size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No reports match this filter.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedReport && (
        <ActionModal
          title={modalMode === "keep" ? "Keep Review" : "Remove Review"}
          description={`"${selectedReport.review.body.slice(0, 60)}…"`}
          onClose={closeModal}
          confirmLabel={modalMode === "keep" ? "Confirm — Keep" : "Confirm — Remove"}
          confirmClass={modalMode === "keep" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
          onConfirm={handleConfirm}
          loading={loading}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Moderation Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain the moderation decision for the audit record…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#344e41]/30 focus:border-[#344e41]"
            />
          </div>
          {modalMode === "keep" && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-sm text-emerald-800">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <span>The review will be unflagged and remain <strong>published</strong> on the platform.</span>
            </div>
          )}
          {modalMode === "remove" && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-800">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>The review will be permanently <strong>removed</strong> and the reviewer notified.</span>
            </div>
          )}
        </ActionModal>
      )}
    </div>
  );
}

// ─── SECTION: User Management ─────────────────────────────────────────────────

function UserManagementSection() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [users, setUsers] = useState(USER_LIST);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  function openActionModal(user, action) {
    setSelectedUser(user);
    setActionType(action);
    setReason("");
    setOpenDropdown(null);
  }

  function closeModal() {
    setSelectedUser(null);
    setActionType(null);
  }

  function handleConfirm() {
    if (!selectedUser) return;
    setLoading(true);
    setTimeout(() => {
      if (actionType === "suspend") {
        setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, isActive: false } : u));
      } else if (actionType === "reinstate") {
        setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, isActive: true } : u));
      } else if (actionType === "verify_id") {
        setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, idStatus: "verified" } : u));
      } else if (actionType === "reject_id") {
        setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, idStatus: "unverified" } : u));
      }
      setLoading(false);
      closeModal();
    }, 800);
  }

  const ID_STATUS_STYLES = {
    verified:   "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending:    "bg-amber-100 text-amber-800 border-amber-200",
    unverified: "bg-slate-100 text-slate-600 border-slate-200",
    rejected:   "bg-red-100 text-red-800 border-red-200",
  };

  const ACTION_LABELS = {
    suspend:    { label: "Suspend User",   color: "bg-orange-600 hover:bg-orange-700" },
    reinstate:  { label: "Reinstate",      color: "bg-emerald-600 hover:bg-emerald-700" },
    verify_id:  { label: "Approve ID",     color: "bg-[#344e41] hover:bg-[#263b33]" },
    reject_id:  { label: "Reject ID",      color: "bg-red-600 hover:bg-red-700" },
    ban:        { label: "Ban User",       color: "bg-red-700 hover:bg-red-800" },
    warn:       { label: "Issue Warning",  color: "bg-amber-600 hover:bg-amber-700" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">User Management</h2>
        <p className="text-slate-500 text-sm">Search, filter, and manage all platform users.</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#344e41]/30 focus:border-[#344e41]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "tenant", "landlord", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                roleFilter === r
                  ? "bg-[#344e41] text-white border-[#344e41]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Account</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#344e41]/10 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-[#344e41]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge label={u.role} styleClass="bg-[#344e41]/10 text-[#344e41] border-[#344e41]/20" />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge label={u.idStatus} styleClass={ID_STATUS_STYLES[u.idStatus]} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={u.isActive ? "Active" : "Suspended"}
                      styleClass={u.isActive ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-slate-700 font-medium">{u.score > 0 ? u.score.toFixed(1) : "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{formatDate(u.joinedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openDropdown === u.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl w-48 py-1 shadow-lg">
                            {u.isActive
                              ? <button onClick={() => openActionModal(u, "suspend")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"><UserX size={14} /> Suspend User</button>
                              : <button onClick={() => openActionModal(u, "reinstate")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"><UserCheck size={14} /> Reinstate</button>
                            }
                            {u.idStatus === "pending" && (
                              <>
                                <button onClick={() => openActionModal(u, "verify_id")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#344e41] hover:bg-emerald-50 transition-colors"><BadgeCheck size={14} /> Approve ID</button>
                                <button onClick={() => openActionModal(u, "reject_id")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"><XCircle size={14} /> Reject ID</button>
                              </>
                            )}
                            <button onClick={() => openActionModal(u, "warn")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"><ShieldAlert size={14} /> Issue Warning</button>
                            <button onClick={() => openActionModal(u, "ban")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1 pt-2"><Ban size={14} /> Ban User</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">No users match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedUser && actionType && (
        <ActionModal
          title={ACTION_LABELS[actionType]?.label || actionType}
          description={`${selectedUser.name} · ${selectedUser.email}`}
          onClose={closeModal}
          confirmLabel={ACTION_LABELS[actionType]?.label || "Confirm"}
          confirmClass={ACTION_LABELS[actionType]?.color || "bg-slate-700 hover:bg-slate-800"}
          onConfirm={handleConfirm}
          loading={loading}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a mandatory justification for this action…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#344e41]/30 focus:border-[#344e41]"
            />
          </div>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-800">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>This action will be recorded in the immutable <strong>User Management Actions</strong> audit log.</span>
          </div>
        </ActionModal>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",          icon: LayoutDashboard       },
  { key: "listings",   label: "Listing Approvals",  icon: Building2,    badge: STATS.pendingListings },
  { key: "reviews",    label: "Review Moderation",  icon: MessageSquareWarning, badge: STATS.openReviewFlags },
  { key: "users",      label: "User Management",    icon: Users                 },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function renderSection() {
    switch (activeSection) {
      case "dashboard": return <DashboardSection />;
      case "listings":  return <ListingApprovalsSection />;
      case "reviews":   return <ReviewModerationSection />;
      case "users":     return <UserManagementSection />;
      default:          return <DashboardSection />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#263b33] flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#E5C583] flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-[#263b33]" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">Lodale Admin</p>
            <p className="text-white/40 text-xs">Control Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={18} className={active ? "text-[#E5C583]" : "text-white/40 group-hover:text-white/70"} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="bg-[#E5C583] text-[#263b33] text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin identity */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#344e41] flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white/70" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-white/40 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Filter size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900 capitalize">
              {NAV_ITEMS.find((n) => n.key === activeSection)?.label ?? "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
