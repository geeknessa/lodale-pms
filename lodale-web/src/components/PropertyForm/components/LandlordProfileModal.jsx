import { User, Star } from "lucide-react";

export default function LandlordProfileModal({
  showLandlordProfileModal,
  setShowLandlordProfileModal,
  landlordAvatar,
  username
}) {
  if (!showLandlordProfileModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#12221C] rounded-3xl border border-[#E4EAE1] dark:border-white/10 max-w-sm w-full p-8 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-white/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
          onClick={() => setShowLandlordProfileModal(false)}
        >
          &times;
        </button>

        {/* Profile Avatar */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="w-full h-full flex items-center justify-center bg-[#2C4633]/10 dark:bg-[#1E382A] rounded-full border-4 border-[#E4EAE1] dark:border-white/10 text-[#2C4633] dark:text-[#E5C583] overflow-hidden text-2xl font-bold">
            {landlordAvatar ? (
              <img src={landlordAvatar} alt="Landlord profile" className="w-full h-full object-cover" />
            ) : (
              <span>{username ? username.charAt(0).toUpperCase() : <User className="w-12 h-12" />}</span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 bg-emerald-500 h-5 w-5 rounded-full border-2 border-white dark:border-[#12221C] shadow-sm z-10" />
        </div>

        {/* Name & Role */}
        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1">{username}</h3>
        <span className="inline-block bg-[#2C4633]/10 dark:bg-[#E5C583]/10 text-[#2C4633] dark:text-[#E5C583] text-[11px] font-bold px-3 py-1 rounded-full mb-6">
          Verified Landlord
        </span>

        {/* Details List */}
        <div className="space-y-3.5 text-left border-t border-slate-100 dark:border-white/10 pt-5">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-400 dark:text-slate-400 font-medium">Email Address</span>
            <span className="text-slate-900 dark:text-white font-semibold">
              {sessionStorage.getItem("lastLoggedInEmail") || "ada.k@lodale.com"}
            </span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-400 dark:text-slate-400 font-medium">Phone Number</span>
            <span className="text-slate-900 dark:text-white font-semibold">
              {(() => {
                try {
                  const p = JSON.parse(sessionStorage.getItem("currentUserProfile") || "{}");
                  return p.phone || "+234 803 123 4567";
                } catch (e) {
                  return "+234 803 123 4567";
                }
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-400 dark:text-slate-400 font-medium">Account Rating</span>
            <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-1">
              {(() => {
                let score = "New";
                let count = 0;
                try {
                  const saved = localStorage.getItem("landlordReviews");
                  if (saved) {
                    const rList = JSON.parse(saved);
                    if (Array.isArray(rList) && rList.length > 0) {
                      score = (rList.reduce((sum, r) => sum + Number(r.rating || 5), 0) / rList.length).toFixed(1);
                      count = rList.length;
                    }
                  }
                } catch (e) {}

                if (count === 0) {
                  return (
                    <span className="text-slate-500 font-normal">
                      New (No reviews yet)
                    </span>
                  );
                }

                return (
                  <>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 inline" /> {score}{" "}
                    <span className="text-[11px] text-slate-400 font-normal">({count} {count === 1 ? "review" : "reviews"})</span>
                  </>
                );
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-400 dark:text-slate-400 font-medium">Member Since</span>
            <span className="text-slate-900 dark:text-white font-semibold">
              Aug 2026
            </span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-400 dark:text-slate-400 font-medium">Portfolio Status</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Active Registration
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          type="button"
          onClick={() => setShowLandlordProfileModal(false)}
          className="mt-6 w-full py-3 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] font-bold text-[13.5px] rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-md border-none outline-none"
        >
          Close Profile
        </button>
      </div>
    </div>
  );
}
