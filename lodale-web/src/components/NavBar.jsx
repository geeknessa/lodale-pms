import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import Button from "./Button";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "./Logo";

export default function NavBar({ transparentMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const sessAuth = sessionStorage.getItem("isAuthenticated");
    if (sessAuth !== null) return sessAuth === "true";
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [userRole, setUserRole] = useState(() => {
    return (sessionStorage.getItem("userRole") || localStorage.getItem("userRole") || "").toLowerCase();
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    const r = (sessionStorage.getItem("userRole") || localStorage.getItem("userRole") || "").toLowerCase();
    const email = sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "";
    return r === "admin" || email === "admin@lodale.com" || sessionStorage.getItem("adminAuthenticated") === "true";
  });
  const [activeSection, setActiveSection] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleAuth = () => {
      const sessAuth = sessionStorage.getItem("isAuthenticated");
      const auth = sessAuth !== null ? sessAuth === "true" : localStorage.getItem("isAuthenticated") === "true";
      const role = (sessionStorage.getItem("userRole") || localStorage.getItem("userRole") || "").toLowerCase();
      const email = sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "";

      setIsAuthenticated(auth);
      setUserRole(role);
      setIsAdmin(role === "admin" || email === "admin@lodale.com" || sessionStorage.getItem("adminAuthenticated") === "true");
    };

    handleAuth();

    window.addEventListener("storage", handleAuth);
    return () => window.removeEventListener("storage", handleAuth);
  }, [location]);

  // Scroll listener: active status changes ONLY when scrolling into sections
  useEffect(() => {
    const isHome = location.pathname === "/explore" || location.pathname === "/";
    if (!isHome) {
      setActiveSection("");
      return;
    }

    const handleScroll = () => {
      const tenantElem = document.getElementById("for-tenants");
      const landlordElem = document.getElementById("for-landlords");
      const blogElem = document.getElementById("blog");
      const scrollPos = window.scrollY;

      const tenantTop = tenantElem ? tenantElem.offsetTop - 180 : Infinity;
      const landlordTop = landlordElem ? landlordElem.offsetTop - 180 : Infinity;
      const blogTop = blogElem ? blogElem.offsetTop - 180 : Infinity;

      setIsScrolled(scrollPos > 50);

      if (scrollPos >= blogTop) {
        setActiveSection("#blog");
      } else if (scrollPos >= landlordTop) {
        setActiveSection("#for-landlords");
      } else if (scrollPos >= tenantTop) {
        setActiveSection("#for-tenants");
      } else {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  function handleHomeClick(e) {
    setIsOpen(false);
    if (location.pathname === "/explore" || location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSectionClick(e, hash) {
    setIsOpen(false);
    if (location.pathname === "/explore" || location.pathname === "/") {
      e.preventDefault();
      const elem = document.getElementById(hash.replace("#", ""));
      if (elem) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = elem.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth",
        });
      }
    }
  }

  const checkIsActive = (path, hash = "") => {
    const isHomeRoute =
      location.pathname === "/explore" ||
      location.pathname === "/" ||
      location.pathname === "/home";

    if (isHomeRoute) {
      if (hash) {
        return activeSection === hash;
      }
      if (path === "/explore" || path === "/" || path === "/home") {
        return activeSection === "";
      }
    }

    return location.pathname === path;
  };

  const isActuallyTransparent = transparentMode && !isScrolled;

  const desktopLinkClass = (path, hash = "") => {
    const isActive = checkIsActive(path, hash);
    const inactiveColor = isActuallyTransparent
      ? (isDark ? "text-white/90 hover:text-white" : "text-[#405448]/90 hover:text-[#405448]")
      : "text-[#405448] dark:text-cream-100 hover:text-moss-700 dark:hover:text-white";
    const activeColor = isActuallyTransparent
      ? (isDark ? "text-white font-bold" : "text-[#405448] font-bold")
      : "text-[#405448] font-bold dark:text-white";
    const underlineColor = isActuallyTransparent
      ? (isDark ? "after:bg-white" : "after:bg-[#405448]")
      : "after:bg-[#405448] dark:after:bg-[#E5C583]";

    return `relative transition-colors pb-1 text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-moss-600 outline-none ${isActive ? activeColor : inactiveColor
      } ${isActive ? `after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full ${underlineColor}` : ""}`;
  };

  function handleSignOut() {
    const isCurrentAdmin = isAdmin || localStorage.getItem("userRole") === "admin" || sessionStorage.getItem("userRole") === "admin";
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("sessionExpiresAt");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("sessionExpiresAt");
    sessionStorage.removeItem("userRole");
    if (localStorage.getItem("lastLoggedInEmail") === "admin@lodale.com") {
      localStorage.removeItem("lastLoggedInEmail");
    }
    if (isCurrentAdmin) {
      localStorage.setItem("explicitAdminSignOut", "true");
    }
    setIsAuthenticated(false);
    setIsOpen(false);
    window.dispatchEvent(new Event("storage"));

    if (isCurrentAdmin) {
      navigate("/admin/login", { replace: true });
    } else {
      navigate("/explore", { replace: true });
    }
  }

  function handleDashboardNavigate() {
    setIsOpen(false);
    const role = (sessionStorage.getItem("userRole") || localStorage.getItem("userRole") || userRole || "tenant").toLowerCase().trim();
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "landlord") {
      navigate("/dashboard/landlord");
    } else {
      navigate("/dashboard/tenant");
    }
  }

  const mobileLinkClass = (path, hash = "") => {
    const active = checkIsActive(path, hash);
    return `flex items-center justify-between py-2 text-[16px] font-semibold transition-colors ${active ? "text-moss-700 dark:text-[#E5C583]" : "text-theme-text"
      }`;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isActuallyTransparent
        ? "bg-transparent border-b border-white/20 pt-4 pb-4"
        : "bg-white/90 dark:bg-[#263b33]/90 backdrop-blur-md border-b border-ink-200/30 py-4 shadow-sm"
        }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-8 md:px-12">
        <Link to="/explore" onClick={handleHomeClick} className="flex-shrink-0">
          <Logo variant={isActuallyTransparent ? (isDark ? "white" : "moss") : "default"} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-10 md:flex">
          <Link
            to="/explore"
            onClick={handleHomeClick}
            className={desktopLinkClass("/explore")}
          >
            Home
          </Link>
          <Link
            to="/explore#for-tenants"
            onClick={(e) => handleSectionClick(e, "#for-tenants")}
            className={desktopLinkClass("/explore", "#for-tenants")}
          >
            For Tenants
          </Link>
          <Link
            to="/explore#for-landlords"
            onClick={(e) => handleSectionClick(e, "#for-landlords")}
            className={desktopLinkClass("/explore", "#for-landlords")}
          >
            For Landlords
          </Link>
          <Link
            to="/explore#blog"
            onClick={(e) => handleSectionClick(e, "#blog")}
            className={desktopLinkClass("/explore", "#blog")}
          >
            Blog
          </Link>
          <Link
            to="/how-it-works"
            className={desktopLinkClass("/how-it-works")}
          >
            How It Works
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors mr-2 focus-visible:ring-2 focus-visible:ring-white outline-none ${isActuallyTransparent
              ? (isDark
                ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                : "bg-moss-700/10 hover:bg-moss-700/20 text-moss-800 backdrop-blur-sm")
              : "bg-cream-50 hover:bg-cream-100 text-ink-700 dark:bg-moss-700 dark:text-white dark:hover:bg-moss-600"
              }`}
            aria-label="Toggle dark theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg md:hidden focus-visible:ring-2 outline-none transition-colors ${isActuallyTransparent
              ? (isDark
                ? "text-white bg-white/10 hover:bg-white/20 focus-visible:ring-white"
                : "text-moss-800 bg-moss-700/10 hover:bg-moss-700/20 focus-visible:ring-moss-800")
              : "bg-cream-50 hover:bg-cream-100 text-ink-700 dark:bg-moss-700 dark:text-white dark:hover:bg-moss-600 focus-visible:ring-moss-600"
              }`}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Desktop Controls */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={handleDashboardNavigate}
                variant="secondary"
                className={`px-4 py-2 text-[13px] font-bold border ${isActuallyTransparent
                  ? (isDark ? "border-white/30 text-white hover:bg-white hover:text-moss-900" : "border-moss-800/30 text-moss-800 hover:bg-moss-800 hover:text-white")
                  : "border-moss-700/30 dark:border-[#E5C583]/40 text-moss-800 dark:text-[#E5C583] hover:bg-moss-700 hover:text-white dark:hover:bg-[#E5C583] dark:hover:text-[#263b33]"
                  } transition-all cursor-pointer`}
              >
                Dashboard
              </Button>
              <Button
                onClick={handleSignOut}
                className="px-4 py-2 text-[13px] ml-1 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className={`text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full px-4 py-2 ${isActuallyTransparent
                  ? (isDark ? "text-white/90 hover:text-white" : "text-[#405448]/90 hover:text-[#405448]")
                  : "text-ink-700 hover:text-ink-900 dark:text-cream-100 dark:hover:text-white"
                  }`}
              >
                Log In
              </button>
              <Button
                onClick={() => navigate("/login")}
                className={`px-4 py-2 text-[13px] font-semibold transition-all rounded-full ${isActuallyTransparent
                  ? (isDark ? "bg-white text-ink-900 hover:bg-white/90" : "bg-moss-800 text-white hover:bg-moss-900")
                  : ""
                  }`}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {isOpen && (
        <nav className="flex flex-col gap-4 border-t border-ink-200/30 bg-theme-bg/95 backdrop-blur-md px-6 py-5 md:hidden animate-fade-in text-left">
          <Link
            to="/explore"
            onClick={handleHomeClick}
            className={mobileLinkClass("/explore")}
          >
            <span>Home</span>
            {checkIsActive("/explore") && (
              <span className="h-1.5 w-1.5 rounded-full bg-moss-700 dark:bg-[#E5C583]" />
            )}
          </Link>
          <Link
            to="/explore#for-tenants"
            onClick={(e) => handleSectionClick(e, "#for-tenants")}
            className={mobileLinkClass("/explore", "#for-tenants")}
          >
            <span>For Tenants</span>
            {checkIsActive("/explore", "#for-tenants") && (
              <span className="h-1.5 w-1.5 rounded-full bg-moss-700 dark:bg-[#E5C583]" />
            )}
          </Link>
          <Link
            to="/explore#for-landlords"
            onClick={(e) => handleSectionClick(e, "#for-landlords")}
            className={mobileLinkClass("/explore", "#for-landlords")}
          >
            <span>For Landlords</span>
            {checkIsActive("/explore", "#for-landlords") && (
              <span className="h-1.5 w-1.5 rounded-full bg-moss-700 dark:bg-[#E5C583]" />
            )}
          </Link>
          <Link
            to="/explore#blog"
            onClick={(e) => handleSectionClick(e, "#blog")}
            className={mobileLinkClass("/explore", "#blog")}
          >
            <span>Blog</span>
            {checkIsActive("/explore", "#blog") && (
              <span className="h-1.5 w-1.5 rounded-full bg-moss-700 dark:bg-[#E5C583]" />
            )}
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setIsOpen(false)}
            className={mobileLinkClass("/how-it-works")}
          >
            <span>How It Works</span>
            {checkIsActive("/how-it-works") && (
              <span className="h-1.5 w-1.5 rounded-full bg-moss-700 dark:bg-[#E5C583]" />
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex flex-col gap-3.5 pt-3">
              <Button
                onClick={handleDashboardNavigate}
                className="w-full py-2.5 text-[14px] font-bold"
              >
                Go to Dashboard
              </Button>
              <Button
                className="px-5 py-2.5 text-[14px]"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 pt-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/login");
                }}
                className={`text-[14px] font-semibold text-left py-1 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none ${location.pathname === "/login"
                  ? "text-moss-700 dark:text-[#E5C583]"
                  : "text-theme-text hover:text-moss-600"
                  }`}
              >
                Log In
              </button>
              <Button
                className="px-5 py-2.5 text-[14px]"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/signup");
                }}
              >
                Sign Up
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
