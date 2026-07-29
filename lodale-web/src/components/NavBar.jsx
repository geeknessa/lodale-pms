import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import Button from "./Button";
import { useTheme } from "../context/ThemeContext";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleAuth = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
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
      const scrollPos = window.scrollY;

      const tenantTop = tenantElem ? tenantElem.offsetTop - 180 : Infinity;
      const landlordTop = landlordElem ? landlordElem.offsetTop - 180 : Infinity;

      if (scrollPos >= landlordTop) {
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

  const desktopLinkClass = (path, hash = "") => {
    const active = checkIsActive(path, hash);
    return `transition-all duration-200 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none rounded-md px-2.5 py-1 ${active
        ? "text-moss-700 dark:text-[#E5C583] font-bold bg-moss-100/70 dark:bg-[#1C3328]/80 relative after:content-[''] after:absolute after:-bottom-1.5 after:left-2 after:right-2 after:h-[2.5px] after:bg-moss-700 dark:after:bg-[#E5C583] after:rounded-full shadow-xs"
        : "text-ink-700 dark:text-cream-100/70 hover:text-ink-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5"
      }`;
  };

  const mobileLinkClass = (path, hash = "") => {
    const active = checkIsActive(path, hash);
    return `py-2.5 px-3 border-b transition-all duration-200 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none flex items-center justify-between rounded-lg ${active
        ? "text-moss-700 dark:text-[#E5C583] font-bold border-moss-700 dark:border-[#E5C583] bg-moss-100/60 dark:bg-[#1C3328]/60"
        : "text-theme-text dark:text-cream-100/80 hover:text-moss-600 border-theme-border/10 font-medium"
      }`;
  };

  function handleSignOut() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("sessionExpiresAt");
    setIsAuthenticated(false);
    setIsOpen(false);
    navigate("/explore");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/30 bg-transparent backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/explore" onClick={handleHomeClick}>
          <Logo />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 text-[14px] md:flex">
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
            to="/how-it-works"
            className={desktopLinkClass("/how-it-works")}
          >
            How It Works
          </Link>
          <Link
            to="/about"
            className={desktopLinkClass("/about")}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-50 hover:bg-cream-100 transition-colors text-ink-700 dark:bg-moss-700 dark:text-white dark:hover:bg-moss-600 mr-2 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white"
            aria-label="Toggle dark theme"
          >
            {isDark ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-50 hover:bg-cream-100 text-ink-700 dark:bg-moss-700 dark:text-white dark:hover:bg-moss-600 md:hidden focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Desktop Controls */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard/tenant")}
                className={`text-[14px] font-medium focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white rounded-[6px] px-2.5 py-1.5 transition-colors ${location.pathname.startsWith("/dashboard")
                  ? "text-moss-700 dark:text-[#E5C583] font-bold"
                  : "text-ink-700 hover:text-ink-900"
                  }`}
              >
                Dashboard
              </button>
              <Button
                onClick={handleSignOut}
                className="px-5 py-2.5 text-[14px] focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className={`text-[14px] font-medium focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white rounded-[6px] px-2.5 py-1.5 transition-colors ${location.pathname === "/login"
                  ? "text-moss-700 dark:text-[#E5C583] font-bold"
                  : "text-ink-700 hover:text-ink-900"
                  }`}
              >
                Log In
              </button>
              <Button
                className="px-5 py-2.5 text-[14px] focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white"
                onClick={() => navigate("/signup")}
              >
                Sign Up
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
            to="/how-it-works"
            onClick={() => setIsOpen(false)}
            className={mobileLinkClass("/how-it-works")}
          >
            <span>How It Works</span>
            {checkIsActive("/how-it-works") && (
              <span className="h-1.5 w-1.5 rounded-full bg-moss-700 dark:bg-[#E5C583]" />
            )}
          </Link>
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className={mobileLinkClass("/about")}
          >
            <span>About</span>
            {checkIsActive("/about") && (
              <span className="h-1.5 w-1.5 rounded-full bg-moss-700 dark:bg-[#E5C583]" />
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex flex-col gap-3.5 pt-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/dashboard/tenant");
                }}
                className={`text-[14px] font-semibold text-left py-1 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none ${location.pathname.startsWith("/dashboard")
                  ? "text-moss-700 dark:text-[#E5C583]"
                  : "text-theme-text hover:text-moss-600"
                  }`}
              >
                Dashboard
              </button>
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
