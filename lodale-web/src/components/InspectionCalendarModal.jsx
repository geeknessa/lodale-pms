import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, 
  Clock, MapPin, User, MessageSquare
} from "lucide-react";
import { inspectionService } from "../services/inspectionService";
import { chatService } from "../services/chatService";
import { triggerToast } from "../context/ToastContext";

export default function InspectionCalendarModal({ isOpen, onClose, userRole = "landlord", onSelectApp, setActiveTab }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const all = inspectionService.getAllInspections();
      setInspections(all);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleMessagePartner = async (inspection) => {
    const recipientId = userRole === "landlord" ? inspection.tenantId : inspection.landlordId;
    const partnerName = userRole === "landlord" ? inspection.tenantName : inspection.landlordName;
    if (!recipientId) {
      triggerToast("Partner details unavailable.", "error");
      return;
    }
    try {
      const msg = `Hello ${partnerName}, regarding our inspection scheduled for ${inspection.date} at ${inspection.time} for ${inspection.propertyTitle}...`;
      await chatService.sendMessage(recipientId, msg, inspection.propertyId);
      sessionStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatPartnerId", recipientId);
      triggerToast("Chat opened with " + partnerName, "success");
      onClose();
      if (setActiveTab) setActiveTab(userRole === "landlord" ? 3 : 2);
    } catch (e) {
      console.error(e);
      triggerToast("Failed to initiate chat", "error");
    }
  };

  // Map inspections by YYYY-MM-DD string
  const inspectionsByDate = {};
  inspections.forEach(item => {
    if (!item.date) return;
    const dStr = item.date.split("T")[0];
    if (!inspectionsByDate[dStr]) inspectionsByDate[dStr] = [];
    inspectionsByDate[dStr].push(item);
  });

  const selectedDayInspections = inspectionsByDate[selectedDateStr] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-[#12221C] rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[92vh] overflow-y-auto relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-moss-100 dark:bg-[#E5C583]/15 text-moss-800 dark:text-[#E5C583] rounded-2xl">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink-900 dark:text-white">Inspection Schedule Calendar</h2>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">
                Track and manage property inspection appointments for your applications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-400 hover:text-ink-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: CALENDAR GRID */}
          <div className="lg:col-span-7 bg-cream-50/50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-5 shadow-xs">
            
            {/* MONTH NAVIGATOR */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-base text-ink-900 dark:text-white">
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12221C] text-ink-700 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDateStr(new Date().toISOString().split("T")[0]);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12221C] text-ink-700 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12221C] text-ink-700 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* DAY HEADERS */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-ink-400 dark:text-cream-100/50 uppercase tracking-wider mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* DAYS GRID */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-11 sm:h-12 rounded-xl bg-transparent" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = inspectionsByDate[dStr] || [];
                const isSelected = selectedDateStr === dStr;
                const isToday = new Date().toISOString().split("T")[0] === dStr;

                return (
                  <button
                    key={dStr}
                    onClick={() => setSelectedDateStr(dStr)}
                    className={`h-11 sm:h-12 rounded-xl p-1 flex flex-col items-center justify-between transition-all cursor-pointer relative border ${
                      isSelected
                        ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#263b33] border-moss-800 dark:border-[#E5C583] font-bold shadow-sm"
                        : isToday
                        ? "bg-moss-50 dark:bg-moss-900/30 text-moss-800 dark:text-[#E5C583] border-moss-300 dark:border-moss-700 font-bold"
                        : "bg-white dark:bg-[#12221C] text-ink-800 dark:text-cream-100 border-neutral-200/80 dark:border-neutral-800/80 hover:border-moss-400"
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>

                    {/* Inspection Badges / Dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSelected
                                ? "bg-white dark:bg-[#263b33]"
                                : ev.status === "Confirmed"
                                ? "bg-emerald-500"
                                : ev.status === "Scheduled"
                                ? "bg-amber-500"
                                : "bg-sky-500"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {/* RIGHT: DAY AGENDA VIEW */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 mb-3">
                <h3 className="font-extrabold text-sm text-ink-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" /> 
                  Agenda for {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("en-GB", { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </h3>
                <span className="text-[11px] font-bold bg-moss-700/10 text-moss-700 dark:text-[#E5C583] dark:bg-[#E5C583]/15 px-2 py-0.5 rounded-full">
                  {selectedDayInspections.length} Event{selectedDayInspections.length !== 1 ? 's' : ''}
                </span>
              </div>

              {selectedDayInspections.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-white/5 my-2">
                  <CalendarIcon className="h-8 w-8 text-ink-300 dark:text-cream-100/40 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-ink-500 dark:text-cream-100/60">
                    No inspection appointments scheduled on this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {selectedDayInspections.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-2xl bg-white dark:bg-[#12221C] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-ink-900 dark:text-white">
                            {item.propertyTitle}
                          </h4>
                          <p className="text-[11.5px] font-semibold text-moss-700 dark:text-[#E5C583] flex items-center gap-1 mt-0.5">
                            <User className="h-3.5 w-3.5" />
                            {userRole === "landlord" ? `Applicant: ${item.tenantName}` : `Landlord: ${item.landlordName}`}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                          item.status === "Confirmed" ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30" :
                          item.status === "Scheduled" ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30" :
                          "bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30"
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-ink-600 dark:text-cream-100/80 bg-cream-50 dark:bg-white/5 p-2.5 rounded-xl border border-neutral-100 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                          <span className="font-bold">{item.time}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583] shrink-0 mt-0.5" />
                          <span className="font-medium line-clamp-1">{item.location}</span>
                        </div>
                        {item.notes && (
                          <div className="pt-1 border-t border-neutral-200/60 dark:border-white/5 italic text-[11px]">
                            "{item.notes}"
                          </div>
                        )}
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => handleMessagePartner(item)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat Partner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-ink-800 dark:text-cream-100 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Calendar
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
