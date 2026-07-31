import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import GuestDashboard from "./pages/GuestDashboard";
import ListingDetail from "./pages/ListingDetail";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Welcome from "./pages/Welcome";
import Application from "./pages/Application";
import AddProperty from "./pages/AddProperty";
import AdminDashboard from "./pages/AdminDashboard";
import AccessDenied from "./pages/AccessDenied";
import React from "react";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import AdminDashboard from "./pages/AdminDashboard";
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
        <div className="min-h-screen bg-[#0B1512] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
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
            <div className="bg-[#13221C] border border-[#23372B] p-4 rounded-xl text-left font-mono text-[11px] text-[#A3BCA7] overflow-auto max-h-40">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-4 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#E5C583] hover:bg-[#D8B672] text-[#0B1512] font-bold px-6 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors outline-none"
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
    const auth = localStorage.getItem("isAuthenticated") === "true";
    const expires = localStorage.getItem("sessionExpiresAt");
    if (auth && expires && Date.now() > Number(expires)) {
      // Session expired
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("sessionExpiresAt");
      return false;
    }
    return auth;
  });

  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated") === "true";
      const expires = localStorage.getItem("sessionExpiresAt");
      if (auth && expires && Date.now() > Number(expires)) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("sessionExpiresAt");
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
    const expires = localStorage.getItem("sessionExpiresAt");
    const wasSessionExpired = expires && Date.now() > Number(expires);

    // Clear storage just in case
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("sessionExpiresAt");

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem("isAuthenticated") === "true";
    const expires = localStorage.getItem("sessionExpiresAt");
    if (auth && expires && Date.now() > Number(expires)) {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("sessionExpiresAt");
      localStorage.removeItem("userRole");
      return false;
    }
    return auth;
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("userRole");
  });

  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated") === "true";
      const expires = localStorage.getItem("sessionExpiresAt");
      if (auth && expires && Date.now() > Number(expires)) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("sessionExpiresAt");
        localStorage.removeItem("userRole");
        setIsAuthenticated(false);
        setUserRole(null);
      } else {
        setIsAuthenticated(auth);
        setUserRole(localStorage.getItem("userRole"));
      }
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [location]);

  if (!isAuthenticated) {
    const expires = localStorage.getItem("sessionExpiresAt");
    const wasSessionExpired = expires && Date.now() > Number(expires);

    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("sessionExpiresAt");
    localStorage.removeItem("userRole");

    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          fromProtected: true,
          sessionExpired: wasSessionExpired,
        }}
      />
    );
  }

  if (userRole !== "admin") {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollToTop />
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
              path="/welcome/:role"
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apply/:listingId"
              element={
                <ProtectedRoute>
                  <Application />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-property"
              element={
                <ProtectedRoute>
                  <AddProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:role"
              element={
                <ProtectedRoute>
                  <DashboardPlaceholder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
