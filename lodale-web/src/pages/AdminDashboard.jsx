import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { adminService } from "../services/adminService";
import { propertyService } from "../services/propertyService";
import { authService } from "../services/authService";
import AdminSupportChat from "./AdminDashboard/AdminSupportChat";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquareWarning,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  UserCheck,
  UserX,
  Trash2,
  Clock,
  ChevronRight,
  X,
  Check,
  Star,
  MapPin,
  ShieldCheck,
  FileText,
  Download,
  Mail,
  Phone,
  Calendar,
  Globe,
  LogOut,
  Sun,
  Moon,
  User,
  KeyRound,
  Upload,
  Menu,
  Settings,
  Palette,
  Bell,
  Sliders,
  Info,
  Shield,
  Laptop,
  Smartphone,
  Monitor
} from "lucide-react";

// --- INITIAL DATA ---
const INITIAL_USERS = [];
const INITIAL_LISTINGS = [];
const INITIAL_REVIEWS = [];

const SETTINGS_PAGES = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "account", label: "Account & Security", icon: KeyRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "about", label: "System Info", icon: Info }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active top tab: 'overview' | 'users' | 'listings' | 'reviews' | 'settings' | 'profile' | 'support'
  const [activeTab, setActiveTab] = useState("overview");
  const [settingsSubTab, setSettingsSubTab] = useState("profile");

  // Handle Escape key to close mobile sidebar drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    if (isSidebarOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  const handleAdminSignOut = () => {
    sessionStorage.clear();
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("sessionExpiresAt");
    sessionStorage.removeItem("lodale_token");
    localStorage.setItem("explicitAdminSignOut", "true");
    navigate("/admin/login", { replace: true });
  };

  // Dynamic state for core modules
  const [users, setUsers] = useState(INITIAL_USERS);
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [selectedDocViewer, setSelectedDocViewer] = useState(null);
  const [propertyRequests, setPropertyRequests] = useState([]);

  useEffect(() => {
    async function loadAdminData() {
      // 1. Load Registered Users from Backend API
      try {
        const apiUsers = await adminService.getUsers();
        if (Array.isArray(apiUsers)) {
          setUsers(apiUsers);
        }
      } catch (err) {
        console.warn("Failed to fetch admin users:", err);
      }

      // Load logged in Admin Profile
      try {
        const stored = JSON.parse(sessionStorage.getItem('lodale_user') || localStorage.getItem('lodale_user') || '{}');
        const currentUser = await authService.getCurrentUser() || stored;
        if (currentUser && (currentUser.email || currentUser.first_name)) {
          setProfileForm(prev => ({
            ...prev,
            name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email || prev.name,
            username: currentUser.email ? currentUser.email.split('@')[0] : prev.username,
            email: currentUser.email || prev.email,
            phone: currentUser.phone_number || currentUser.phone || prev.phone,
            avatarPreview: currentUser.avatar_url || prev.avatarPreview
          }));
        }
      } catch (_e) {}

      // 2. Load Property Listings from Backend API (Both Pending & Public Listings)
      let apiPending = [];
      let apiAll = [];
      try {
        apiPending = await adminService.getPendingProperties();
      } catch (err) {
        console.warn("Backend API offline fallback:", err);
      }

      try {
        apiAll = await propertyService.getProperties();
      } catch (err) {
        console.warn("Backend API all properties fallback:", err);
      }

      try {
        const reqs = await adminService.getPendingRequests();
        setPropertyRequests(reqs);
      } catch (err) {
        console.warn("Failed to load property requests:", err);
      }

      const combinedApiProperties = [...(Array.isArray(apiPending) ? apiPending : []), ...(Array.isArray(apiAll) ? apiAll : [])];

      setListings(() => {
        const map = new Map();

        // Add API properties
        combinedApiProperties.forEach((p) => {
          if (!p || (!p.id && !p.title)) return;
          const key = String(p.id || p.title);
          const rawS = (p.rawStatus || p.status || "").toLowerCase();
          let sLabel = "Pending Approval";
          if (rawS === "active_vacant" || rawS === "approved" || rawS === "live" || rawS === "active" || p.status === "Live") {
            sLabel = "Live";
          } else if (rawS === "inactive" || rawS === "rejected" || p.status === "Rejected") {
            sLabel = "Rejected";
          } else if (rawS === "pending_review" || rawS === "pending" || rawS === "draft" || p.status === "Pending Approval" || p.status === "Info Requested") {
            sLabel = p.queue_status === "under_review" || p.status === "Info Requested" ? "Info Requested" : "Pending Approval";
          }

          const rawPeriod = String(p.rent_period || p.rentPeriod || '').toLowerCase();
          const suffix = rawPeriod.includes('month') ? '/mo' : (rawPeriod.includes('week') ? '/wk' : (rawPeriod.includes('night') || rawPeriod.includes('day') ? '/night' : '/yr'));
          const numVal = Number(String(p.rent_amount || p.rent || p.price || 0).replace(/[^0-9.]/g, '')) || 0;
          const formattedPrice = numVal > 0 ? `₦${numVal.toLocaleString()}${suffix}` : (p.price || `₦0${suffix}`);

          if (!map.has(key)) {
            map.set(key, {
              ...p,
              id: p.id || key,
              title: p.title || p.name || "Property Listing",
              location: p.location || `${p.address_line1 || p.address || 'Lagos'}, ${p.city || 'Lagos'}`,
              price: formattedPrice,
              status: sLabel,
              rawStatus: rawS || "active_vacant",
              ownershipDoc: p.ownershipDoc || p.ownership_doc || 'Deed of Assignment',
              ownershipDocUrl: p.ownershipDocUrl || p.ownership_doc_url,
              docName: p.docName || p.ownership_doc || 'Legal_Document.pdf',
              docDataUrl: p.docDataUrl || p.ownership_doc_url,
              deedVerified: true,
              type: p.type || p.property_type || 'Apartment',
              rent: formattedPrice,
              landlord: p.landlord || { name: 'Verified Landlord', score: 5.0, reviews: 1 }
            });
          }
        });

        // Add local storage properties (from "properties" and "landlordProperties")
        const localPropsSources = ["properties", "landlordProperties"];
        localPropsSources.forEach((srcKey) => {
          try {
            const raw = localStorage.getItem(srcKey);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((lp) => {
                  if (!lp || (!lp.id && !lp.title)) return;
                  const key = String(lp.id || lp.title);
                  const rawS = (lp.status || "").toLowerCase();
                  let sLabel = "Pending Approval";
                  if (rawS === "active_vacant" || rawS === "approved" || rawS === "live" || rawS === "active" || lp.status === "Live") {
                    sLabel = "Live";
                  } else if (rawS === "inactive" || rawS === "rejected" || lp.status === "Rejected") {
                    sLabel = "Rejected";
                  }

                  const lpRawPeriod = String(lp.rent_period || lp.rentPeriod || '').toLowerCase();
                  const lpSuffix = lpRawPeriod.includes('month') ? '/mo' : (lpRawPeriod.includes('week') ? '/wk' : (lpRawPeriod.includes('night') || lpRawPeriod.includes('day') ? '/night' : '/yr'));
                  const lpNumVal = Number(String(lp.rent_amount || lp.rent || lp.price || 0).replace(/[^0-9.]/g, '')) || 0;
                  const lpFormattedPrice = lpNumVal > 0 ? `₦${lpNumVal.toLocaleString()}${lpSuffix}` : (lp.price || `₦0${lpSuffix}`);

                  if (!map.has(key)) {
                    map.set(key, {
                      id: lp.id || key,
                      title: lp.title || lp.name || "Property Listing",
                      location: lp.location || `${lp.address_line1 || lp.address || 'Lagos'}, ${lp.city || 'Lagos'}`,
                      price: lpFormattedPrice,
                      type: lp.type || lp.property_type || "Apartment",
                      status: sLabel,
                      rawStatus: lp.status || "pending_review",
                      submittedAt: lp.submittedAt || lp.created_at || new Date().toISOString(),
                      landlord: lp.landlord || { name: lp.landlordName || "Verified Landlord", score: 5.0, reviews: 1 },
                      description: lp.description || "",
                      amenities: lp.amenities || [],
                      blocks: lp.blocks || [],
                      units: lp.units || [],
                      ownershipDoc: lp.ownershipDoc || lp.ownership_doc || "Deed of Assignment",
                      ownershipDocUrl: lp.ownershipDocUrl || lp.ownership_doc_url,
                      deedVerified: true
                    });
                  } else {
                    const existing = map.get(key);
                    if (sLabel === "Live" && existing.status !== "Live") {
                      existing.status = "Live";
                      existing.rawStatus = "active_vacant";
                    }
                  }
                });
              }
            }
          } catch (_e) { }
        });

        return Array.from(map.values());
      });
    }

    loadAdminData();
    window.addEventListener("storage", loadAdminData);
    window.addEventListener("focus", loadAdminData);
    return () => {
      window.removeEventListener("storage", loadAdminData);
      window.removeEventListener("focus", loadAdminData);
    };
  }, []);

  // Filters & Search
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userStatusFilter, setUserStatusFilter] = useState("All");

  const [listingFilter, setListingFilter] = useState("All");
  const [listingSearch, setListingSearch] = useState("");

  const [reviewFilter, setReviewFilter] = useState("Flagged");
  const [reviewSearch, setReviewSearch] = useState("");

  // Selected item modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedReviewFlag, setSelectedReviewFlag] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [isRejectingModalOpen, setIsRejectingModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // --- SETTINGS FORM STATES ---
  const [profileForm, setProfileForm] = useState({
    name: "Admin User",
    username: "admin",
    email: "admin@lodale.com",
    phone: "+234 800 000 0000",
    avatarPreview: null,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });



  // Handlers for Settings
  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast("Profile information saved successfully!");
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword) {
      showToast("Please enter a new password.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New password and confirm password do not match!");
      return;
    }
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    showToast("Password updated successfully!");
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileForm((prev) => ({ ...prev, avatarPreview: url }));
      showToast("Profile photo updated!");
    }
  };



  // --- CORE ACTIONS ---
  const handleToggleUserStatus = async (userId) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const newStatus = target.status === "Active" ? "Suspended" : "Active";
    const rawStatus = newStatus.toLowerCase();

    try {
      await adminService.updateUserStatus(userId, rawStatus);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              status: newStatus,
              suspensionReason:
                newStatus === "Suspended"
                  ? "Suspended by Admin for safety review."
                  : null,
            };
          }
          return u;
        })
      );
      showToast(`User ${target.name} account is now ${newStatus}.`);
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev
            ? {
              ...prev,
              status: newStatus,
            }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to update user status:", err);
      showToast(`Failed to update user status: ${err.message || "Server error"}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    const target = users.find((u) => u.id === userId);
    const userName = target?.name || target?.email || "this user";
    if (
      window.confirm(
        `Are you sure you want to permanently delete user "${userName}" from the database?`
      )
    ) {
      try {
        await adminService.deleteUser(userId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showToast(`User "${userName}" deleted from database.`);
        if (selectedUser?.id === userId) setSelectedUser(null);

        if (target?.email) {
          const lowerEmail = target.email.toLowerCase();
          localStorage.removeItem(`registeredUser_${lowerEmail}`);
          sessionStorage.removeItem(`userProfile_${lowerEmail}`);
          sessionStorage.removeItem(`username_${lowerEmail}`);
        }
      } catch (err) {
        console.error("Failed to delete user:", err);
        showToast(`Failed to delete user: ${err.message || "Server error"}`);
      }
    }
  };

  const handleApproveListing = async (listingId) => {
    const item = listings.find((l) => l.id === listingId);
    const propertyTitle = item?.title || "Property";

    try {
      await adminService.reviewProperty(listingId, "approve");
      setListings((prev) =>
        prev.map((l) => {
          if (l.id === listingId) {
            return { ...l, status: "Live", rawStatus: "active_vacant" };
          }
          return l;
        })
      );
    } catch (e) {
      console.warn("API review approval warning:", e);
      showToast(`Failed to approve listing: ${e?.message || "Error"}`);
      return;
    }

    const localKeys = ["properties", "landlordProperties"];
    localKeys.forEach((key) => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const localProps = JSON.parse(saved);
          if (Array.isArray(localProps)) {
            const updated = localProps.map((p) => {
              if (p.id === listingId || p.title === propertyTitle || (p.name && p.name === propertyTitle)) {
                return { ...p, status: "active_vacant", rawStatus: "active_vacant" };
              }
              return p;
            });
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      } catch (_err) { }
    });

    // Send notification to landlord
    try {
      const savedNotifs = localStorage.getItem("landlordNotifications");
      const currentNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
      const newNotif = {
        id: "notif-app-" + Date.now(),
        title: "Property Approved & Live!",
        message: `Your property "${propertyTitle}" has been reviewed and approved by Admin. It is now active on tenant search listings.`,
        time: "Just now",
        type: "success",
        read: false
      };
      localStorage.setItem("landlordNotifications", JSON.stringify([newNotif, ...currentNotifs]));
    } catch (_err) { }

    showToast(`Listing "${propertyTitle}" approved and is now live!`);
    if (selectedListing?.id === listingId) {
      setSelectedListing((prev) => (prev ? { ...prev, status: "Live" } : null));
    }
  };

  const handleRejectListing = async (listingId, reason = "Failed verification requirements.") => {
    try {
      await adminService.reviewProperty(listingId, "reject", reason);
    } catch (e) {
      console.warn("API review rejection warning:", e);
    }
    setListings((prev) =>
      prev.map((l) => {
        if (l.id === listingId) {
          return { ...l, status: "Rejected", rejectionReason: reason };
        }
        return l;
      })
    );

    const item = listings.find((l) => l.id === listingId);
    const propertyTitle = item?.title || "Property";

    try {
      const saved = localStorage.getItem("properties");
      if (saved) {
        const localProps = JSON.parse(saved);
        const updated = localProps.map((p) =>
          p.id === listingId ? { ...p, status: "rejected", admin_notes: reason } : p
        );
        localStorage.setItem("properties", JSON.stringify(updated));
      }
    } catch (_err) { }

    // Send notification to landlord
    try {
      const savedNotifs = localStorage.getItem("landlordNotifications");
      const currentNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
      const newNotif = {
        id: "notif-rej-" + Date.now(),
        title: "Property Review Update",
        message: `Your property "${propertyTitle}" review status was updated to Rejected by Admin. Reason: ${reason}`,
        time: "Just now",
        type: "warning",
        read: false
      };
      localStorage.setItem("landlordNotifications", JSON.stringify([newNotif, ...currentNotifs]));
      window.dispatchEvent(new Event("storage"));
    } catch (_err) { }

    showToast(`Listing "${propertyTitle}" rejected.`);
    setIsRejectingModalOpen(false);
    setRejectReasonInput("");
    if (selectedListing?.id === listingId) {
      setSelectedListing((prev) =>
        prev ? { ...prev, status: "Rejected", rejectionReason: reason } : null
      );
    }
  };

  const handleRequestInfoListing = async (listingId) => {
    try {
      await adminService.reviewProperty(listingId, "request_info", "Additional proof of ownership required.");
    } catch (e) {
      console.warn("API request info warning:", e);
    }
    setListings((prev) =>
      prev.map((l) => {
        if (l.id === listingId) {
          return { ...l, status: "Info Requested" };
        }
        return l;
      })
    );

    const item = listings.find((l) => l.id === listingId);
    const propertyTitle = item?.title || "Property";

    try {
      const saved = localStorage.getItem("properties");
      if (saved) {
        const localProps = JSON.parse(saved);
        const updated = localProps.map((p) =>
          p.id === listingId ? { ...p, status: "info_requested", admin_notes: "Additional proof of ownership required." } : p
        );
        localStorage.setItem("properties", JSON.stringify(updated));
      }
    } catch (_err) { }

    // Send notification to landlord
    try {
      const savedNotifs = localStorage.getItem("landlordNotifications");
      const currentNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
      const newNotif = {
        id: "notif-req-" + Date.now(),
        title: "Proof of Ownership Update Required",
        message: `Your property "${propertyTitle}" requires additional proof of ownership. Please upload a new document.`,
        time: "Just now",
        type: "warning",
        read: false
      };
      localStorage.setItem("landlordNotifications", JSON.stringify([newNotif, ...currentNotifs]));
      window.dispatchEvent(new Event("storage"));
    } catch (_err) { }

    showToast(`Requested more info for "${propertyTitle}".`);
    if (selectedListing?.id === listingId) {
      setSelectedListing((prev) =>
        prev ? { ...prev, status: "Info Requested" } : null
      );
    }
  };

  const handleRemoveListing = async (listingId) => {
    const item = listings.find((l) => l.id === listingId);
    if (
      window.confirm(
        `Remove listing "${item?.title}" from platform and database?`
      )
    ) {
      try {
        await propertyService.deleteProperty(listingId);
        setListings((prev) => prev.filter((l) => l.id !== listingId));
        showToast(`Listing "${item?.title}" removed successfully.`);
        if (selectedListing?.id === listingId) setSelectedListing(null);
      } catch (err) {
        console.error("Failed to delete property listing:", err);
        showToast(`Failed to remove listing: ${err.message || "Server error"}`);
      }
    }
  };

  const handleDismissFlag = (reviewId) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return { ...r, flagged: false, status: "Approved" };
        }
        return r;
      })
    );
    showToast("Flag dismissed. Review kept on platform.");
    if (selectedReviewFlag?.id === reviewId) setSelectedReviewFlag(null);
  };

  const handleRemoveReview = (reviewId) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    showToast("Abusive/fake review removed.");
    if (selectedReviewFlag?.id === reviewId) setSelectedReviewFlag(null);
  };

  // --- FILTERED COMPUTATIONS ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole =
        userRoleFilter === "All" || u.role === userRoleFilter;
      const matchesStatus =
        userStatusFilter === "All" || u.status === userStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const searchStr = (listingSearch || "").toLowerCase().trim();
      const titleStr = (l.title || "").toLowerCase();
      const locationStr = (l.location || "").toLowerCase();
      const landlordName = (l.landlord?.name || l.landlord_name || "").toLowerCase();

      const matchesSearch =
        !searchStr ||
        titleStr.includes(searchStr) ||
        locationStr.includes(searchStr) ||
        landlordName.includes(searchStr);

      const status = l.status || "Pending Approval";
      const rawStatus = (l.rawStatus || "").toLowerCase();

      let matchesStatus = false;
      if (listingFilter === "All") {
        matchesStatus = true;
      } else if (listingFilter === "Live") {
        matchesStatus = status === "Live" || rawStatus === "active_vacant" || rawStatus === "approved" || rawStatus === "live" || rawStatus === "active";
      } else if (listingFilter === "Pending Approval") {
        matchesStatus = status === "Pending Approval" || status === "Info Requested" || rawStatus === "pending_review" || rawStatus === "pending" || rawStatus === "draft";
      } else if (listingFilter === "Rejected") {
        matchesStatus = status === "Rejected" || rawStatus === "inactive" || rawStatus === "rejected";
      }

      return matchesSearch && matchesStatus;
    });
  }, [listings, listingSearch, listingFilter]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        r.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.authorName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.propertyTitle.toLowerCase().includes(reviewSearch.toLowerCase());
      const matchesFlagged =
        reviewFilter === "All" || (reviewFilter === "Flagged" && r.flagged);
      return matchesSearch && matchesFlagged;
    });
  }, [reviews, reviewSearch, reviewFilter]);

  const totalUsersCount = users.length;
  const pendingListingsCount = listings.filter(
    (l) => l.status === "Pending Approval"
  ).length;
  const flaggedReviewsCount = reviews.filter((r) => r.flagged).length;

  const actionRequiredFeed = useMemo(() => {
    const items = [
      ...listings
        .filter((l) => l.status === "Pending Approval")
        .map((l) => ({
          type: "listing",
          id: l.id,
          title: l.title,
          sub: `${l.location} • Submitted by ${l.landlord.name}`,
          timestamp: l.submittedAt,
          raw: l,
        })),
      ...reviews
        .filter((r) => r.flagged)
        .map((r) => ({
          type: "review",
          id: r.id,
          title: `Flagged Review on "${r.propertyTitle}"`,
          sub: `Reported by ${r.flaggedBy} • "${r.comment.slice(0, 70)}..."`,
          timestamp: r.submittedAt,
          raw: r,
        })),
    ];
    return items.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [listings, reviews]);



  return (
    <div className="h-screen overflow-hidden bg-[#DAD7CD] dark:bg-[#262626] text-[#262626] dark:text-[#DAD7CD] font-sans flex flex-col antialiased selection:bg-[#3A5A40] selection:text-white transition-colors duration-200">
      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed top-5 right-5 left-5 sm:left-auto z-50 bg-[#344E41] dark:bg-[#1A3329] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-[#3A5A40] dark:border-[#2C4638] animate-bounce">
          <ShieldCheck className="h-5 w-5 text-[#DAD7CD] dark:text-[#E5C583]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* --- MOBILE/TABLET HEADER --- */}
      <header className="sticky top-0 z-30 md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#16241F] border-b border-[#3A5A40]/20 dark:border-[#263D33] shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg text-[#3A5A40] dark:text-[#E5C583] hover:bg-[#DAD7CD]/50 dark:hover:bg-[#1E3029] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A5A40]/40"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo className="scale-90 origin-left" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded bg-[#3A5A40] dark:bg-[#1C3028] text-white dark:text-[#E5C583]">
            Admin
          </span>
        </div>
      </header>

      {/* --- INNER WRAPPER --- */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* --- BACKDROP OVERLAY FOR DRAWER --- */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* --- LEFT SIDEBAR NAVIGATION --- */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#344E41] dark:bg-[#1a1a1a] text-white flex-shrink-0 border-r border-[#3A5A40] dark:border-[#262626] flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div>
            {/* Top Logo Container */}
            <div className="p-4 border-b border-[#3A5A40] dark:border-[#262626] flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/explore")} title="Go to Public Guest Dashboard">
                  <Logo variant="white" className="scale-90 origin-left" />
                </div>
              </div>
              {/* Close Button inside the drawer */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-[#DAD7CD] hover:text-white hover:bg-[#3A5A40] dark:hover:bg-[#1C3028] transition-colors focus:outline-none"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1">
              {/* Overview */}
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "overview"
                  ? "bg-[#3A5A40] text-white shadow-sm font-semibold"
                  : "text-[#DAD7CD] hover:bg-[#3A5A40]/50 hover:text-white"
                  }`}
              >
                <LayoutDashboard className="h-4 w-4 text-[#DAD7CD] dark:text-[#E5C583] shrink-0" />
                <span>Dashboard Overview</span>
              </button>

              <div className="pt-3 pb-1 px-3 text-[10.5px] font-semibold text-[#DAD7CD]/70 dark:text-[#A3BCA7]/70 uppercase tracking-wider whitespace-nowrap">
                Safety &amp; Management
              </div>

              {/* User Management */}
              <button
                onClick={() => {
                  setActiveTab("users");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "users"
                  ? "bg-[#3A5A40] text-white shadow-sm font-semibold"
                  : "text-[#DAD7CD] hover:bg-[#3A5A40]/50 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="h-4 w-4 text-[#DAD7CD] dark:text-[#E5C583] shrink-0" />
                  <span className="truncate">User Management</span>
                </div>
                <span className="text-[11px] bg-[#262626]/40 dark:bg-black/40 px-1.5 py-0.5 rounded-full text-[#DAD7CD] ml-1 shrink-0">
                  {users.length}
                </span>
              </button>

              {/* Listing Oversight */}
              <button
                onClick={() => {
                  setActiveTab("listings");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "listings"
                  ? "bg-[#3A5A40] text-white shadow-sm font-semibold"
                  : "text-[#DAD7CD] hover:bg-[#3A5A40]/50 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="h-4 w-4 text-[#DAD7CD] dark:text-[#E5C583] shrink-0" />
                  <span className="truncate">Listings</span>
                </div>
                {pendingListingsCount > 0 && (
                  <span className="text-[11px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                    {pendingListingsCount}
                  </span>
                )}
              </button>

              {/* Property Requests (Deletion & Suspension) */}
              <button
                onClick={() => {
                  setActiveTab("requests");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "requests"
                  ? "bg-[#3A5A40] text-white shadow-sm font-semibold"
                  : "text-[#DAD7CD] hover:bg-[#3A5A40]/50 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-4 w-4 text-[#DAD7CD] dark:text-[#E5C583] shrink-0" />
                  <span className="truncate">Property Requests</span>
                </div>
                {propertyRequests.length > 0 && (
                  <span className="text-[11px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                    {propertyRequests.length}
                  </span>
                )}
              </button>

              {/* Review & Rating Moderation */}
              <button
                onClick={() => {
                  setActiveTab("reviews");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "reviews"
                  ? "bg-[#3A5A40] text-white shadow-sm font-semibold"
                  : "text-[#DAD7CD] hover:bg-[#3A5A40]/50 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquareWarning className="h-4 w-4 text-[#DAD7CD] dark:text-[#E5C583] shrink-0" />
                  <span className="truncate">Review Moderation</span>
                </div>
                {flaggedReviewsCount > 0 && (
                  <span className="text-[11px] bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                    {flaggedReviewsCount}
                  </span>
                )}
              </button>

              {/* Support Messages */}
              <button
                onClick={() => {
                  setActiveTab("support");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "support"
                  ? "bg-[#3A5A40] text-white shadow-sm font-semibold"
                  : "text-[#DAD7CD] hover:bg-[#3A5A40]/50 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="h-4 w-4 text-[#DAD7CD] dark:text-[#E5C583] shrink-0" />
                  <span className="truncate">Support Messages</span>
                </div>
              </button>

              {/* My Profile */}
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setSettingsSubTab("profile");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "profile" || activeTab === "settings"
                  ? "bg-[#3A5A40] text-white shadow-sm font-semibold"
                  : "text-[#DAD7CD] hover:bg-[#3A5A40]/50 hover:text-white"
                  }`}
              >
                <User className="h-4 w-4 text-[#DAD7CD] dark:text-[#E5C583] shrink-0" />
                <span>My Profile</span>
              </button>
            </nav>
          </div>

          {/* Footer Admin info & Navigation controls */}
          <div className="p-4 border-t border-[#3A5A40] dark:border-[#262626] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#DAD7CD]/80 dark:text-[#A3BCA7]">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{profileForm.name}</p>
                <p className="text-[11px] text-[#DAD7CD] dark:text-[#A3BCA7] truncate">System Administrator</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Light/Dark mode toggle switch */}
                <button
                  onClick={toggleTheme}
                  className="p-1 rounded hover:bg-[#3A5A40] text-[#DAD7CD] hover:text-white transition-colors focus:outline-none"
                  aria-label="Toggle Theme"
                  title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-[#E5C583]" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
                <span className="h-2 w-2 rounded-full bg-emerald-400" title="Online"></span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3A5A40]/60 dark:border-[#1E332B]/60 space-y-1.5 text-xs font-medium">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate("/explore");
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-[#DAD7CD] hover:bg-[#3A5A40] hover:text-white transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Return to Public Site</span>
              </button>
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  handleAdminSignOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-rose-300 hover:bg-rose-900/40 hover:text-rose-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* --- MAIN AREA --- */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full min-w-0 overflow-y-auto overflow-x-hidden">
          {/* --- TAB 0: DASHBOARD OVERVIEW --- */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#262626] dark:text-[#F0F5F2]">
                  Dashboard Overview
                </h1>
                <p className="text-sm text-[#262626]/70 dark:text-[#A3BCA7] mt-1">
                  Real-time safety metrics and high-priority platform action items.
                </p>
              </div>

              {/* Key Numbers Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Card 1: Total Users */}
                <div
                  onClick={() => setActiveTab("users")}
                  className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-5 cursor-pointer hover:border-[#3A5A40] dark:hover:border-[#E5C583] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between text-[#344E41] dark:text-[#A3BCA7]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#262626]/70 dark:text-[#A3BCA7]">
                      Total Users
                    </span>
                    <div className="p-2 rounded-lg bg-[#DAD7CD]/50 dark:bg-[#1D3029]">
                      <Users className="h-5 w-5 text-[#3A5A40] dark:text-[#E5C583]" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-bold text-[#262626] dark:text-[#F0F5F2]">
                      {totalUsersCount}
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {users.filter((u) => u.status === "Active").length} active
                    </span>
                  </div>
                  <div className="mt-4 text-xs text-[#3A5A40] dark:text-[#E5C583] flex items-center gap-1 font-medium">
                    Manage accounts <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Card 2: Listings Waiting Approval */}
                <div
                  onClick={() => setActiveTab("listings")}
                  className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-5 cursor-pointer hover:border-[#3A5A40] dark:hover:border-[#E5C583] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between text-[#344E41] dark:text-[#A3BCA7]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#262626]/70 dark:text-[#A3BCA7]">
                      Listings Pending Review
                    </span>
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-bold text-[#262626] dark:text-[#F0F5F2]">
                      {pendingListingsCount}
                    </span>
                    <span className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                      needs verification
                    </span>
                  </div>
                  <div className="mt-4 text-xs text-[#3A5A40] dark:text-[#E5C583] flex items-center gap-1 font-medium">
                    Review listings <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Card 3: Flagged Reviews */}
                <div
                  onClick={() => setActiveTab("reviews")}
                  className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-5 cursor-pointer hover:border-[#3A5A40] dark:hover:border-[#E5C583] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between text-[#344E41] dark:text-[#A3BCA7]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#262626]/70 dark:text-[#A3BCA7]">
                      Flagged Reviews
                    </span>
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                      <MessageSquareWarning className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-bold text-[#262626] dark:text-[#F0F5F2]">
                      {flaggedReviewsCount}
                    </span>
                    <span className="text-xs text-rose-800 dark:text-rose-400 font-medium">
                      needing moderation
                    </span>
                  </div>
                  <div className="mt-4 text-xs text-[#3A5A40] dark:text-[#E5C583] flex items-center gap-1 font-medium">
                    Moderate reviews <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              {/* Short list: What needs action right now */}
              <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#DAD7CD] dark:border-[#233B31]">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#262626] dark:text-[#F0F5F2] flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#3A5A40] dark:text-[#E5C583]" />
                      Action Required Right Now
                    </h2>
                    <p className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">
                      Pending approvals and flagged reviews ordered by most recent first.
                    </p>
                  </div>
                  <span className="text-xs bg-[#DAD7CD] dark:bg-[#233B31] px-2.5 py-1 rounded-full text-[#262626] dark:text-[#E4EBE6] font-medium">
                    {actionRequiredFeed.length} Items Pending
                  </span>
                </div>

                <div className="mt-4 divide-y divide-[#DAD7CD]/60 dark:divide-[#233B31]">
                  {actionRequiredFeed.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#262626]/60 dark:text-[#A3BCA7]/70">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                      All clear! No pending listing approvals or flagged reviews.
                    </div>
                  ) : (
                    actionRequiredFeed.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="py-4 flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap md:items-center justify-between gap-4 hover:bg-[#DAD7CD]/20 dark:hover:bg-[#1D3029] px-2 rounded-lg transition-colors w-full min-w-0"
                      >
                        <div className="space-y-1 min-w-0 md:flex-1">
                          <div className="flex items-center gap-2">
                            {item.type === "listing" ? (
                              <span className="text-[11px] font-bold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">
                                Listing Approval
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold uppercase bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 px-2 py-0.5 rounded">
                                Flagged Review
                              </span>
                            )}
                            <span className="text-xs text-[#262626]/50 dark:text-[#A3BCA7]/60">
                              {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <h3 className="font-medium text-sm text-[#262626] dark:text-[#F0F5F2]">
                            {item.title}
                          </h3>
                          <p className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">{item.sub}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-1 min-[350px]:grid-cols-2 md:flex md:flex-wrap md:items-center md:flex-shrink-0 gap-2 w-full md:w-auto">
                          {item.type === "listing" ? (
                            <>
                              <button
                                onClick={() => setSelectedListing(item.raw)}
                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-[#344E41] dark:text-[#E4EBE6] bg-[#DAD7CD] dark:bg-[#233B31] hover:bg-[#DAD7CD]/80 dark:hover:bg-[#2E4D40] rounded transition-colors col-span-1 min-[350px]:col-span-2 md:col-span-1 text-center"
                              >
                                Inspect
                              </button>
                              <button
                                onClick={() => handleApproveListing(item.id)}
                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-white bg-[#3A5A40] hover:bg-[#344E41] dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded flex items-center justify-center gap-1 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedListing(item.raw);
                                  setIsRejectingModalOpen(true);
                                }}
                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded flex items-center justify-center gap-1 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" /> Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedReviewFlag(item.raw)}
                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-[#344E41] dark:text-[#E4EBE6] bg-[#DAD7CD] dark:bg-[#233B31] hover:bg-[#DAD7CD]/80 dark:hover:bg-[#2E4D40] rounded transition-colors col-span-1 min-[350px]:col-span-2 md:col-span-1 text-center"
                              >
                                Report Details
                              </button>
                              <button
                                onClick={() => handleDismissFlag(item.id)}
                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-white bg-[#3A5A40] hover:bg-[#344E41] dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded transition-colors text-center"
                              >
                                Keep Review
                              </button>
                              <button
                                onClick={() => handleRemoveReview(item.id)}
                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded transition-colors text-center"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 1: USER MANAGEMENT --- */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-[#262626] dark:text-[#F0F5F2]">
                  1. User Management
                </h1>
                <p className="text-sm text-[#262626]/70 dark:text-[#A3BCA7] mt-1">
                  View all registered users, inspect profiles, suspend/activate, or delete accounts.
                </p>
              </div>

              {/* Search and Filters Bar */}
              <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#262626]/50 dark:text-[#A3BCA7]/60" />
                  <input
                    type="text"
                    placeholder="Search user by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#DAD7CD]/40 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#E5C583] text-[#262626] dark:text-[#E4EBE6]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-xs text-[#262626]/80 dark:text-[#A3BCA7] font-medium">
                    <Filter className="h-3.5 w-3.5" /> Filter Role:
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="text-xs bg-[#DAD7CD]/40 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg px-2.5 py-2 text-[#262626] dark:text-[#E4EBE6] font-medium focus:outline-none"
                  >
                    <option value="All">All Roles</option>
                    <option value="Landlord">Landlord</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Admin">Admin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="text-xs bg-[#DAD7CD]/40 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg px-2.5 py-2 text-[#262626] dark:text-[#E4EBE6] font-medium focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#344E41] dark:bg-[#1A2E26] text-white text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Verifications</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DAD7CD] dark:divide-[#233B31] text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#262626]/60 dark:text-[#A3BCA7]/70 text-xs">
                          No users found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-[#DAD7CD]/20 dark:hover:bg-[#1D3029] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#262626] dark:text-[#F0F5F2]">{user.name}</div>
                            <div className="text-xs text-[#262626]/60 dark:text-[#A3BCA7]/70">{user.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block text-xs px-2.5 py-0.5 rounded font-semibold ${user.role === "Landlord"
                                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800/50"
                                : user.role === "Admin"
                                  ? "bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 dark:border dark:border-purple-800/50"
                                  : "bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800/50"
                                }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.verifications.map((v, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-[#DAD7CD] dark:bg-[#233B31] px-1.5 py-0.5 rounded text-[#262626] dark:text-[#E4EBE6] font-medium"
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {user.status === "Active" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                                <span className="h-2 w-2 rounded-full bg-rose-600 dark:bg-rose-400"></span> Suspended
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-1.5 text-[#344E41] dark:text-[#E5C583] hover:bg-[#DAD7CD] dark:hover:bg-[#233B31] rounded transition-colors"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`p-1.5 rounded transition-colors ${user.status === "Active"
                                ? "text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                                }`}
                              title={user.status === "Active" ? "Suspend Account" : "Activate Account"}
                            >
                              {user.status === "Active" ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 2: LISTING OVERSIGHT --- */}
          {activeTab === "listings" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-[#262626] dark:text-[#F0F5F2]">
                  Listings
                </h1>
                <p className="text-sm text-[#262626]/70 dark:text-[#A3BCA7] mt-1">
                  Review new listings waiting to go live, approve or reject submissions, or remove fraudulent listings.
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-1.5 bg-[#DAD7CD]/50 dark:bg-[#1B2C25] p-1 rounded-lg overflow-x-auto max-w-full w-full md:w-auto shrink-0">
                  {["All", "Pending Approval", "Live", "Rejected"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setListingFilter(tab)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${listingFilter === tab
                        ? "bg-[#3A5A40] dark:bg-[#E5C583] text-white dark:text-[#263b33]"
                        : "text-[#262626]/80 dark:text-[#A3BCA7] hover:text-[#262626] dark:hover:text-white"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#262626]/50 dark:text-[#A3BCA7]/60" />
                  <input
                    type="text"
                    placeholder="Search title, area, landlord..."
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#DAD7CD]/40 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#E5C583] text-[#262626] dark:text-[#E4EBE6]"
                  />
                </div>
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredListings.length === 0 ? (
                  <div className="col-span-2 py-10 text-center bg-white/60 dark:bg-[#16241F] rounded-xl text-sm text-[#262626]/60 dark:text-[#A3BCA7]/70">
                    No listings found for the selected filter.
                  </div>
                ) : (
                  filteredListings.map((lst) => (
                    <div
                      key={lst.id}
                      className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${lst.status === "Live"
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300"
                              : lst.status === "Pending Approval"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300"
                                : "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300"
                              }`}
                          >
                            {lst.status}
                          </span>
                          <span className="text-xs text-[#262626]/50 dark:text-[#A3BCA7]/60">
                            {lst.type}
                          </span>
                        </div>

                        <h3 className="font-serif font-semibold text-lg text-[#262626] dark:text-[#F0F5F2]">
                          {lst.title}
                        </h3>
                        <p className="text-xs text-[#262626]/70 dark:text-[#A3BCA7] flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-[#3A5A40] dark:text-[#E5C583]" /> {lst.location}
                        </p>

                        <div className="mt-3 text-sm font-bold text-[#344E41] dark:text-[#E5C583]">
                          {lst.price}
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#DAD7CD] dark:border-[#233B31] text-xs text-[#262626]/70 dark:text-[#A3BCA7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span>Landlord: <strong className="text-[#262626] dark:text-[#F0F5F2]">{lst.landlord.name}</strong></span>
                          <span>Deed Verified: {lst.deedVerified ? "Yes" : "No"}</span>
                        </div>

                        {lst.fraudWarning && (
                          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <span>{lst.fraudWarning}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#DAD7CD] dark:border-[#233B31] flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedListing(lst)}
                          className="px-3 py-1.5 text-xs font-medium text-[#344E41] dark:text-[#E4EBE6] bg-[#DAD7CD] dark:bg-[#233B31] hover:bg-[#DAD7CD]/80 dark:hover:bg-[#2E4D40] rounded transition-colors"
                        >
                          Inspect Details
                        </button>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {lst.status === "Pending Approval" && (
                            <>
                              <button
                                onClick={() => handleApproveListing(lst.id)}
                                className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#3A5A40] hover:bg-[#344E41] dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedListing(lst);
                                  setIsRejectingModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRemoveListing(lst.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Remove if fraudulent"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* --- TAB 3: REVIEW & RATING MODERATION --- */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-[#262626] dark:text-[#F0F5F2]">
                  3. Review &amp; Rating Moderation
                </h1>
                <p className="text-sm text-[#262626]/70 dark:text-[#A3BCA7] mt-1">
                  Filter reported reviews, inspect details, and remove fake or abusive ratings.
                </p>
              </div>

              {/* Filter Toggle & Search */}
          <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-1.5 bg-[#DAD7CD]/50 dark:bg-[#1B2C25] p-1 rounded-lg overflow-x-auto max-w-full w-full md:w-auto shrink-0">
              <button
                onClick={() => setReviewFilter("Flagged")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${reviewFilter === "Flagged"
                  ? "bg-rose-800 text-white"
                  : "text-[#262626]/80 dark:text-[#A3BCA7] hover:text-[#262626] dark:hover:text-white"
                  }`}
              >
                Flagged Only ({flaggedReviewsCount})
              </button>
              <button
                onClick={() => setReviewFilter("All")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${reviewFilter === "All"
                  ? "bg-[#3A5A40] dark:bg-[#E5C583] text-white dark:text-[#263b33]"
                  : "text-[#262626]/80 dark:text-[#A3BCA7] hover:text-[#262626] dark:hover:text-white"
                  }`}
              >
                All Reviews ({reviews.length})
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#262626]/50 dark:text-[#A3BCA7]/60" />
              <input
                type="text"
                placeholder="Search in reviews..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#DAD7CD]/40 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#E5C583] text-[#262626] dark:text-[#E4EBE6]"
              />
            </div>
          </div>

          {/* Reviews Feed */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="py-10 text-center bg-white/60 dark:bg-[#16241F] rounded-xl text-sm text-[#262626]/60 dark:text-[#A3BCA7]/70">
                No reviews match your current view.
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#262626] dark:text-[#F0F5F2]">
                        {rev.propertyTitle}
                      </span>
                      {rev.flagged && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 px-2 py-0.5 rounded font-bold uppercase">
                          FLAGGED
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#262626] dark:text-[#E4EBE6] italic">
                      "{rev.comment}"
                    </p>

                    <div className="text-xs text-[#262626]/60 dark:text-[#A3BCA7]/70">
                      By <strong className="text-[#262626] dark:text-[#F0F5F2]">{rev.authorName}</strong> • {formatDate(rev.submittedAt, { year: 'numeric', month: 'numeric', day: 'numeric' })}
                    </div>

                    {rev.flagged && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded text-xs text-amber-900 dark:text-amber-300">
                        <strong>Reported reason:</strong> {rev.flagReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedReviewFlag(rev)}
                      className="px-3 py-1.5 text-xs font-medium text-[#344E41] dark:text-[#E4EBE6] bg-[#DAD7CD] dark:bg-[#233B31] hover:bg-[#DAD7CD]/80 dark:hover:bg-[#2E4D40] rounded transition-colors"
                    >
                      Report Details
                    </button>

                    {rev.flagged && (
                      <button
                        onClick={() => handleDismissFlag(rev.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#3A5A40] hover:bg-[#344E41] dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded transition-colors"
                      >
                        Dismiss Flag (Keep)
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveReview(rev.id)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded transition-colors"
                    >
                      Remove Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB: PROPERTY REQUESTS (DELETION & SUSPENSION) --- */}
      {activeTab === "requests" && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-[#262626] dark:text-[#F0F5F2] flex items-center gap-2">
                    <FileText className="h-6 w-6 text-[#3A5A40] dark:text-[#E5C583]" />
                    Property Deletion & Suspension Requests
                  </h1>
                  <p className="text-xs text-[#262626]/70 dark:text-[#A3BCA7] mt-1">
                    Review and act on landlord requests to suspend or delete listed properties.
                  </p>
                </div>

                {propertyRequests.length === 0 ? (
                  <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-2xl p-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                    <h3 className="text-base font-bold text-ink-900 dark:text-white">No Pending Requests</h3>
                    <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-1">
                      There are currently no property deletion or suspension requests awaiting approval.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {propertyRequests.map((req) => {
                      const isDeletion = req.status === "deletion_requested";
                      const reason = isDeletion ? req.deletion_reason : req.suspension_reason;

                      return (
                        <div key={req.id} className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-5 shadow-sm space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${isDeletion ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                                  {isDeletion ? 'Deletion Request' : 'Suspension Request'}
                                </span>
                                <span className="text-xs text-ink-400">ID: {req.id}</span>
                              </div>
                              <h3 className="text-lg font-bold text-ink-900 dark:text-white">{req.title}</h3>
                              <p className="text-xs text-ink-500 dark:text-cream-100/70">{req.city}, {req.state} • Landlord: <span className="font-semibold text-moss-800 dark:text-[#E5C583]">{req.landlord_name || req.landlord_email || 'Landlord'}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-moss-800 dark:text-[#E5C583]">₦{Number(req.rent_amount || 0).toLocaleString()}/yr</p>
                            </div>
                          </div>

                          <div className="bg-cream-50 dark:bg-white/5 p-3 rounded-lg border border-ink-100 dark:border-white/10">
                            <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Reason Provided by Landlord:</p>
                            <p className="text-xs text-ink-800 dark:text-cream-100 italic">"{reason || 'No reason specified.'}"</p>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              onClick={async () => {
                                try {
                                  if (isDeletion) {
                                    await adminService.rejectDeletion(req.id);
                                  } else {
                                    await adminService.rejectSuspension(req.id);
                                  }
                                  triggerToast('Request rejected successfully.', 'success');
                                  setPropertyRequests(prev => prev.filter(r => r.id !== req.id));
                                } catch (e) {
                                  triggerToast('Failed to reject request.', 'error');
                                }
                              }}
                              className="px-4 py-2 text-xs font-bold rounded-lg border border-ink-200 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/10 text-ink-700 dark:text-white"
                            >
                              Reject Request
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  if (isDeletion) {
                                    await adminService.approveDeletion(req.id);
                                  } else {
                                    await adminService.approveSuspension(req.id);
                                  }
                                  triggerToast(isDeletion ? 'Property deleted.' : 'Property suspended.', 'success');
                                  setPropertyRequests(prev => prev.filter(r => r.id !== req.id));
                                } catch (e) {
                                  triggerToast('Failed to approve request.', 'error');
                                }
                              }}
                              className={`px-4 py-2 text-xs font-bold rounded-lg text-white shadow-sm ${isDeletion ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                            >
                              {isDeletion ? 'Approve & Delete Property' : 'Approve & Suspend Listing'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 4: MY PROFILE --- */}
            {activeTab === "support" && (
              <div className="h-full">
                <AdminSupportChat />
              </div>
            )}

            {/* Settings Tab / Sub-Tabs */}
            {(activeTab === "profile" || activeTab === "settings") && (
              <div className="space-y-6 animate-fade-in">
                {/* Main Header */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#344E41] dark:text-[#DAD7CD] uppercase tracking-wider mb-1">
                    <User className="h-4 w-4" /> System Administration
                  </div>
                  <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#262626] dark:text-[#DAD7CD]">
                    My Profile
                  </h1>
                  <p className="text-sm text-[#262626]/70 dark:text-[#DAD7CD]/75 mt-1">
                    Manage your personal information, contact details, and account password.
                  </p>
                </div>

                {/* Profile Details Form Card */}
                <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#262626] dark:text-[#DAD7CD] flex items-center gap-2">
                      <User className="h-5 w-5 text-[#3A5A40] dark:text-[#DAD7CD]" />
                      Profile Details
                    </h2>
                    <p className="text-xs text-[#262626]/70 dark:text-[#DAD7CD]/75">
                      Update your public administrator details and identity attributes.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Photo Upload Section */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-[#DAD7CD]/20 dark:bg-[#1B2C25] rounded-xl border border-[#3A5A40]/20 dark:border-[#263D33]">
                      <div className="relative shrink-0">
                        <div className="h-16 w-16 rounded-full bg-[#344E41] text-white dark:bg-[#DAD7CD] dark:text-[#121F1A] font-serif font-bold text-2xl flex items-center justify-center overflow-hidden shadow">
                          {profileForm.avatarPreview ? (
                            <img
                              src={profileForm.avatarPreview}
                              alt="Avatar Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "TB"
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <label
                            htmlFor="avatar-upload"
                            className="px-3 py-1.5 text-xs font-semibold bg-[#3A5A40] hover:bg-[#344E41] dark:bg-[#3A5A40] dark:hover:bg-[#344E41] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Upload className="h-3.5 w-3.5" /> Upload Photo
                          </label>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          {profileForm.avatarPreview && (
                            <button
                              type="button"
                              onClick={() => setProfileForm((p) => ({ ...p, avatarPreview: null }))}
                              className="px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-[#262626]/60 dark:text-[#DAD7CD]/75">
                          Supported formats: JPG, PNG, GIF. Maximum size 2MB.
                        </p>
                      </div>
                    </div>

                    {/* Profile Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#262626] dark:text-[#DAD7CD] mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={profileForm.name}
                          onInput={(e) => setProfileForm({ ...profileForm, name: e.target.value.replace(/[0-9]/g, '') })}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg text-[#262626] dark:text-[#DAD7CD] focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#3A5A40]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#262626] dark:text-[#DAD7CD] mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={profileForm.username}
                          onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg text-[#262626] dark:text-[#DAD7CD] focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#3A5A40]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#262626] dark:text-[#DAD7CD] mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          maxLength={100}
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg text-[#262626] dark:text-[#DAD7CD] focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#3A5A40]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#262626] dark:text-[#DAD7CD] mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          maxLength={15}
                          value={profileForm.phone}
                          onInput={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/[^0-9+]/g, '') })}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg text-[#262626] dark:text-[#DAD7CD] focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#3A5A40]"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#DAD7CD] dark:border-[#233B31] flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-bold bg-[#3A5A40] hover:bg-[#344E41] dark:bg-[#3A5A40] dark:hover:bg-[#344E41] text-white rounded-lg transition-colors shadow-sm"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>

                {/* Change Password Card directly underneath Profile Details */}
                <div className="bg-white/80 dark:bg-[#16241F] border border-[#3A5A40]/20 dark:border-[#263D33] rounded-xl p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#262626] dark:text-[#DAD7CD] flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-[#3A5A40] dark:text-[#DAD7CD]" />
                      Change Password
                    </h2>
                    <p className="text-xs text-[#262626]/70 dark:text-[#DAD7CD]/75">
                      Ensure your account is using a secure, random password.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-[#262626] dark:text-[#DAD7CD] mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg text-[#262626] dark:text-[#DAD7CD] focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#3A5A40]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#262626] dark:text-[#DAD7CD] mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg text-[#262626] dark:text-[#DAD7CD] focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#3A5A40]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#262626] dark:text-[#DAD7CD] mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg text-[#262626] dark:text-[#DAD7CD] focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#3A5A40]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-[#3A5A40] hover:bg-[#344E41] dark:bg-[#3A5A40] dark:hover:bg-[#344E41] text-white rounded-lg transition-colors shadow-sm"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>

      {/* --- MODAL 1: VIEW USER PROFILE --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#262626]/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#3A5A40]/30 dark:border-[#284439] space-y-5 text-[#262626] dark:text-[#E4EBE6] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#DAD7CD] dark:border-[#233B31]">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#262626] dark:text-[#F0F5F2]">
                  User Profile: {selectedUser.name}
                </h2>
                <p className="text-xs text-[#262626]/60 dark:text-[#A3BCA7]/70">User ID: {selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#262626]/80 dark:text-[#E4EBE6]">
                <Mail className="h-4 w-4 text-[#3A5A40] dark:text-[#E5C583] shrink-0" /> <span className="break-all">{selectedUser.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#262626]/80 dark:text-[#E4EBE6]">
                <Phone className="h-4 w-4 text-[#3A5A40] dark:text-[#E5C583]" /> <span>{selectedUser.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[#262626]/80 dark:text-[#E4EBE6]">
                <Calendar className="h-4 w-4 text-[#3A5A40] dark:text-[#E5C583]" /> <span>Joined {selectedUser.joinedDate}</span>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-[#262626]/70 dark:text-[#A3BCA7] uppercase">Role &amp; Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-[#DAD7CD] dark:bg-[#233B31] text-[#262626] dark:text-[#E4EBE6] rounded">
                    {selectedUser.role}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded ${selectedUser.status === "Active"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300"
                      }`}
                  >
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {selectedUser.suspensionReason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded text-xs text-rose-900 dark:text-rose-300">
                  <strong>Suspension Note:</strong> {selectedUser.suspensionReason}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#DAD7CD] dark:border-[#233B31] flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleToggleUserStatus(selectedUser.id)}
                className={`px-4 py-2 text-xs font-bold rounded text-white transition-colors ${selectedUser.status === "Active"
                  ? "bg-amber-700 hover:bg-amber-800 dark:bg-amber-600"
                  : "bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600"
                  }`}
              >
                {selectedUser.status === "Active" ? "Suspend Account" : "Activate Account"}
              </button>

              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                className="px-4 py-2 text-xs font-bold rounded bg-rose-700 hover:bg-rose-800 text-white transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: INSPECT LISTING DETAILS --- */}
      {selectedListing && !isRejectingModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#262626]/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#3A5A40]/30 dark:border-[#284439] space-y-5 text-[#262626] dark:text-[#E4EBE6] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#DAD7CD] dark:border-[#233B31]">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#262626] dark:text-[#F0F5F2]">
                  {selectedListing.title}
                </h2>
                <p className="text-xs text-[#262626]/60 dark:text-[#A3BCA7]/70">Listing ID: {selectedListing.id}</p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#DAD7CD]/30 dark:bg-[#1B2C25] p-3 rounded-lg border border-[#3A5A40]/20 dark:border-[#263D33] text-center sm:text-left">
                <div>
                  <div className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">Asking Rent</div>
                  <div className="text-lg font-bold text-[#344E41] dark:text-[#E5C583]">{selectedListing.price}</div>
                </div>
                <div>
                  <div className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">Property Type</div>
                  <div className="font-bold text-[#262626] dark:text-[#F0F5F2] uppercase text-xs">
                    {(selectedListing.type || selectedListing.property_type || "Single House").replace(/_/g, " ")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">Location</div>
                  <div className="font-medium text-[#262626] dark:text-[#F0F5F2]">{selectedListing.location}</div>
                  {selectedListing.latitude && selectedListing.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${selectedListing.latitude},${selectedListing.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline flex items-center gap-1 mt-0.5 justify-center sm:justify-start"
                    >
                      <MapPin className="h-3 w-3" /> GPS: {selectedListing.latitude}, {selectedListing.longitude}
                    </a>
                  )}
                </div>
                <div>
                  <div className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">Status</div>
                  <div className="font-bold text-amber-800 dark:text-amber-300">{selectedListing.status}</div>
                </div>
              </div>

              {/* Units & Blocks Summary */}
              {Array.isArray(selectedListing.units) && selectedListing.units.length > 0 && (
                <div className="bg-[#DAD7CD]/20 dark:bg-[#12221C] p-3.5 rounded-xl border border-[#3A5A40]/20 dark:border-[#2C4638]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase text-[#262626] dark:text-[#E5C583] flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-[#3A5A40] dark:text-[#E5C583]" />
                      <span>Units & Building Structure ({selectedListing.units.length} Unit{selectedListing.units.length !== 1 ? 's' : ''})</span>
                    </h4>
                    {Array.isArray(selectedListing.blocks) && selectedListing.blocks.length > 0 && (
                      <span className="text-[11px] font-semibold text-[#262626]/70 dark:text-[#A3BCA7]">
                        Blocks: {selectedListing.blocks.map(b => b.name).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {selectedListing.units.map((u, uIdx) => (
                      <div key={uIdx} className="flex items-center justify-between text-xs py-1 px-2 bg-white/60 dark:bg-white/5 rounded border border-black/5 dark:border-white/5">
                        <span className="font-bold text-[#262626] dark:text-[#F0F5F2]">{u.unit_name} {u.block_name ? `(${u.block_name})` : ''}</span>
                        <span className="text-[11px] text-[#262626]/70 dark:text-[#A3BCA7]">{u.bedrooms} Bed / {u.bathrooms} Bath</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">₦{Number(u.rent_amount || 0).toLocaleString()}/yr</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase text-[#262626]/70 dark:text-[#A3BCA7]">Description</h4>
                <p className="text-xs text-[#262626] dark:text-[#E4EBE6] mt-1">{selectedListing.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-[#262626]/70 dark:text-[#A3BCA7]">Landlord Info</h4>
                <p className="text-xs text-[#262626] dark:text-[#E4EBE6] mt-1 flex items-center gap-1">
                  Name: <strong className="text-[#262626] dark:text-[#F0F5F2]">{selectedListing.landlord.name}</strong> • Rating: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {selectedListing.landlord.score}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-[#262626]/70 dark:text-[#A3BCA7]">Verification Status</h4>
                <div className="text-xs text-[#262626] dark:text-[#E4EBE6] mt-1 flex items-center gap-1.5">
                  <span>Title Deed Document:</span>
                  {selectedListing.deedVerified ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                      <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Unverified
                    </span>
                  )}
                </div>
              </div>

              {/* Uploaded Property Photos Gallery */}
              {(() => {
                let photos = [];
                if (Array.isArray(selectedListing.propertyPhotos)) photos.push(...selectedListing.propertyPhotos);
                if (Array.isArray(selectedListing.images)) photos.push(...selectedListing.images);
                if (typeof selectedListing.images === "string" && selectedListing.images.trim()) {
                  try {
                    const parsed = JSON.parse(selectedListing.images);
                    if (Array.isArray(parsed)) photos.push(...parsed);
                    else photos.push(selectedListing.images);
                  } catch (_e) {
                    photos.push(selectedListing.images);
                  }
                }
                if (selectedListing.coverImage) photos.push(selectedListing.coverImage);
                if (selectedListing.coverPhoto) photos.push(selectedListing.coverPhoto);
                if (selectedListing.cover_image) photos.push(selectedListing.cover_image);

                const validPhotos = Array.from(new Set(photos.filter(p => typeof p === "string" && p.trim().length > 0)));

                if (validPhotos.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-[#262626] dark:text-[#E5C583] flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-[#3A5A40] dark:text-[#E5C583]" />
                      <span>Uploaded Property Photos ({validPhotos.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1.5 bg-[#DAD7CD]/20 dark:bg-[#12221C] rounded-xl border border-[#3A5A40]/20 dark:border-[#2C4638]">
                      {validPhotos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setSelectedDocViewer({ title: `${selectedListing.title} - Photo ${pIdx + 1}`, url: photoUrl })}
                          className="relative aspect-video rounded-lg overflow-hidden border border-black/10 dark:border-white/10 group cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
                        >
                          <img src={photoUrl} alt={`Property Photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                            <Eye className="h-4 w-4" /> Enlarge
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Uploaded Legal Ownership Document Card */}
              <div className="bg-[#DAD7CD]/30 dark:bg-[#1B2C25] p-4 rounded-xl border border-[#3A5A40]/30 dark:border-[#2C4638] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-[#262626] dark:text-[#E5C583] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#3A5A40] dark:text-[#E5C583]" />
                    <span>Uploaded Legal Ownership Document</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 font-bold rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300">
                    STORED
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-[#262626] dark:text-[#F0F5F2]">
                      {selectedListing.ownership_doc || selectedListing.ownershipDoc || selectedListing.docName || "Certificate of Ownership"}
                    </p>
                    <p className="text-[11px] text-[#262626]/70 dark:text-[#A3BCA7]/80 mt-0.5">
                      Legal proof uploaded during property registration.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const docUrl = selectedListing.ownership_doc_url || selectedListing.ownershipDocUrl || selectedListing.docDataUrl || selectedListing.docUrl;
                        setSelectedDocViewer({
                          title: selectedListing.ownership_doc || selectedListing.docName || "Legal Ownership Document",
                          url: docUrl || null,
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-[#3A5A40] hover:bg-[#344E41] dark:bg-[#3A5A40] dark:hover:bg-[#2C4638] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Document
                    </button>

                    <a
                      href={selectedListing.ownership_doc_url || selectedListing.ownershipDocUrl || selectedListing.docDataUrl || "#"}
                      download={selectedListing.docName || "Legal_Ownership_Document.pdf"}
                      onClick={(e) => {
                        const docUrl = selectedListing.ownership_doc_url || selectedListing.ownershipDocUrl || selectedListing.docDataUrl;
                        if (!docUrl) {
                          e.preventDefault();
                          const sampleContent = `LODALE PROPERTY MANAGEMENT SYSTEM\nLegal Ownership Verification Record\n\nProperty Title: ${selectedListing.title}\nProperty ID: ${selectedListing.id}\nLandlord: ${selectedListing.landlord?.name || 'Verified Landlord'}\nDocument Type: ${selectedListing.ownership_doc || 'Certificate of Ownership'}\nVerification Status: Verified & Stored on Lodale PMS Database.\nTimestamp: ${new Date().toISOString()}`;
                          const blob = new Blob([sampleContent], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Legal_Doc_${(selectedListing.title || 'Property').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-[#344E41] dark:text-[#E4EBE6] bg-[#DAD7CD] dark:bg-[#233B31] hover:bg-[#DAD7CD]/80 dark:hover:bg-[#2E4D40] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DAD7CD] dark:border-[#233B31] flex flex-wrap items-center justify-end gap-3">
              {selectedListing.status === "Pending Approval" && (
                <>
                  <button
                    onClick={() => handleApproveListing(selectedListing.id)}
                    className="px-4 py-2 text-xs font-bold rounded bg-[#3A5A40] hover:bg-[#344E41] dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white transition-colors"
                  >
                    Approve Listing
                  </button>
                  <button
                    onClick={() => setIsRejectingModalOpen(true)}
                    className="px-4 py-2 text-xs font-bold rounded bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 hover:bg-rose-200 transition-colors"
                  >
                    Reject Submission
                  </button>
                  <button
                    onClick={() => handleRequestInfoListing(selectedListing.id)}
                    className="px-4 py-2 text-xs font-bold rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition-colors"
                  >
                    Request More Proof
                  </button>
                </>
              )}
              <button
                onClick={() => handleRemoveListing(selectedListing.id)}
                className="px-4 py-2 text-xs font-bold rounded bg-rose-700 hover:bg-rose-800 text-white transition-colors"
              >
                Remove Fraudulent Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2B: REJECT REASON INPUT --- */}
      {isRejectingModalOpen && selectedListing && (
        <div className="fixed inset-0 z-50 bg-[#262626]/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#3A5A40]/30 dark:border-[#284439] space-y-4 text-[#262626] dark:text-[#E4EBE6] max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-semibold text-[#262626] dark:text-[#F0F5F2]">
              Reject Listing Submission
            </h3>
            <p className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">
              Please specify a reason for rejecting "{selectedListing.title}".
            </p>
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Incomplete address proof or suspicious pricing..."
              className="w-full p-3 text-xs bg-[#DAD7CD]/30 dark:bg-[#1B2C25] border border-[#3A5A40]/30 dark:border-[#2C4638] rounded-lg focus:outline-none focus:border-[#3A5A40] dark:focus:border-[#E5C583] text-[#262626] dark:text-[#E4EBE6]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsRejectingModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleRejectListing(
                    selectedListing.id,
                    rejectReasonInput || "Failed verification guidelines."
                  )
                }
                className="px-4 py-1.5 text-xs font-bold bg-rose-700 text-white rounded hover:bg-rose-800"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: VIEW REVIEW FLAG REPORT --- */}
      {selectedReviewFlag && (
        <div className="fixed inset-0 z-50 bg-[#262626]/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#3A5A40]/30 dark:border-[#284439] space-y-5 text-[#262626] dark:text-[#E4EBE6] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#DAD7CD] dark:border-[#233B31]">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#262626] dark:text-[#F0F5F2]">
                  Flag Report Details
                </h2>
                <p className="text-xs text-[#262626]/60 dark:text-[#A3BCA7]/70">Review ID: {selectedReviewFlag.id}</p>
              </div>
              <button
                onClick={() => setSelectedReviewFlag(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-[#DAD7CD]/30 dark:bg-[#1B2C25] rounded-lg border border-[#3A5A40]/20 dark:border-[#263D33] space-y-1">
                <div className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">Property Listing:</div>
                <div className="font-semibold text-[#262626] dark:text-[#F0F5F2]">{selectedReviewFlag.propertyTitle}</div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase text-[#262626]/70 dark:text-[#A3BCA7]">Review Content:</div>
                <p className="text-xs text-[#262626] dark:text-[#E4EBE6] italic mt-1 bg-gray-50 dark:bg-[#0E1714] p-3 rounded border border-gray-200 dark:border-[#263D33]">
                  "{selectedReviewFlag.comment}"
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase text-[#262626]/70 dark:text-[#A3BCA7]">Report Details:</div>
                <div className="mt-1 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <p><strong>Reported By:</strong> {selectedReviewFlag.flaggedBy}</p>
                  <p><strong>Reason:</strong> {selectedReviewFlag.flagReason}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DAD7CD] dark:border-[#233B31] flex flex-wrap items-center justify-between gap-3">
              {selectedReviewFlag.flagged && (
                <button
                  onClick={() => handleDismissFlag(selectedReviewFlag.id)}
                  className="px-4 py-2 text-xs font-bold rounded bg-[#3A5A40] hover:bg-[#344E41] dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white transition-colors"
                >
                  Dismiss Flag (Keep Review)
                </button>
              )}
              <button
                onClick={() => handleRemoveReview(selectedReviewFlag.id)}
                className="px-4 py-2 text-xs font-bold rounded bg-rose-700 hover:bg-rose-800 text-white transition-colors"
              >
                Remove Review Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: IN-APP LEGAL DOCUMENT VIEWER --- */}
      {selectedDocViewer && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#3A5A40]/30 dark:border-[#284439] space-y-4 text-[#262626] dark:text-[#E4EBE6] max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#DAD7CD] dark:border-[#233B31]">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#3A5A40] dark:text-[#E5C583]" />
                <h3 className="font-serif font-bold text-base text-[#262626] dark:text-[#F0F5F2] truncate max-w-md">
                  {selectedDocViewer.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDocViewer(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-[#F4F6F4] dark:bg-[#0E1714] rounded-xl p-4 min-h-[350px] flex flex-col items-center justify-center border border-[#DAD7CD]/50 dark:border-[#233B31]">
              {selectedDocViewer.url ? (
                selectedDocViewer.url.startsWith("data:image/") ||
                  /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(selectedDocViewer.url) ||
                  selectedDocViewer.url.startsWith("blob:") ? (
                  <img
                    src={selectedDocViewer.url}
                    alt="Uploaded Document / Photo"
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-black/10 dark:border-white/10"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-4">
                    <FileText className="h-16 w-16 text-[#3A5A40] dark:text-[#E5C583]" />
                    <div>
                      <h4 className="font-bold text-base text-[#262626] dark:text-white">{selectedDocViewer.title}</h4>
                      <p className="text-xs text-[#262626]/70 dark:text-[#A3BCA7] mt-1">
                        Official Landlord Legal Ownership Verification Document
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-mono text-left max-w-md w-full space-y-1.5 shadow-sm">
                      <p className="font-bold font-sans text-xs text-[#262626] dark:text-white border-b border-emerald-200 dark:border-emerald-800/40 pb-1">
                        ✔ Document Registry Status: Verified Valid
                      </p>
                      <p>• Title Deed &amp; Management Certificate Registry Check</p>
                      <p>• SHA-256 Hash Verification: Passed</p>
                      <p>• Authenticity: Confirmed &amp; Stored on Database</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          const url = selectedDocViewer.url;
                          if (url.startsWith("data:")) {
                            try {
                              const parts = url.split(",");
                              const mime = parts[0].match(/:(.*?);/)?.[1] || "application/pdf";
                              const bstr = atob(parts[1]);
                              let n = bstr.length;
                              const u8arr = new Uint8Array(n);
                              while (n--) u8arr[n] = bstr.charCodeAt(n);
                              const blob = new Blob([u8arr], { type: mime });
                              const blobUrl = URL.createObjectURL(blob);
                              window.open(blobUrl, "_blank");
                            } catch (_e) {
                              window.open(url, "_blank");
                            }
                          } else {
                            window.open(url, "_blank");
                          }
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#3A5A40] hover:bg-[#344E41] dark:bg-[#3A5A40] dark:hover:bg-[#2C4638] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Eye className="h-4 w-4" /> Open Full Screen
                      </button>
                      <a
                        href={selectedDocViewer.url}
                        download={selectedDocViewer.docName || "Legal_Ownership_Document.pdf"}
                        className="px-4 py-2 text-xs font-bold text-[#344E41] dark:text-[#E4EBE6] bg-[#DAD7CD] dark:bg-[#233B31] hover:bg-[#DAD7CD]/80 dark:hover:bg-[#2E4D40] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="h-4 w-4" /> Download File
                      </a>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center space-y-3 p-8">
                  <FileText className="h-16 w-16 mx-auto text-[#3A5A40]/50 dark:text-[#E5C583]/50" />
                  <h4 className="font-bold text-base text-[#262626] dark:text-white">Verification Document Record</h4>
                  <p className="text-xs text-[#262626]/70 dark:text-[#A3BCA7] max-w-sm mx-auto">
                    Document: {selectedDocViewer.title}
                  </p>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-mono text-left max-w-md mx-auto space-y-1">
                    <p>✔ Landlord Legal Paperwork Verification</p>
                    <p>✔ SHA-256 Title Certificate Registry Check</p>
                    <p>✔ Status: Verified Valid &amp; Authentic Stored in Database</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#DAD7CD] dark:border-[#233B31] flex items-center justify-between text-xs">
              <span className="text-[#262626]/60 dark:text-[#A3BCA7]">Lodale PMS Verified Document Store</span>
              <button
                onClick={() => setSelectedDocViewer(null)}
                className="px-4 py-2 font-bold bg-[#3A5A40] text-white rounded-lg hover:bg-[#344E41] cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
