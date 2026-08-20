import React, { useState, useEffect, Suspense, lazy } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import PageLoader from "./components/PageLoader";
import { LandlordAccessPrompt, TenantAccessPrompt } from "./components/RoleAccessPrompt";

const GuestDashboard = lazy(() => import("./pages/GuestDashboard"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Application = lazy(() => import("./pages/Application"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const DashboardAddProperty = lazy(() => import("./pages/DashboardAddProperty"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LandlordDashboard = lazy(() => import("./pages/LandlordDashboard/LandlordDashboard"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard/TenantDashboard"));
import { AlertTriangle } from "lucide-react";


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught rendering failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#263b33] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md space-y-6">
            <div className="text-5xl text-amber-500 flex justify-center">
              <AlertTriangle className="h-16 w-16" />
            </div>
            <h1 className="font-display text-3xl font-normal text-white">
              Something went wrong
            </h1>
            <p className="text-[14px] text-cream-100/75 leading-relaxed">
              We encountered an unexpected rendering error. This might be due to
              a temporary glitch or an updated file.
            </p>
            {import.meta.env.DEV && (
              <div className="bg-[#13221C] border border-[#23372B] p-4 rounded-xl text-left font-mono text-[11px] text-[#A3BCA7] overflow-auto max-h-40">
                {this.state.error?.toString()}
              </div>
            )}
            <div className="flex gap-4 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#E5C583] hover:bg-[#D8B672] text-[#263b33] font-bold px-6 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors outline-none"
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/explore")}
                className="bg-[#182C23] hover:bg-[#1D3329] border border-[#23372B] text-white font-bold px-6 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors outline-none"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = sessionStorage.getItem("isAuthenticated") === "true";
    const expires = sessionStorage.getItem("sessionExpiresAt");
    if (auth && expires && Date.now() > Number(expires)) {
      // Session expired
      sessionStorage.removeItem("isAuthenticated");
      sessionStorage.removeItem("sessionExpiresAt");
      return false;
    }
    return auth;
  });

  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const auth = sessionStorage.getItem("isAuthenticated") === "true";
      const expires = sessionStorage.getItem("sessionExpiresAt");
      if (auth && expires && Date.now() > Number(expires)) {
        sessionStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("sessionExpiresAt");
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(auth);
      }
    };

    // Check every route change as well
    checkAuth();

    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [location]);

  if (!isAuthenticated) {
    const expires = sessionStorage.getItem("sessionExpiresAt");
    const wasSessionExpired = expires && Date.now() > Number(expires);

    // Clear storage just in case
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("sessionExpiresAt");

    return (
      <Navigate
        to="/login"
        replace
        state={{
          fromProtected: true,
          sessionExpired: wasSessionExpired,
        }}
      />
    );
  }

  return children;
}

function AdminProtectedRoute({ children }) {
  const checkCurrentTabAuth = () => {
    const sessAuth = sessionStorage.getItem("isAuthenticated");
    const localAuth = sessionStorage.getItem("isAuthenticated");
    const auth = sessAuth === "true" || localAuth === "true";

    const role = (sessionStorage.getItem("userRole") || sessionStorage.getItem("userRole") || "").toLowerCase();
    const adminAuth = sessionStorage.getItem("adminAuthenticated") === "true" || sessionStorage.getItem("adminAuthenticated") === "true";
    const expires = sessionStorage.getItem("sessionExpiresAt") || sessionStorage.getItem("sessionExpiresAt");

    if (!auth || role !== "admin" || !adminAuth || (expires && Date.now() > Number(expires))) {
      return false;
    }
    return true;
  };

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(checkCurrentTabAuth);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      setIsAdminAuthenticated(checkCurrentTabAuth());
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [location]);

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ fromProtected: true }} />;
  }

  return children;
}

