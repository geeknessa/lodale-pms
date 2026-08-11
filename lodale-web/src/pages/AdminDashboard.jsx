import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { adminService } from "../services/adminService";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquareWarning,
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
  Menu
} from "lucide-react";

// --- MOCK INITIAL DATA ---
const INITIAL_USERS = [
  {
    id: "usr-101",
    name: "Emeka Nwankwo",
    email: "emeka.n@example.com",
    phone: "+234 803 123 4567",
    role: "Landlord",
    status: "Active",
    joinedDate: "2025-11-14",
    listingsCount: 3,
    verifications: ["ID Verified", "Phone Verified"],
  },
  {
    id: "usr-102",
    name: "Amina Bello",
    email: "amina.bello@example.com",
    phone: "+234 802 987 6543",
    role: "Tenant",
    status: "Active",
    joinedDate: "2026-01-09",
    listingsCount: 0,
    verifications: ["Phone Verified"],
  },
  {
    id: "usr-103",
    name: "Victor Ogunleye",
    email: "victor.og@example.com",
    phone: "+234 814 555 0192",
    role: "Landlord",
    status: "Suspended",
    joinedDate: "2025-08-22",
    listingsCount: 1,
    verifications: ["ID Pending"],
    suspensionReason: "Multiple reports of non-responsive communication and incomplete listing information.",
  },
  {
    id: "usr-104",
    name: "Grace Kalu",
    email: "gkalu@example.com",
    phone: "+234 701 444 8811",
    role: "Tenant",
    status: "Active",
    joinedDate: "2026-02-18",
    listingsCount: 0,
    verifications: ["ID Verified", "Email Verified"],
  },
  {
    id: "usr-105",
    name: "Tunde Bakare",
    email: "tunde.b@lodale.com",
    phone: "+234 809 333 2211",
    role: "Admin",
    status: "Active",
    joinedDate: "2025-05-01",
    listingsCount: 0,
    verifications: ["Admin Verified"],
  },
  {
    id: "usr-106",
    name: "Chidinma Eze",
    email: "ceze.properties@example.com",
    phone: "+234 812 777 9900",
    role: "Landlord",
    status: "Active",
    joinedDate: "2026-03-02",
    listingsCount: 2,
    verifications: ["ID Verified", "Phone Verified"],
  },
];

const INITIAL_LISTINGS = [
  {
    id: "lst-201",
    title: "Oakwood Heights, Luxury 2BR",
    location: "Yaba, Lagos",
    price: "₦2,200,000/yr",
    type: "Apartment",
    status: "Pending Approval",
    submittedAt: "2026-07-22T14:30:00Z",
    landlord: { id: "usr-106", name: "Chidinma Eze", score: 4.9 },
    description:
      "Fully serviced 2-bedroom apartment with prepaid meter, constant water supply, and top-tier security.",
    amenities: ["Prepaid Meter", "Borehole", "24/7 Security", "Balcony"],
    deedVerified: true,
  },
  {
    id: "lst-202",
    title: "Skyline Tower, Studio Flat 4B",
    location: "Victoria Island, Lagos",
    price: "₦3,800,000/yr",
    type: "Studio",
    status: "Pending Approval",
    submittedAt: "2026-07-23T08:15:00Z",
    landlord: { id: "usr-101", name: "Emeka Nwankwo", score: 4.7 },
    description:
      "Modern minimalist studio with panoramic ocean view. Includes backup generator and underground parking.",
    amenities: ["Backup Generator", "Elevator", "Security", "Fiber Internet"],
    deedVerified: true,
  },
  {
    id: "lst-203",
    title: "Lekki Phase 1 Prime Villa",
    location: "Lekki Phase 1, Lagos",
    price: "₦5,500,000/yr",
    type: "Duplex",
    status: "Live",
    submittedAt: "2026-06-10T10:00:00Z",
    landlord: { id: "usr-101", name: "Emeka Nwankwo", score: 4.8 },
    description:
      "Spacious 4-bedroom terrace duplex in a serene gated estate with swimming pool access.",
    amenities: ["Swimming Pool", "Gated Security", "Parking", "Prepaid Meter"],
    deedVerified: true,
  },
  {
    id: "lst-204",
    title: "Unverified Cheap Self-Contain",
    location: "Ikeja, Lagos",
    price: "₦350,000/yr",
    type: "Self Contain",
    status: "Pending Approval",
    submittedAt: "2026-07-23T06:45:00Z",
    landlord: { id: "usr-103", name: "Victor Ogunleye", score: 3.2 },
    description:
      "Very cheap self contain near transport hub. Immediate move-in available.",
    amenities: ["Water"],
    deedVerified: false,
    fraudWarning: "Price is suspiciously lower than area average. Landlord account currently suspended.",
  },
  {
    id: "lst-205",
    title: "Greenwich Estate 3-Bed Flat",
    location: "Surulere, Lagos",
    price: "₦1,900,000/yr",
    type: "Apartment",
    status: "Live",
    submittedAt: "2026-05-18T12:00:00Z",
    landlord: { id: "usr-106", name: "Chidinma Eze", score: 4.9 },
    description: "Quiet residential flat close to schools and shopping centers.",
    amenities: ["Borehole", "Prepaid Meter"],
    deedVerified: true,
  },
];

