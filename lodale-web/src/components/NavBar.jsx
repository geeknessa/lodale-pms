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
  const [isAdmin, setIsAdmin] = useState(() => {
    return (
      localStorage.getItem("userRole") === "admin" ||
      localStorage.getItem("lastLoggedInEmail") === "admin@lodale.com"
    );
  });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleAuth = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
      setIsAdmin(
        localStorage.getItem("userRole") === "admin" ||
          localStorage.getItem("lastLoggedInEmail") === "admin@lodale.com"
      );
    };

    // Check auth status on route/location change
    handleAuth();

    window.addEventListener("storage", handleAuth);
    return () => window.removeEventListener("storage", handleAuth);
  }, [location]);

  function handleHomeClick(e) {
    if (location.pathname === "/explore" || location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsOpen(false);
  }

  function handleDashboardNavigate() {
    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate("/dashboard/tenant");
    }
  }

  function handleSignOut() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("sessionExpiresAt");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsOpen(false);
    navigate("/explore");
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-in-out border-b backdrop-blur-md ${
        isScrolled
          ? "bg-theme-bg/95 border-theme-border/80 shadow-sm shadow-black/5 dark:shadow-none"
          : "bg-theme-bg/80 border-theme-border/30"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-6 transition-all duration-300 ease-in-out ${
          isScrolled ? "py-3" : "py-4"
        }`}
      >
        <Link to="/explore">
          <Logo />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 text-[14px] font-medium text-ink-700/90 dark:text-cream-100/90 md:flex">
          <Link
            to="/explore"
            onClick={handleHomeClick}
            className="hover:text-ink-900 dark:hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none rounded-[4px] px-1 py-0.5"
          >
            Home
          </Link>
          <Link
            to="/explore#for-tenants"
            className="hover:text-ink-900 dark:hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none rounded-[4px] px-1 py-0.5"
          >
            For Tenants
          </Link>
          <Link
            to="/explore#for-landlords"
            className="hover:text-ink-900 dark:hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none rounded-[4px] px-1 py-0.5"
          >
            For Landlords
          </Link>
          <Link
            to="/how-it-works"
            className="hover:text-ink-900 dark:hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none rounded-[4px] px-1 py-0.5"
          >
            How It Works
          </Link>
          <Link
            to="/about"
            className="hover:text-ink-900 dark:hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none rounded-[4px] px-1 py-0.5"
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
                onClick={handleDashboardNavigate}
                className="text-[14px] font-medium text-ink-700 dark:text-cream-100/90 hover:text-ink-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white rounded-[6px] px-2.5 py-1.5 transition-colors flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                {isAdmin && (
                  <span className="text-[10px] bg-[#344E41] text-white px-2 py-0.5 rounded font-bold uppercase">
                    Admin
                  </span>
                )}
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
                className="text-[14px] font-medium text-ink-700 dark:text-cream-100/90 hover:text-ink-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none dark:focus-visible:ring-white rounded-[6px] px-2.5 py-1.5 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/login?role=admin")}
                className="text-[12px] font-bold text-[#344E41] dark:text-[#DAD7CD] hover:underline px-2 py-1 bg-[#DAD7CD]/50 dark:bg-[#344E41]/50 rounded-md transition-colors"
              >
                Admin Portal
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
        <nav className="flex flex-col gap-4 border-t border-theme-border/30 bg-theme-bg/95 backdrop-blur-md px-6 py-5 md:hidden animate-fade-in text-left">
          <Link
            to="/explore"
            onClick={handleHomeClick}
            className="text-theme-text hover:text-moss-600 font-medium py-1.5 border-b border-theme-border/10 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none"
          >
            Home
          </Link>
          <Link
            to="/explore#for-tenants"
            onClick={() => setIsOpen(false)}
            className="text-theme-text hover:text-moss-600 font-medium py-1.5 border-b border-theme-border/10 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none"
          >
            For Tenants
          </Link>
          <Link
            to="/explore#for-landlords"
            onClick={() => setIsOpen(false)}
            className="text-theme-text hover:text-moss-600 font-medium py-1.5 border-b border-theme-border/10 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none"
          >
            For Landlords
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setIsOpen(false)}
            className="text-theme-text hover:text-moss-600 font-medium py-1.5 border-b border-theme-border/10 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none"
          >
            How It Works
          </Link>
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className="text-theme-text hover:text-moss-600 font-medium py-1.5 border-b border-theme-border/10 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none"
          >
            About
          </Link>

          {isAuthenticated ? (
            <div className="flex flex-col gap-3.5 pt-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleDashboardNavigate();
                }}
                className="text-[14px] font-semibold text-theme-text hover:text-moss-600 text-left py-1 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none flex items-center justify-between"
              >
                <span>Dashboard</span>
                {isAdmin && (
                  <span className="text-[10px] bg-[#344E41] text-white px-2 py-0.5 rounded font-bold uppercase">
                    Admin Portal
                  </span>
                )}
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
                className="text-[14px] font-semibold text-theme-text hover:text-moss-600 text-left py-1 focus-visible:ring-2 focus-visible:ring-moss-600 outline-none"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/login?role=admin");
                }}
                className="text-[13px] font-bold text-[#344E41] dark:text-[#DAD7CD] text-left py-1"
              >
                Admin Portal Login &rarr;
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
