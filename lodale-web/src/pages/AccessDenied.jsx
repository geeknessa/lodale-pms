import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";

export default function AccessDenied() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "landlord") {
      navigate("/dashboard/landlord");
    } else if (userRole === "tenant" || userRole === "user") {
      navigate("/dashboard/tenant");
    } else {
      navigate("/explore");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F6] dark:bg-[#263b33] text-ink-900 dark:text-white flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-200">
      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Top Logo Branding */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Glassmorphic Card */}
        <div className="w-full bg-[#FAF8F6]/75 dark:bg-[#101F1A]/70 backdrop-blur-lg border border-white/80 dark:border-[#23372B]/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] rounded-[20px] sm:rounded-[24px] p-6 sm:p-8 space-y-6 transition-all duration-300">
          <div className="text-5xl text-rose-500 flex justify-center">
            <ShieldAlert className="h-16 w-16 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink-900 dark:text-white leading-tight">
              Access Denied
            </h1>
            <p className="text-[13px] sm:text-[14px] text-ink-700 dark:text-cream-100/75 leading-relaxed">
              You do not have the required administrative permissions to access this page. Please return to your user dashboard.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleGoBack}
              className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#263b33] border-0 font-bold py-2.5 rounded-xl text-[13px] cursor-pointer hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