const INITIAL_REVIEWS = [
  {
    id: "rev-301",
    authorName: "Amina Bello",
    authorId: "usr-102",
    propertyTitle: "Lekki Phase 1 Prime Villa",
    listingId: "lst-203",
    rating: 1,
    comment:
      "This listing posted fake photos! Water was leaking everywhere and landlord demanded cash outside the platform.",
    submittedAt: "2026-07-23T07:20:00Z",
    flagged: true,
    flaggedBy: "Emeka Nwankwo (Landlord)",
    flagReason: "Landlord claims tenant left false retaliatory review after deposit dispute.",
    status: "Flagged",
  },
  {
    id: "rev-302",
    authorName: "Grace Kalu",
    authorId: "usr-104",
    propertyTitle: "Greenwich Estate 3-Bed Flat",
    listingId: "lst-205",
    rating: 5,
    comment:
      "Wonderful stay! Landlord Chidinma was extremely helpful and the apartment matched all photos.",
    submittedAt: "2026-07-21T18:00:00Z",
    flagged: false,
    status: "Approved",
  },
  {
    id: "rev-303",
    authorName: "Anonymous Spammer",
    authorId: "usr-999",
    propertyTitle: "Skyline Tower, Studio Flat 4B",
    listingId: "lst-202",
    rating: 1,
    comment:
      "DO NOT RENT! Call +23480000000 to get free loans and crypto deals today!",
    submittedAt: "2026-07-22T21:10:00Z",
    flagged: true,
    flaggedBy: "System Auto-Mod",
    flagReason: "Spam content and external phone number advertisement detected.",
    status: "Flagged",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active top tab: 'overview' | 'users' | 'listings' | 'reviews' | 'settings'
  const [activeTab, setActiveTab] = useState("overview");

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
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("sessionExpiresAt");
    localStorage.setItem("explicitAdminSignOut", "true");
    navigate("/admin/login", { replace: true });
  };

  // Dynamic state for core modules
  const [users, setUsers] = useState(INITIAL_USERS);
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [selectedDocViewer, setSelectedDocViewer] = useState(null);

  useEffect(() => {
    async function loadAdminData() {
      // 1. Load Pending / Local Properties from API + LocalStorage scan
      let apiPending = [];
      try {
        apiPending = await adminService.getPendingProperties();
      } catch (err) {
        console.warn("Backend API offline fallback:", err);
      }

      let localProps = [];
      try {
        const saved = localStorage.getItem("properties");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) localProps.push(...parsed);
        }
      } catch (_err) {}

      // Scan localStorage for any extra property key
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key !== "properties" && (key.startsWith("properties_") || key.startsWith("landlordProperties_") || key.includes("property"))) {
            if (key === "propertyTenants") continue;
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                localProps.push(...parsed);
              } else if (parsed && parsed.id && parsed.title) {
                localProps.push(parsed);
              }
            }
          }
        }
      } catch (_err) {}

      setListings((prev) => {
        const existingMap = new Map(prev.map(l => [l.id, l]));

        localProps.forEach((p) => {
          if (!p || !p.id) return;
          const formattedProp = {
            ...p,
            status: p.status === 'pending_review' ? 'Pending Approval' : (p.status || 'Pending Approval'),
            ownershipDoc: p.ownership_doc || p.ownershipDoc || 'Deed of Assignment',
            ownershipDocUrl: p.ownership_doc_url || p.ownershipDocUrl || p.docDataUrl,
            docName: p.docName || p.ownership_doc || 'Legal_Document.pdf',
            docDataUrl: p.docDataUrl || p.ownership_doc_url,
            deedVerified: true,
            type: p.property_type || p.type || 'Apartment',
            rent: p.price || (p.rent_amount ? formatCurrency(p.rent_amount, "/yr") : '₦2,500,000/yr'),
            landlord: p.landlord || { name: 'Verified Landlord', score: 5.0, reviews: 1 }
          };
          existingMap.set(p.id, formattedProp);
        });

        apiPending.forEach((p) => {
          if (!p || !p.id) return;
          const formattedProp = {
            ...p,
            status: 'Pending Approval',
            ownershipDoc: p.ownershipDoc || p.ownership_doc || 'Deed of Assignment',
            ownershipDocUrl: p.ownershipDocUrl || p.ownership_doc_url,
            docName: p.docName || p.ownership_doc || 'Legal_Document.pdf',
            docDataUrl: p.docDataUrl || p.ownership_doc_url,
            deedVerified: true,
            type: p.property_type || 'Apartment',
            rent: formatCurrency(p.rent_amount || 2500000, "/yr"),
            landlord: p.landlord || { name: 'Verified Landlord', score: 5.0, reviews: 1 }
          };
          existingMap.set(p.id, formattedProp);
        });

        return Array.from(existingMap.values());
      });

      // 2. Load Registered Users from Backend API + LocalStorage Scan
      let apiUsers = [];
      try {
        apiUsers = await adminService.getUsers();
      } catch (err) {
        console.warn("Backend API users fallback:", err);
      }

      // Collect all users from localStorage (registeredUsers array + registeredUser_* keys + userProfile_* keys)
      let localUsers = [];
      try {
        const savedUsers = localStorage.getItem("registeredUsers");
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed)) localUsers.push(...parsed);
        }
      } catch (_e) {}

      // Scan localStorage for any registeredUser_, userProfile_, or username_ key
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            if (key.startsWith("registeredUser_") || key.startsWith("userProfile_")) {
              const raw = localStorage.getItem(key);
              if (raw) {
                const uObj = JSON.parse(raw);
                if (uObj && (uObj.email || key.includes("@"))) {
                  localUsers.push({
                    email: uObj.email || key.replace(/^registeredUser_|^userProfile_/, ""),
                    name: uObj.name || uObj.username || `${uObj.firstName || ""} ${uObj.lastName || ""}`.trim() || uObj.email,
                    phone: uObj.phone || uObj.profile?.phone || "",
                    role: uObj.role || uObj.profile?.role || "Tenant",
                    id: uObj.id
                  });
                }
              }
            } else if (key.startsWith("username_")) {
              const uEmail = key.replace("username_", "").trim();
              const uName = localStorage.getItem(key);
              if (uEmail && uEmail.includes("@")) {
                localUsers.push({
                  email: uEmail,
                  name: uName || uEmail,
                  role: "Tenant"
                });
              }
            }
          }
        }
      } catch (_e) {}

      // Scan propertyTenants map for tenants registered by landlords
      try {
        const savedPropTenants = localStorage.getItem("propertyTenants");
        if (savedPropTenants) {
          const parsedObj = JSON.parse(savedPropTenants);
          Object.values(parsedObj).flat().forEach((t) => {
            if (t && (t.email || t.name)) {
              localUsers.push({
                email: t.email || `${t.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@tenant.lodale.com`,
                name: t.name,
                phone: t.phone || "",
                role: "Tenant",
                id: t.id
              });
            }
          });
        }
      } catch (_e) {}

      const activeUsername = localStorage.getItem("username");
      const activeEmail = localStorage.getItem("lastLoggedInEmail");
      const activeRole = localStorage.getItem("userRole");

      setUsers((prev) => {
        const existingMap = new Map(prev.map((u) => [u.email?.toLowerCase(), u]));

        // Add users fetched from Database API
        apiUsers.forEach((u) => {
          if (u && u.email) {
            existingMap.set(u.email.toLowerCase(), u);
          }
        });

        // Add from localUsers list
        localUsers.forEach((r) => {
          if (r && r.email) {
            const emailKey = r.email.toLowerCase();
            const userRole = (r.role || r.profile?.role || "Tenant").toLowerCase();
            const formattedRole = userRole.includes("landlord") ? "Landlord" : (userRole.includes("admin") ? "Admin" : "Tenant");
            const nameStr = r.name || r.username || (r.profile ? `${r.profile.firstName || ''} ${r.profile.lastName || ''}`.trim() : null) || "Registered User";

            if (!existingMap.has(emailKey)) {
              existingMap.set(emailKey, {
                id: r.id || "usr-" + Math.floor(Math.random() * 100000),
                name: nameStr,
                email: r.email,
                phone: r.phone || r.profile?.phone || "",
                role: formattedRole,
                status: "Active",
                joinedDate: new Date().toISOString().split("T")[0],
                listingsCount: formattedRole === "Landlord" ? 1 : 0,
                verifications: ["ID Verified", "Email Verified"],
              });
            } else {
              const existing = existingMap.get(emailKey);
              if (nameStr && nameStr !== "Registered User" && existing.name === "Registered User") {
                existing.name = nameStr;
              }
              if (r.phone && !existing.phone) {
                existing.phone = r.phone;
              }
            }
          }
        });

        // Add active logged in user if not present
        if (activeEmail && !existingMap.has(activeEmail.toLowerCase())) {
          const formattedRole = (activeRole || "landlord").toLowerCase().includes("landlord") ? "Landlord" : "Tenant";
          existingMap.set(activeEmail.toLowerCase(), {
            id: "usr-" + Math.floor(Math.random() * 100000),
            name: activeUsername || "Verified Landlord",
            email: activeEmail,
            phone: "",
            role: formattedRole,
            status: "Active",
            joinedDate: new Date().toISOString().split("T")[0],
            listingsCount: formattedRole === "Landlord" ? 1 : 0,
            verifications: ["ID Verified", "Phone Verified"],
          });
        }

        // Check landlord names in localProps
        localProps.forEach((p) => {
          const lName = p.landlord?.name || activeUsername || "Landlord User";
          const mockEmail = lName.toLowerCase().replace(/[^a-z0-9]+/g, ".") + "@lodale.com";
          if (!existingMap.has(mockEmail)) {
            existingMap.set(mockEmail, {
              id: "usr-l-" + Math.floor(Math.random() * 10000),
              name: lName,
              email: mockEmail,
              phone: "",
              role: "Landlord",
              status: "Active",
              joinedDate: new Date().toISOString().split("T")[0],
              listingsCount: 1,
              verifications: ["ID Verified", "Title Proof Attached"],
            });
          }
        });

        return Array.from(existingMap.values());
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
    name: "Tunde Bakare",
    username: "tundebakare_admin",
    email: "tunde.b@lodale.com",
    phone: "+234 809 333 2211",
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
  const handleToggleUserStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === "Active" ? "Suspended" : "Active";
          showToast(`User ${u.name} is now ${newStatus}.`);
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
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev
          ? {
            ...prev,
            status: prev.status === "Active" ? "Suspended" : "Active",
          }
          : null
      );
    }
  };

  const handleDeleteUser = (userId) => {
    const target = users.find((u) => u.id === userId);
    if (
      window.confirm(
        `Are you sure you want to permanently delete user "${target?.name}"?`
      )
    ) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`User ${target?.name} deleted.`);
      if (selectedUser?.id === userId) setSelectedUser(null);
    }
  };

  const handleApproveListing = async (listingId) => {
    try {
      await adminService.reviewProperty(listingId, "approve");
    } catch (e) {
      console.warn("API review approval warning:", e);
    }
    setListings((prev) =>
      prev.map((l) => {
        if (l.id === listingId) {
          return { ...l, status: "Live" };
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
          p.id === listingId ? { ...p, status: "active_vacant" } : p
        );
        localStorage.setItem("properties", JSON.stringify(updated));
      }
    } catch (_err) {}

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
      window.dispatchEvent(new Event("storage"));
    } catch (_err) {}

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
    } catch (_err) {}

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
    } catch (_err) {}

    showToast(`Listing "${propertyTitle}" rejected.`);
    setIsRejectingModalOpen(false);
    setRejectReasonInput("");
    if (selectedListing?.id === listingId) {
      setSelectedListing((prev) =>
        prev ? { ...prev, status: "Rejected", rejectionReason: reason } : null
      );
    }
  };

  const handleRemoveListing = (listingId) => {
    const item = listings.find((l) => l.id === listingId);
    if (
      window.confirm(
        `Remove fraudulent listing "${item?.title}" from platform?`
      )
    ) {
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      showToast(`Listing "${item?.title}" removed.`);
      if (selectedListing?.id === listingId) setSelectedListing(null);
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
      const matchesSearch =
        l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.location.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.landlord.name.toLowerCase().includes(listingSearch.toLowerCase());
      const matchesStatus =
        listingFilter === "All" || l.status === listingFilter;
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

              {/* 1. User Management */}
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
                  <span className="truncate">1. User Management</span>
                </div>
                <span className="text-[11px] bg-[#262626]/40 dark:bg-black/40 px-1.5 py-0.5 rounded-full text-[#DAD7CD] ml-1 shrink-0">
                  {users.length}
                </span>
              </button>

              {/* 2. Listing Oversight */}
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

              {/* 3. Review & Rating Moderation */}
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
                  <span className="truncate">3. Review Moderation</span>
                </div>
                {flaggedReviewsCount > 0 && (
                  <span className="text-[11px] bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                    {flaggedReviewsCount}
                  </span>
                )}
              </button>

              {/* My Profile */}
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${activeTab === "profile"
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

          {/* --- TAB 4: MY PROFILE (SIMPLIFIED & SINGLE PAGE) --- */}
          {activeTab === "profile" && (
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

              {/* Change Password Card */}
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
                  <div className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">Location</div>
                  <div className="font-medium text-[#262626] dark:text-[#F0F5F2]">{selectedListing.location}</div>
                </div>
                <div>
                  <div className="text-xs text-[#262626]/70 dark:text-[#A3BCA7]">Status</div>
                  <div className="font-bold text-amber-800 dark:text-amber-300">{selectedListing.status}</div>
                </div>
              </div>

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
                        const docUrl = selectedListing.ownership_doc_url || selectedListing.ownershipDocUrl || selectedListing.docDataUrl;
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
                selectedDocViewer.url.startsWith("data:image/") ? (
                  <img src={selectedDocViewer.url} alt="Legal Document" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md" />
                ) : (
                  <iframe src={selectedDocViewer.url} title="Legal Document Viewer" className="w-full h-[60vh] rounded-lg border-0" />
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
