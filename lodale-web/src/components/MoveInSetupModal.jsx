import React, { useState } from "react";
import { Key, Calendar, FileText, CheckCircle2, X, AlertCircle } from "lucide-react";
import { chatService } from "../services/chatService";
import { triggerToast } from "../context/ToastContext";

export default function MoveInSetupModal({ isOpen, onClose, application, onSuccess }) {
  const [moveInDate, setMoveInDate] = useState(
    application?.moveInDate || new Date().toISOString().split("T")[0]
  );
  const [keyPickupLocation, setKeyPickupLocation] = useState(
    application?.propertyAddress || application?.propertyTitle || ""
  );
  const [keyPickupTime, setKeyPickupTime] = useState("10:00 AM");
  const [houseRules, setHouseRules] = useState(
    "1. Quiet hours strictly observed from 10:00 PM to 07:00 AM.\n2. Trash must be disposed of in designated bins by 08:00 AM.\n3. Subletting is strictly prohibited.\n4. Pets must be pre-registered with management."
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const appId = application.id;
      const tenantId = application.tenantId || application.tenant_id || application.tenant?.id;
      
      const moveInSetupObj = {
        appId: String(appId),
        moveInDate,
        keyPickupLocation,
        keyPickupTime,
        houseRules,
        additionalNotes,
        issuedAt: new Date().toISOString()
      };

      // Store move-in instructions in localStorage
      localStorage.setItem(`moveInRules_${appId}`, JSON.stringify(moveInSetupObj));

      // Persist application status as move_in_ready / leased
      const localLeasedIds = JSON.parse(localStorage.getItem("leasedAppIds") || "[]");
      if (!localLeasedIds.includes(String(appId))) {
        localLeasedIds.push(String(appId));
        localStorage.setItem("leasedAppIds", JSON.stringify(localLeasedIds));
      }

      // Send chat notification to tenant
      if (tenantId) {
        const msg = `[MOVE-IN GUIDELINES & HOUSE RULES UNLOCKED]\nProperty: ${application.propertyTitle}\nKey Pickup Date: ${moveInDate} at ${keyPickupTime}\nPickup Location: ${keyPickupLocation}\n\nHouse Rules:\n${houseRules}${additionalNotes ? `\n\nAdditional Instructions:\n${additionalNotes}` : ''}\n\nWelcome to your new home!`;
        await chatService.sendMessage(tenantId, msg, application.propertyId);
      }

      triggerToast("Move-in guidelines and house rules issued to tenant!", "success");
      if (onSuccess) onSuccess(moveInSetupObj);
      onClose();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to issue move-in instructions", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#16241F] rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-moss-100 dark:bg-[#E5C583]/15 text-moss-800 dark:text-[#E5C583] rounded-2xl">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink-900 dark:text-white">Move-in Instructions & House Rules</h2>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">
                Set key handover details and house guidelines for tenant move-in.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-ink-400 hover:text-ink-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Key Handover Date</label>
              <input
                type="date"
                required
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
              />
            </div>
            <div>
              <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Key Pickup Time</label>
              <select
                value={keyPickupTime}
                onChange={(e) => setKeyPickupTime(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Key Pickup Location / Address</label>
            <input
              type="text"
              required
              placeholder="e.g. Property Security Post or Management Office"
              value={keyPickupLocation}
              onChange={(e) => setKeyPickupLocation(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
            />
          </div>

          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Property & House Rules</label>
            <textarea
              rows={4}
              required
              value={houseRules}
              onChange={(e) => setHouseRules(e.target.value)}
              placeholder="List rules regarding quiet hours, trash, subletting, parking..."
              className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600 resize-none font-sans leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Additional Utility / Key Instructions (Optional)</label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Electric meter token account details, WiFi code, gate remote ID..."
              className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Issue Move-in Package & Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
