import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  BedDouble,
  Bath,
  MapPin,
  MessageCircle,
  X,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  Sun,
  Moon,
  User
} from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import { propertyService } from "../services/propertyService";
import { triggerToast } from "../context/ToastContext";
import { formatDistanceToNow } from "../utils/formatters";
import { useTheme } from "../context/ThemeContext";
import "./TenantDashboard/TenantDashboard.css";

// Tenant sidebar strip — shown inside ListingDetail when the viewer is a logged-in tenant.
// Mirrors the icon set of TenantDashboard. Each icon navigates back to the correct dashboard tab.
function TenantSidebarStrip() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = () => {
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("sessionExpiresAt");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("tenantUsername");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("db_user_id");
    sessionStorage.removeItem("tenantCurrentProfile");
    sessionStorage.removeItem("lodale_token");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("sessionExpiresAt");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", tab: 0 },
    { icon: Search, label: "Search", tab: 1 },
    { icon: MessageSquare, label: "Chat", tab: 2 },
    { icon: Settings, label: "Settings", tab: 3 },
  ];

  return (
    <aside
      className="tenant-sidebar hidden md:flex"
      style={{ position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}
    >
      <div className="sidebar-top-group">
        {/* Logo back to home */}
        <div
          className="sidebar-logo-mark mb-6 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/explore")}
          title="Go to Home Page"
        >
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "20px", color: "#2C4633", letterSpacing: "-0.5px" }}>L</span>
        </div>

        <div className="tenant-sidebar-nav">
          {navItems.map(({ icon: Icon, label, tab }) => (
            <button
              key={tab}
              title={label}
              onClick={() => navigate("/dashboard/tenant", { state: { initialTab: tab } })}
              className="tenant-sidebar-btn"
            >
              <Icon className="h-5 w-5" />
              <span className="tenant-sidebar-tooltip">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tenant-sidebar-bottom">
        <button
          className="tenant-sidebar-btn theme-toggle-btn mb-3"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="tenant-sidebar-tooltip">Toggle Theme</span>
        </button>
        <button
          className="tenant-sidebar-btn logout-btn"
          onClick={handleSignOut}
          title="Log Out"
        >
          <LogOut className="h-5 w-5" />
          <span className="tenant-sidebar-tooltip">Log Out</span>
        </button>
      </div>
    </aside>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Detect if the current viewer is an authenticated tenant
  const isTenant = sessionStorage.getItem("userRole") === "tenant";

  // In-App Direct Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    async function fetchListing() {
      setIsLoading(true);
      try {
        const item = await propertyService.getPropertyById(id);
        if (item) {
          setListing(item);
          const savedStr = localStorage.getItem("savedProperties");
          const savedArr = savedStr ? JSON.parse(savedStr) : [];
          const isItemSaved = savedArr.some(p => String(p.id) === String(item.id));
          setIsSaved(isItemSaved);

          if (isItemSaved) {
            const updatedSaved = savedArr.map(p => {
              if (String(p.id) === String(item.id)) {
                return {
                  ...p,
                  ...item,
                  price: `₦${Number(item.rent_amount || item.price || 0).toLocaleString()}${String(item.rent_period || '').toLowerCase().includes('month') ? '/mo' : '/yr'}`,
                  location: `${item.address_line1 || item.address || ''}, ${item.city || ''}`
                };
              }
              return p;
            });
            localStorage.setItem("savedProperties", JSON.stringify(updatedSaved));
            window.dispatchEvent(new Event("propertySavedChanged"));
          }
        }
      } catch (err) {
        setListing(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  const handleToggleSave = () => {
    if (!listing) return;
    const savedStr = localStorage.getItem("savedProperties");
    const currentSaved = savedStr ? JSON.parse(savedStr) : [];
    
    if (isSaved) {
      const updated = currentSaved.filter(p => p.id !== listing.id);
      localStorage.setItem("savedProperties", JSON.stringify(updated));
      setIsSaved(false);
      triggerToast("Property removed from saved.", "info", "Removed");
    } else {
      const updated = [listing, ...currentSaved.filter(p => p.id !== listing.id)];
      localStorage.setItem("savedProperties", JSON.stringify(updated));
      setIsSaved(true);
      triggerToast("Property saved successfully!", "success", "Saved");
    }
    window.dispatchEvent(new Event("propertySavedChanged"));
  };

  if (isLoading) {
    return isTenant ? (
      <div className="tenant-wrapper" style={{ display: "flex" }}>
        <TenantSidebarStrip />
        <div className="flex-1 flex justify-center items-center text-ink-500 dark:text-cream-100/70 text-xs font-semibold min-h-screen bg-[#FDFBF7] dark:bg-[#12221C]">
          Loading listing details...
        </div>
      </div>
    ) : (
      <div className="min-h-screen bg-cream-50 dark:bg-[#12221C] flex flex-col">
        <NavBar />
        <div className="flex-1 flex justify-center items-center text-ink-500 dark:text-cream-100/70 text-xs font-semibold">
          Loading listing details...
        </div>
      </div>
    );
  }

  if (!listing) {
    return isTenant ? (
      <div className="tenant-wrapper" style={{ display: "flex" }}>
        <TenantSidebarStrip />
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 min-h-screen bg-[#FDFBF7] dark:bg-[#12221C]">
          <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-2">Listing Not Found</h2>
          <p className="text-ink-500 dark:text-cream-100/70 text-sm mb-6">
            This property does not exist or may have been removed.
          </p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    ) : (
      <div className="min-h-screen bg-cream-50 dark:bg-[#12221C] flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6">
          <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-2">Listing Not Found</h2>
          <p className="text-ink-500 dark:text-cream-100/70 text-sm mb-6">
            This property does not exist or may have been removed.
          </p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Parse images array
  const allImages = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : listing.cover_image || listing.image
      ? [listing.cover_image || listing.image]
      : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"];

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    triggerToast("Listing link copied to clipboard!", "success", "Copied");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleOpenChat = () => {
    const isAuth = sessionStorage.getItem("isAuthenticated") === "true" || sessionStorage.getItem("isAuthenticated") === "true";
    if (!isAuth) {
      navigate("/login", { state: { from: `/listing/${id}` } });
      return;
    }
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 1,
          sender: "landlord",
          text: `Hello! Thanks for your interest in ${listing.title || "this property"}. How can I assist you today?`,
          time: "Just now"
        }
      ]);
    }
    setIsChatOpen(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");

    // Sync to P2P chats in localStorage
    const tenantName = sessionStorage.getItem("username") || "Tenant User";
    const tenantEmail = sessionStorage.getItem("lastLoggedInEmail") || "tenant@example.com";
    const propertyLandlordName = listing.landlord?.name || listing.landlord_name || "Skyline Properties Ltd";

    // 1. Add to Tenant's chat list
    const tChats = JSON.parse(localStorage.getItem("tenantChats") || "[]");
    let tThread = tChats.find(c => c.name === propertyLandlordName);
    if (!tThread) {
      tThread = { id: Date.now() + Math.random(), name: propertyLandlordName, messages: [], unread: 0, avatar: propertyLandlordName.charAt(0).toUpperCase() };
      tChats.unshift(tThread);
    }
    tThread.messages.push({ ...userMsg, sender: 'user' });
    localStorage.setItem("tenantChats", JSON.stringify(tChats));

    // 2. Add to Landlord's chat list
    const lChats = JSON.parse(localStorage.getItem("landlordChats") || "[]");
    let lThread = lChats.find(c => c.name === tenantName);
    if (!lThread) {
      lThread = { id: Date.now() + Math.random(), name: tenantName, messages: [], unread: 1, avatar: tenantName.charAt(0).toUpperCase() };
      lChats.unshift(lThread);
    }
    lThread.messages.push({ ...userMsg, sender: 'tenant' });
    lThread.unread = (lThread.unread || 0) + 1;
    localStorage.setItem("landlordChats", JSON.stringify(lChats));

    window.dispatchEvent(new Event("storage"));

    // Simulate instant system notification
    setTimeout(() => {
      const replyText = `Your message has been sent to ${propertyLandlordName}. You will receive a response shortly.`;
      const replyMsg = {
        id: Date.now() + 1,
        sender: "system",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, replyMsg]);

      // Note: We don't sync the "system" message to P2P because it's a local UI notification.
      // The user's actual message was already synced to the Landlord above.

      window.dispatchEvent(new Event("storage"));
    }, 1200);
  };

  // Price formatting
  const rentAmount = Number(listing.rent_amount) || 0;
  const rentPeriodStr = String(listing.rent_period || '').toLowerCase().includes('month') ? '/month' : '/year';
  const formattedPrice = `₦${rentAmount.toLocaleString()}`;

  const propertyTypeDisplay = listing.property_type
    ? listing.property_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "House";

  const locationDisplay = listing.location || `${listing.address_line1 || "Maitama"}, ${listing.city || "Abuja"}, ${listing.state || "FCT"}`.replace(/^, /, "");

  const bedrooms = listing.bedrooms || listing.beds || 4;
  const bathrooms = listing.bathrooms || listing.baths || 5;

  const amenitiesList = Array.isArray(listing.amenities) && listing.amenities.length > 0
    ? listing.amenities
    : typeof listing.amenities === "string" && listing.amenities
      ? listing.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : [];

  const landlordName = listing.landlord?.name || listing.landlord_name || "Skyline Properties Ltd";

  return (
    <div className={isTenant ? "tenant-wrapper" : "min-h-screen bg-[#FDFBF7] dark:bg-[#12221C] text-ink-900 dark:text-cream-100 transition-colors"}
      style={isTenant ? { display: "flex" } : undefined}
    >
      {isTenant ? <TenantSidebarStrip /> : <NavBar />}

      <div className={isTenant ? "db-main-content flex-1 overflow-y-auto" : "mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8"}>
        
        {/* TOP BAR: Back Link & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-ink-200/50 dark:border-white/10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-ink-600 dark:text-cream-100/70 hover:text-moss-700 dark:hover:text-[#E5C583] transition-colors cursor-pointer bg-transparent border-none outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
            <span className="text-ink-400 dark:text-cream-100/40">/</span>
            <span className="font-semibold text-ink-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
              {listing.title}
            </span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleToggleSave}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer outline-none ${isSaved
                ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300"
                : "bg-white dark:bg-[#16241F] border-ink-200 dark:border-white/15 text-ink-700 dark:text-cream-100 hover:border-moss-500"
                }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-full border border-ink-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-xs font-bold text-ink-700 dark:text-cream-100 hover:border-moss-500 flex items-center gap-1.5 transition-all cursor-pointer outline-none"
            >
              {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{linkCopied ? "Link Copied!" : "Link"}</span>
            </button>
          </div>
        </div>

        {/* HERO IMAGE SWIPER CAROUSEL */}
        <div className="relative rounded-2xl overflow-hidden bg-ink-900 aspect-[16/9] max-h-[500px] shadow-lg group">
          <img
            src={allImages[activeImageIndex]}
            alt={`${listing.title} - Photo ${activeImageIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-300"
          />

          {/* Swipe Left Arrow */}
          {allImages.length > 1 && (
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-[#16241F]/90 text-ink-900 dark:text-white shadow-md flex items-center justify-center hover:scale-105 transition-all cursor-pointer border-none outline-none z-10"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Swipe Right Arrow */}
          {allImages.length > 1 && (
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-[#16241F]/90 text-ink-900 dark:text-white shadow-md flex items-center justify-center hover:scale-105 transition-all cursor-pointer border-none outline-none z-10"
              aria-label="Next Photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Photo Counter Pill Badge */}
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 select-none z-10">
            {activeImageIndex + 1} / {allImages.length}
          </div>
        </div>

        {/* THUMBNAIL PREVIEW ROW */}
        {allImages.length > 1 && (
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-none">
            {allImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer p-0 outline-none ${activeImageIndex === idx
                  ? "border-moss-600 dark:border-[#E5C583] ring-2 ring-moss-600/30 scale-[1.02]"
                  : "border-transparent opacity-70 hover:opacity-100"
                  }`}
              >
                <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* MAIN CONTENT GRID LAYOUT */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          
          {/* LEFT COLUMN: SPECS, AMENITIES, LOCATION & OWNER */}
          <div className="space-y-8">
            
            {/* Title, Badges & Location */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                  For Rent
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-moss-100 text-moss-800 dark:bg-moss-900/60 dark:text-[#E5C583] border border-moss-200 dark:border-moss-800 uppercase tracking-wider">
                  {propertyTypeDisplay}
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cream-100 text-ink-700 dark:bg-white/10 dark:text-cream-100 border border-ink-200 dark:border-white/10">
                  Listed {formatDistanceToNow(listing.createdAt || listing.dateAdded || listing.created_at)}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white leading-tight">
                {listing.title}
              </h1>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-ink-600 dark:text-cream-100/70 mt-2 font-medium">
                <MapPin className="h-4 w-4 text-moss-600 dark:text-[#E5C583] shrink-0" />
                <span>{locationDisplay}</span>
              </div>
            </div>

            {/* Key Specs Box */}
            <div className="p-4 rounded-xl bg-[#EAF0E8] dark:bg-white/5 border border-moss-200/60 dark:border-white/10 flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-moss-700/10 dark:bg-[#E5C583]/10 flex items-center justify-center text-moss-700 dark:text-[#E5C583]">
                  <BedDouble className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-ink-900 dark:text-white">{bedrooms}</div>
                  <div className="text-[11px] text-ink-500 dark:text-cream-100/60 font-medium">Bedrooms</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-moss-700/10 dark:bg-[#E5C583]/10 flex items-center justify-center text-moss-700 dark:text-[#E5C583]">
                  <Bath className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-ink-900 dark:text-white">{bathrooms}</div>
                  <div className="text-[11px] text-ink-500 dark:text-cream-100/60 font-medium">Bathrooms</div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {listing.description && (
              <div>
                <h3 className="text-sm font-bold text-ink-900 dark:text-white mb-2">Description</h3>
                <p className="text-xs sm:text-sm text-ink-600 dark:text-cream-100/80 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Amenities Section */}
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-white mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* Location Section & Map */}
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-white mb-1">Location</h3>
              <p className="text-xs text-ink-600 dark:text-cream-100/70 mb-3 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                <span>{locationDisplay}</span>
              </p>

              {/* Map Box Preview */}
              <div className="mt-4">
                <a href={`https://maps.google.com/maps?q=${encodeURIComponent(locationDisplay)}`} target="_blank" rel="noopener noreferrer" className="relative rounded-2xl overflow-hidden border border-ink-200 dark:border-white/10 h-64 bg-[#EAF0E8] dark:bg-[#16241F] shadow-xs flex flex-col items-center justify-center group hover:border-moss-400 transition-colors block">
                  
                  {/* Decorative Map Grid Background */}
                  <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'linear-gradient(#2C4633 1px, transparent 1px), linear-gradient(90deg, #2C4633 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                     <div className="h-14 w-14 rounded-full bg-white dark:bg-[#0A1612] shadow-md flex items-center justify-center mb-3 group-hover:-translate-y-1 transition-transform">
                       <MapPin className="h-6 w-6 text-moss-600 dark:text-[#E5C583]" />
                     </div>
                     <span className="text-sm font-bold text-ink-900 dark:text-white mb-1">View Full Map</span>
                     <span className="text-[10px] uppercase tracking-wider text-ink-500 font-bold">Opens in new tab</span>
                  </div>

                  {/* Price Marker Overlay Pill */}
                  <div className="absolute bottom-4 right-4 bg-[#12221C] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 z-10">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{formattedPrice}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Property Owner Section */}
            <div className="p-5 rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#16241F]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 mb-3">
                Property Owner
              </h3>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-moss-100 dark:bg-white/10 text-moss-800 dark:text-[#E5C583] font-bold text-lg flex items-center justify-center shrink-0 border border-moss-300 dark:border-white/15">
                    {landlordName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink-900 dark:text-white flex items-center gap-1.5">
                      <span>{landlordName}</span>
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-ink-500 dark:text-cream-100/60 font-medium">
                      Verified Landlord • Direct Listing
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b672] text-white dark:text-[#263b33] transition-all cursor-pointer border-none outline-none flex items-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat with Owner</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT STICKY SIDEBAR */}
          <div className="sticky top-32 space-y-4">
            <div className="p-6 rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#16241F] shadow-sm">
              <div className="text-2xl font-bold text-moss-800 dark:text-[#E5C583] mb-4">
                {formattedPrice}
                <span className="text-xs font-normal text-ink-500 dark:text-cream-100/60 ml-1">{rentPeriodStr}</span>
              </div>

              {/* Primary Contact Landlord Button (In-App Chat) */}
              <button
                type="button"
                onClick={handleOpenChat}
                className="w-full py-3 px-4 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b672] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer transition-all border-none outline-none flex items-center justify-center gap-2 mb-5 shadow-xs"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Contact Landlord</span>
              </button>

              {/* Property Details Summary Table */}
              <div className="space-y-3 pt-4 border-t border-ink-200/50 dark:border-white/10 text-xs">
                <div className="flex justify-between items-center text-ink-700 dark:text-cream-100/80">
                  <span className="text-ink-500 dark:text-cream-100/60">Property type</span>
                  <span className="font-bold text-ink-900 dark:text-white">{propertyTypeDisplay}</span>
                </div>

                <div className="flex justify-between items-center text-ink-700 dark:text-cream-100/80">
                  <span className="text-ink-500 dark:text-cream-100/60">Listing type</span>
                  <span className="font-bold text-ink-900 dark:text-white">For Rent</span>
                </div>

                <div className="flex justify-between items-center text-ink-700 dark:text-cream-100/80">
                  <span className="text-ink-500 dark:text-cream-100/60">Listed</span>
                  <span className="font-bold text-ink-900 dark:text-white">
                    {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "15 Jun 2026"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-ink-200/40 dark:border-white/10 text-center">
                <p className="text-[11px] font-medium text-ink-500 dark:text-cream-100/60">
                  Contact landlord directly — no agent fees
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIRECT IN-APP CHAT DRAWER / MODAL (NO WHATSAPP) */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in">
          <div className="w-full sm:w-[420px] bg-white dark:bg-[#12221C] h-full shadow-2xl flex flex-col justify-between border-l border-ink-200 dark:border-white/10">
            
            {/* Chat Drawer Header */}
            <div className="p-4 bg-white dark:bg-[#16241F] border-b border-ink-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#E5C583] text-[#263b33] font-bold text-sm flex items-center justify-center shrink-0">
                  {landlordName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-xs text-ink-900 dark:text-white">{landlordName}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-300 flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    Online — usually responds in minutes
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-ink-900 dark:text-white cursor-pointer transition-colors border-none outline-none shadow-sm"
                title="Close Chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-cream-50/50 dark:bg-[#0D1814]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "system" ? "w-full items-center my-4" : `max-w-[80%] ${msg.sender === "user" ? "ml-auto items-end" : "items-start"}`}`}
                >
                  <div
                    className={`p-3 text-xs font-medium leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-moss-700 text-white rounded-2xl rounded-br-none"
                        : msg.sender === "system"
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 italic rounded-xl text-center border border-dashed border-neutral-300 dark:border-neutral-700 mx-auto"
                        : "bg-white dark:bg-[#16241F] text-ink-900 dark:text-white border border-ink-200 dark:border-white/10 rounded-2xl rounded-bl-none shadow-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender !== "system" && (
                    <span className="text-[10px] text-ink-400 dark:text-cream-100/50 mt-1 px-1 font-mono">
                      {msg.time}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#16241F] border-t border-ink-200 dark:border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message to landlord..."
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-ink-200 dark:border-white/15 bg-cream-50 dark:bg-[#12221C] text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
                autoFocus
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer hover:opacity-90 transition-all border-none outline-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
