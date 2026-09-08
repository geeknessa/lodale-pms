import React, { useState } from 'react';
import { Bell, Calendar, Clock, CheckCircle2, AlertCircle, Send, Settings, Sliders, X, ShieldAlert } from 'lucide-react';
import { reminderService } from '../services/reminderService';
import { inspectionService } from '../services/inspectionService';

// Interactive sliding Toggle Switch component
const ToggleSwitch = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
    {label && <span className="text-xs font-extrabold text-ink-700 dark:text-cream-100">{label}</span>}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-emerald-600 dark:bg-[#E5C583]' : 'bg-ink-300 dark:bg-white/20'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#1E1E1E] shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </label>
);

export default function AutomatedRemindersModal({ isOpen, onClose, activeTenants = [], onShowToast }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'settings'
  const [settings, setSettings] = useState(() => reminderService.getSettings());
  const [inspections, setInspections] = useState(() => inspectionService.getAllInspections());
  const [manualDispatchingId, setManualDispatchingId] = useState(null);

  // Toggle lead day in setting array
  const toggleRentLeadDay = (day) => {
    const current = settings.rentLeadDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => b - a);
    
    const newSettings = { ...settings, rentLeadDays: updated };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
  };

  const toggleInspectionLeadDay = (day) => {
    const current = settings.inspectionLeadDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => b - a);

    const newSettings = { ...settings, inspectionLeadDays: updated };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
  };

  const handleToggleAutoRent = () => {
    const newSettings = { ...settings, autoRentRemindersEnabled: !settings.autoRentRemindersEnabled };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
    if (onShowToast) onShowToast(`Auto Rent Reminders ${newSettings.autoRentRemindersEnabled ? 'Enabled' : 'Disabled'}`);
  };

  const handleToggleAutoInspection = () => {
    const newSettings = { ...settings, autoInspectionRemindersEnabled: !settings.autoInspectionRemindersEnabled };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
    if (onShowToast) onShowToast(`Auto Inspection Reminders ${newSettings.autoInspectionRemindersEnabled ? 'Enabled' : 'Disabled'}`);
  };

  const handleSaveMessageTemplates = () => {
    reminderService.saveSettings(settings);
    if (onShowToast) onShowToast("Reminder templates saved successfully!");
  };

  // Manual Trigger Action
  const handleSendManualRentReminder = (tenant) => {
    const idKey = tenant.id || tenant.name;
    setManualDispatchingId(idKey);
    setTimeout(() => {
      reminderService.dispatchRentReminder(tenant, "Manual Request", true);
      setManualDispatchingId(null);
      if (onShowToast) onShowToast(`Reminder sent directly to ${tenant.name || tenant.tenantName}!`);
    }, 600);
  };

  const handleSendManualInspectionReminder = (insp) => {
    const idKey = insp.appId || insp.id;
    setManualDispatchingId(idKey);
    setTimeout(() => {
      reminderService.dispatchInspectionReminder(insp, "Manual Request", true);
      setManualDispatchingId(null);
      if (onShowToast) onShowToast(`Inspection reminder sent for ${insp.propertyTitle}!`);
    }, 600);
  };

  // Calculate upcoming timeline schedule
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rentRemindersList = activeTenants.map((t) => {
    let dueDateObj = null;
    if (t.start_date || t.startDate) {
      const s = new Date(t.start_date || t.startDate);
      dueDateObj = new Date(today.getFullYear(), today.getMonth(), s.getDate());
      if (dueDateObj < today) dueDateObj.setMonth(dueDateObj.getMonth() + 1);
    } else {
      dueDateObj = new Date(today.getFullYear(), today.getMonth(), 15);
      if (dueDateObj < today) dueDateObj.setMonth(dueDateObj.getMonth() + 1);
    }

    const diffDays = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));
    
    // Scheduled trigger dates
    const scheduledTriggers = (settings.rentLeadDays || []).map(lead => {
      const trigDate = new Date(dueDateObj);
      trigDate.setDate(trigDate.getDate() - lead);
      return {
        leadDay: lead,
        dateStr: trigDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: trigDate.toDateString() === today.toDateString(),
        isPast: trigDate < today
      };
    });

    return {
      tenant: t,
      dueDateStr: dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daysUntilDue: diffDays,
      scheduledTriggers
    };
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#1E1E1E] border border-ink-100 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-ink-900 dark:text-cream-100">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-ink-100 dark:border-white/10 flex items-center justify-between bg-ink-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Automated Reminders
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                  {settings.autoRentRemindersEnabled ? 'Active' : 'Paused'}
                </span>
              </h2>
              <p className="text-xs text-ink-500 dark:text-cream-100/60 mt-0.5">
                Track rent due dates and schedule automated tenant reminders before payments are due.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-400 hover:text-ink-900 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SUBTABS HEADER */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-ink-100 dark:border-white/10">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'upcoming'
                ? 'border-emerald-600 dark:border-[#E5C583] text-emerald-700 dark:text-[#E5C583]'
                : 'border-transparent text-ink-400 hover:text-ink-700 dark:hover:text-cream-100/80'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Upcoming Due Schedule ({activeTenants.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'border-emerald-600 dark:border-[#E5C583] text-emerald-700 dark:text-[#E5C583]'
                : 'border-transparent text-ink-400 hover:text-ink-700 dark:hover:text-cream-100/80'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Reminder Rules & Intervals
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: UPCOMING SCHEDULE & TIMELINE */}
          {activeTab === 'upcoming' && (
            <div className="space-y-6">
              
              {/* Quick Status Bar */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">Automated Dispatch System</h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400/90 mt-0.5">
                      Reminders fire automatically via in-app notification & chat message on configured lead days.
                    </p>
                  </div>
                </div>

                <ToggleSwitch
                  checked={settings.autoRentRemindersEnabled}
                  onChange={handleToggleAutoRent}
                  label={settings.autoRentRemindersEnabled ? "Auto-Reminders ON" : "Auto-Reminders OFF"}
                />
              </div>

              {/* RENT DUE DATES SECTION */}
              <div>
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-ink-400 dark:text-cream-100/50 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" /> Rent Due Dates & Reminder Schedule
                </h3>

                {rentRemindersList.length === 0 ? (
                  <div className="p-8 text-center bg-ink-50 dark:bg-white/5 rounded-2xl border border-dashed border-ink-200 dark:border-white/10 text-ink-400">
                    <p className="text-xs font-semibold">No active tenant leases configured.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rentRemindersList.map((item, idx) => {
                      const t = item.tenant;
                      const isDispatching = manualDispatchingId === (t.id || t.name);

                      return (
                        <div
                          key={t.id || idx}
                          className="p-4 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-3 hover:border-emerald-500/30 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="font-bold text-sm text-ink-900 dark:text-white">{t.name || t.tenantName}</h4>
                              <p className="text-xs text-ink-500 dark:text-cream-100/70">{t.propertyTitle || t.leaseStatus || "Leased Property"}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">Due: {item.dueDateStr}</span>
                                <span className="text-[10px] text-ink-400 dark:text-cream-100/50 block">In {item.daysUntilDue} days</span>
                              </div>

                              <button
                                onClick={() => handleSendManualRentReminder(t)}
                                disabled={isDispatching}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                title="Send immediate reminder to tenant chat & notifications"
                              >
                                <Send className="h-3.5 w-3.5" />
                                {isDispatching ? 'Sending...' : 'Send Reminder Now'}
                              </button>
                            </div>
                          </div>

                          {/* Trigger Days Timeline */}
                          <div className="pt-2 border-t border-ink-100 dark:border-white/10 flex items-center gap-2 overflow-x-auto text-[10px]">
                            <span className="font-bold text-ink-400 dark:text-cream-100/60 shrink-0">Triggers:</span>
                            {item.scheduledTriggers.map((trig, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                                  trig.isToday
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                                    : trig.isPast
                                    ? 'bg-ink-100 dark:bg-white/10 text-ink-400 border-transparent'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {trig.leadDay === 0 ? 'On Due Date' : `${trig.leadDay}d Before`} ({trig.dateStr})
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INSPECTION REMINDERS SECTION */}
              <div>
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-ink-400 dark:text-cream-100/50 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" /> Scheduled Inspection Reminders
                </h3>

                {inspections.length === 0 ? (
                  <div className="p-6 text-center bg-ink-50 dark:bg-white/5 rounded-2xl border border-dashed border-ink-200 dark:border-white/10 text-ink-400 text-xs">
                    No scheduled property inspections.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspections.map((insp, idx) => {
                      const isDispatching = manualDispatchingId === (insp.appId || insp.id);
                      return (
                        <div key={insp.appId || idx} className="p-4 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-ink-900 dark:text-white">{insp.propertyTitle || "Property Inspection"}</h4>
                            <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">
                              Tenant: {insp.tenantName || "Tenant"} • Date: <span className="font-bold">{insp.date}</span> at {insp.time || "10:00 AM"}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSendManualInspectionReminder(insp)}
                            disabled={isDispatching}
                            className="px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-900 dark:bg-white/10 dark:hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                          >
                            <Send className="h-3.5 w-3.5 text-emerald-400" />
                            {isDispatching ? 'Sending...' : 'Remind Tenant'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: REMINDER RULES & INTERVALS CONFIG */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* RENT DUE LEAD TIMES */}
              <div className="p-5 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-ink-900 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      Rent Due Reminder Lead Times
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-cream-100/60 mt-0.5">
                      Select when automated rent due reminders should be sent to tenants.
                    </p>
                  </div>

                  <ToggleSwitch
                    checked={settings.autoRentRemindersEnabled}
                    onChange={handleToggleAutoRent}
                    label={settings.autoRentRemindersEnabled ? "Enabled" : "Disabled"}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {[14, 7, 5, 3, 2, 1, 0].map((day) => {
                    const isSelected = (settings.rentLeadDays || []).includes(day);
                    const label = day === 0 ? "On Due Date" : `${day} Day${day > 1 ? 's' : ''} Before`;

                    return (
                      <button
                        key={day}
                        onClick={() => toggleRentLeadDay(day)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-white/5 text-ink-600 dark:text-cream-100/70 border-ink-200 dark:border-white/10 hover:border-emerald-500/40'
                        }`}
                      >
                        {isSelected && "✓ "}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INSPECTION LEAD TIMES */}
              <div className="p-5 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-ink-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                      Inspection Reminder Lead Times
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-cream-100/60 mt-0.5">
                      Select lead times for automated property inspection reminders.
                    </p>
                  </div>

                  <ToggleSwitch
                    checked={settings.autoInspectionRemindersEnabled}
                    onChange={handleToggleAutoInspection}
                    label={settings.autoInspectionRemindersEnabled ? "Enabled" : "Disabled"}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {[7, 3, 2, 1, 0].map((day) => {
                    const isSelected = (settings.inspectionLeadDays || []).includes(day);
                    const label = day === 0 ? "Same Day" : `${day} Day${day > 1 ? 's' : ''} Before`;

                    return (
                      <button
                        key={day}
                        onClick={() => toggleInspectionLeadDay(day)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-white/5 text-ink-600 dark:text-cream-100/70 border-ink-200 dark:border-white/10 hover:border-emerald-500/40'
                        }`}
                      >
                        {isSelected && "✓ "}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CUSTOM MESSAGE TEMPLATE */}
              <div className="p-5 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-3">
                <h3 className="text-sm font-extrabold text-ink-900 dark:text-white flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-500" />
                  Rent Reminder Message Template
                </h3>

                <textarea
                  rows={3}
                  value={settings.rentCustomMessage}
                  onChange={(e) => setSettings({ ...settings, rentCustomMessage: e.target.value })}
                  className="w-full p-3 rounded-xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#151515] text-xs font-medium text-ink-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Rent reminder template message..."
                />
                
                <p className="text-[11px] text-ink-400 dark:text-cream-100/50">
                  Available tags: <code className="bg-ink-100 dark:bg-white/10 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">{"{property}"}</code>, <code className="bg-ink-100 dark:bg-white/10 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">{"{dueDate}"}</code>, <code className="bg-ink-100 dark:bg-white/10 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">{"{amount}"}</code>
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveMessageTemplates}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Save Template Settings
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-ink-100 dark:border-white/10 bg-ink-50/50 dark:bg-white/5 flex items-center justify-between">
          <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold">
            Auto-reminders evaluate daily on dashboard load.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-ink-900 text-white dark:bg-white/10 dark:text-cream-100 hover:bg-black dark:hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
