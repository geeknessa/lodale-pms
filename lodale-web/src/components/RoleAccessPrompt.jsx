import { useNavigate } from "react-router-dom";
import { Building2, Key, ArrowLeft, PlusCircle, ShieldAlert } from "lucide-react";
import { Logo } from "./Logo";
import Button from "./Button";
import { useTheme } from "../context/ThemeContext";

/**
 * Single unified access prompt component for role restriction (Landlord / Tenant)
 */
export default function RoleAccessPrompt({ requiredRole = "landlord" }) {
  useTheme();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("lastLoggedInEmail") || "your account";

  const isLandlordRequired = requiredRole === "landlord";
  const currentRoleName = isLandlordRequired ? "Tenant" : "Landlord";
  const requiredRoleName = isLandlordRequired ? "Landlord" : "Tenant";

  const handleCreateAccount = () => {
    navigate("/signup", { state: { presetRole: requiredRole, skipRolePicker: true } });
  };

  const handleReturnToDashboard = () => {
    navigate(isLandlordRequired ? "/dashboard/tenant" : "/dashboard/landlord");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F6] dark:bg-[#0B1512] text-ink-900 dark:text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans transition-colors duration-200">
      <div className="w-full max-w-md space-y-4 sm:space-y-6 relative z-10 animate-fade-in">
        {/* Top Logo Branding */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Glassmorphic Prompt Card */}
        <div className="w-full bg-[#FAF8F6]/85 dark:bg-[#101F1A]/85 backdrop-blur-lg border border-white/80 dark:border-[#23372B]/60 shadow-[0_12px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-[20px] sm:rounded-[24px] p-6 sm:p-8 space-y-5 transition-all duration-300">
          
          <div className={`inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl mb-1 border ${
            isLandlordRequired 
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          }`}>
            {isLandlordRequired ? <Building2 className="h-7 w-7 sm:h-8 sm:w-8" /> : <Key className="h-7 w-7 sm:h-8 sm:w-8" />}
          </div>

          <div className="space-y-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
              isLandlordRequired
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
            }`}>
              <ShieldAlert className="h-3.5 w-3.5" />
              {requiredRoleName} Account Required
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink-900 dark:text-white leading-tight">
              {requiredRoleName} Access Restricted
            </h1>

            <p className="text-[13px] sm:text-[14px] text-ink-700 dark:text-cream-100/75 leading-relaxed pt-1">
              You are currently signed in as a <span className="font-bold text-moss-700 dark:text-[#E5C583]">{currentRoleName}</span> ({userEmail}).
              To access {requiredRoleName.toLowerCase()} features and tools, you need a <span className="font-bold">{requiredRoleName} account</span>.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCreateAccount}
              className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#0B1512] border-0 font-bold py-3 rounded-xl text-[13.5px] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 outline-none shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Create a {requiredRoleName} Account
            </Button>

            <button
              onClick={handleReturnToDashboard}
              className="w-full py-2.5 px-4 text-[13px] font-semibold text-ink-700 dark:text-cream-100/70 hover:text-ink-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2 outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to {currentRoleName} Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandlordAccessPrompt() {
  return <RoleAccessPrompt requiredRole="landlord" />;
}

export function TenantAccessPrompt() {
  return <RoleAccessPrompt requiredRole="tenant" />;
}