function LandlordProtectedRoute({ children }) {
  const checkCurrentTabAuth = () => {
    const sessAuth = sessionStorage.getItem("isAuthenticated");
    const hasTabSession = sessAuth !== null;
    const auth = hasTabSession ? sessAuth === "true" : sessionStorage.getItem("isAuthenticated") === "true";
    const role = (sessionStorage.getItem("userRole") || (!hasTabSession ? sessionStorage.getItem("userRole") : "") || "").toLowerCase();
    const expires = sessionStorage.getItem("sessionExpiresAt") || (!hasTabSession ? sessionStorage.getItem("sessionExpiresAt") : null);
    if (!auth || role !== "landlord" || (expires && Date.now() > Number(expires))) {
      return false;
    }
    return true;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(checkCurrentTabAuth);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(checkCurrentTabAuth());
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [location]);

  if (!isAuthenticated) {
    const sessAuth = sessionStorage.getItem("isAuthenticated");
    const hasTabSession = sessAuth !== null;
    const auth = hasTabSession ? sessAuth === "true" : sessionStorage.getItem("isAuthenticated") === "true";
    if (auth) {
      // Authenticated but wrong role
      return <Navigate to="/access-denied" replace />;
    }
    const expires = sessionStorage.getItem("sessionExpiresAt") || (!hasTabSession ? sessionStorage.getItem("sessionExpiresAt") : null);
    const wasSessionExpired = expires && Date.now() > Number(expires);

    return (
      <Navigate
        to="/login"
        replace
        state={{
          fromProtected: true,
          sessionExpired: wasSessionExpired,
        }}
      />
    );
  }

  return children;
}

function TenantProtectedRoute({ children }) {
  const checkCurrentTabAuth = () => {
    const sessAuth = sessionStorage.getItem("isAuthenticated");
    const hasTabSession = sessAuth !== null;
    const auth = hasTabSession ? sessAuth === "true" : sessionStorage.getItem("isAuthenticated") === "true";
    const role = (sessionStorage.getItem("userRole") || (!hasTabSession ? sessionStorage.getItem("userRole") : "") || "").toLowerCase();
    const expires = sessionStorage.getItem("sessionExpiresAt") || (!hasTabSession ? sessionStorage.getItem("sessionExpiresAt") : null);
    if (!auth || role !== "tenant" || (expires && Date.now() > Number(expires))) {
      return false;
    }
    return true;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(checkCurrentTabAuth);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(checkCurrentTabAuth());
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [location]);

  if (!isAuthenticated) {
    const sessAuth = sessionStorage.getItem("isAuthenticated");
    const hasTabSession = sessAuth !== null;
    const auth = hasTabSession ? sessAuth === "true" : sessionStorage.getItem("isAuthenticated") === "true";
    if (auth) {
      // Authenticated but wrong role
      return <Navigate to="/access-denied" replace />;
    }
    const expires = sessionStorage.getItem("sessionExpiresAt") || (!hasTabSession ? sessionStorage.getItem("sessionExpiresAt") : null);
    const wasSessionExpired = expires && Date.now() > Number(expires);

    return (
      <Navigate
        to="/login"
        replace
        state={{
          fromProtected: true,
          sessionExpired: wasSessionExpired,
        }}
      />
    );
  }

  return children;
}

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem("properties");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let changed = false;
        const updated = parsed.map((item) => {
          if (item.price && item.price.endsWith("/yr")) {
            changed = true;
            return {
              ...item,
              price: item.price.replace("/yr", "/mo"),
            };
          }
          return item;
        });
        if (changed) {
          localStorage.setItem("properties", JSON.stringify(updated));
        }
      } catch (err) {
        console.error("Failed to migrate properties storage:", err);
      }
    }
  }, []);

  return (
    <ToastProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/explore" replace />} />
                <Route path="/explore" element={<GuestDashboard />} />
                <Route path="/listings/:id" element={<ListingDetail />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/verify" element={<Navigate to="/signup" replace />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/access-denied" element={<AccessDenied />} />

                {/* Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/apply/:listingId"
                  element={
                    <TenantProtectedRoute>
                      <Application />
                    </TenantProtectedRoute>
                  }
                />
                <Route
                  path="/add-property"
                  element={
                    <LandlordProtectedRoute>
                      <AddProperty />
                    </LandlordProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/landlord"
                  element={
                    <LandlordProtectedRoute>
                      <LandlordDashboard />
                    </LandlordProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/landlord/add-property"
                  element={
                    <LandlordProtectedRoute>
                      <DashboardAddProperty />
                    </LandlordProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/landlord/properties/:id"
                  element={
                    <LandlordProtectedRoute>
                      <PropertyDetail />
                    </LandlordProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/tenant"
                  element={
                    <TenantProtectedRoute>
                      <TenantDashboard />
                    </TenantProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </ToastProvider>
  );
}
