import { ArrowLeft, Bell, BellOff, HelpCircle, Building2, Layers, SlidersHorizontal, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Logo } from "../../Logo";

export const stepsInfo = [
  { step: 1, label: "Type & Location", icon: Building2, desc: "Establish building identity & street address" },
  { step: 2, label: "Units & Specifications", icon: Layers, desc: "Setup unit layout & rental pricing" },
  { step: 3, label: "Amenities & Guidelines", icon: SlidersHorizontal, desc: "Select utilities & property rules" },
  { step: 4, label: "Legal Proof & Photos", icon: ShieldCheck, desc: "Attach legal document & picture gallery" },
  { step: 5, label: "Occupancy & Submit", icon: CheckCircle2, desc: "Configure current occupancy status" }
];

export default function PropertyFormHeader({
  isStandalone,
  isEditing,
  currentStep,
  setCurrentStep,
  setFormError,
  navigate,
  showNotifDropdown,
  setShowNotifDropdown,
  notifications,
  unreadNotifCount,
  markAllNotifsRead,
  setNotifications,
  setTourStep,
  setRunTour,
  setShowLandlordProfileModal,
  landlordAvatar,
  username,
  isStepValid
}) {
  return (
    <>
      {/* 1. TOPBAR NAV HEADER WITH BRIGHT WHITE LODALE LOGO */}
      <header className="dap-top-nav">
        <div className="dap-nav-brand">
          <button
            type="button"
            onClick={() => navigate(isStandalone ? "/" : "/dashboard/landlord")}
            className="dap-nav-logo-btn"
          >
            <Logo variant="white" />
          </button>
        </div>

        <div className="dap-nav-actions relative">
          <button
            type="button"
            onClick={() => navigate(isStandalone ? "/" : "/dashboard/landlord")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border-none cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {isStandalone ? "Home" : "Dashboard"}
          </button>

          {/* NOTIFICATIONS BUTTON WITH BADGE & DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              className="dap-nav-icon-btn"
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown && unreadNotifCount > 0) {
                  markAllNotifsRead();
                }
              }}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9.5px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 z-[100] w-80 sm:w-[360px] rounded-3xl bg-white dark:bg-[#12221C] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4 text-left animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" />
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2C4633] text-[#E5C583] dark:bg-[#E5C583] dark:text-[#0B1512] rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                          localStorage.setItem("landlordNotifications", JSON.stringify([]));
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer border-none bg-transparent"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer border-none bg-transparent"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                      <BellOff className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">All caught up!</h4>
                      <p className="text-[11px] text-slate-400">You have no new notifications.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 relative group"
                      >
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{notif.title}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{notif.message}</div>
                        <div className="text-[9.5px] text-slate-400 mt-1">{notif.time || "Just now"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE PAGE TOUR GUIDE BUTTON */}
          <button
            type="button"
            onClick={() => {
              setTourStep(0);
              setCurrentStep(1);
              setRunTour(true);
            }}
            className="dap-nav-icon-btn"
            title="Start Interactive Channel Tour"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* DASHBOARD USER PROFILE AVATAR CIRCLE */}
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowLandlordProfileModal(true)}
            title="View landlord profile details"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#2C4633] dark:bg-[#1E382A] text-[#E5C583] font-extrabold text-sm border-2 border-emerald-400/40 shadow-xs shrink-0">
              {landlordAvatar ? (
                <img src={landlordAvatar} alt="Landlord profile" className="h-full w-full object-cover" />
              ) : (
                <span>{username ? username.charAt(0).toUpperCase() : "L"}</span>
              )}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">{username}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Verified Landlord</div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
