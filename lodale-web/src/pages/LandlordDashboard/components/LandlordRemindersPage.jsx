import React, { useState } from 'react';
import { Bell, Calendar, Clock, CheckCircle2, AlertCircle, Send, Settings, Sliders, ShieldCheck, Mail, ChevronRight } from 'lucide-react';
import Button from '../../../components/Button';
import { reminderService } from '../../../services/reminderService';
import { inspectionService } from '../../../services/inspectionService';
import { triggerToast } from '../../../context/ToastContext';

// Interactive sliding Toggle Switch component
const ToggleSwitch = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-3 cursor-pointer select-none">
    {label && <span className="text-xs font-extrabold text-ink-800 dark:text-cream-100">{label}</span>}
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

export default function LandlordRemindersPage({ activeTenants = [] }) {
  const [subTab, setSubTab] = useState('upcoming'); // 'upcoming' | 'settings' | 'logs'
  const [settings, setSettings] = useState(() => reminderService.getSettings());
  const [inspections, setInspections] = useState(() => inspectionService.getAllInspections());
  const [manualDispatchingId, setManualDispatchingId] = useState(null);

  const toggleRentLeadDay = (day) => {
    const current = settings.rentLeadDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => b - a);
    
    const newSettings = { ...settings, rentLeadDays: updated };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
    triggerToast(`Rent reminder schedule updated to ${updated.join(', ')} days before due date`, "success");
  };

  const toggleInspectionLeadDay = (day) => {
    const current = settings.inspectionLeadDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => b - a);

    const newSettings = { ...settings, inspectionLeadDays: updated };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
    triggerToast(`Inspection reminder schedule updated to ${updated.join(', ')} days before inspection`, "success");
  };

  const handleToggleAutoRent = () => {
    const newSettings = { ...settings, autoRentRemindersEnabled: !settings.autoRentRemindersEnabled };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
    triggerToast(`Automated Rent Reminders ${newSettings.autoRentRemindersEnabled ? 'Enabled' : 'Disabled'}`, "info");
  };

  const handleToggleAutoInspection = () => {
    const newSettings = { ...settings, autoInspectionRemindersEnabled: !settings.autoInspectionRemindersEnabled };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
    triggerToast(`Automated Inspection Reminders ${newSettings.autoInspectionRemindersEnabled ? 'Enabled' : 'Disabled'}`, "info");
  };

  const handleSaveMessageTemplates = () => {
    reminderService.saveSettings(settings);
    triggerToast("Reminder templates saved successfully!", "success");
  };

  const handleSendManualRentReminder = (tenant) => {
    const idKey = tenant.id || tenant.name;
    setManualDispatchingId(idKey);
    setTimeout(() => {
      reminderService.dispatchRentReminder(tenant, "Manual Request", true);
      setManualDispatchingId(null);
      triggerToast(`Reminder sent directly to ${tenant.name || tenant.tenantName}!`, "success");
    }, 600);
  };

  const handleSendManualInspectionReminder = (insp) => {
    const idKey = insp.appId || insp.id;
    setManualDispatchingId(idKey);
    setTimeout(() => {
      reminderService.dispatchInspectionReminder(insp, "Manual Request", true);
      setManualDispatchingId(null);
      triggerToast(`Inspection reminder sent for ${insp.propertyTitle}!`, "success");
    }, 600);
  };

  // Inspection list
  const upcomingInspectionsList = Object.values(inspections).filter(i => i.status === 'scheduled');
  const pastLogs = typeof reminderService.getLogs === 'function' ? reminderService.getLogs() : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-moss-900 via-moss-800 to-moss-950 text-white shadow-xl border border-moss-700/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 text-[#E5C583]">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#E5C583] flex items-center gap-2">
                Automated Reminders & Notifications Hub
              </h2>
              <p className="text-xs text-cream-100/90 mt-1 max-w-2xl leading-relaxed">
                Configure automated rent due alerts, inspection notifications, lead days, and message templates. Tenants receive automated SMS and email notifications before key due dates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/10 shrink-0">
            <div className="text-right">
              <span className="text-[11px] font-bold text-cream-100/70 block uppercase">Auto-Rent Status</span>
              <span className={`text-xs font-black ${settings.autoRentRemindersEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                {settings.autoRentRemindersEnabled ? 'Active (Auto-Dispatch)' : 'Disabled'}
              </span>
            </div>
            <ToggleSwitch checked={settings.autoRentRemindersEnabled} onChange={handleToggleAutoRent} />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-ink-100 dark:border-white/10 pb-3">
        <button
          onClick={() => setSubTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'upcoming'
              ? 'bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#0B1512] shadow-sm'
              : 'text-ink-600 dark:text-cream-100/70 hover:bg-ink-100 dark:hover:bg-white/5'
          }`}
        >
          📅 Upcoming Due Dates & Inspections
        </button>
        <button
          onClick={() => setSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'settings'
              ? 'bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#0B1512] shadow-sm'
              : 'text-ink-600 dark:text-cream-100/70 hover:bg-ink-100 dark:hover:bg-white/5'
          }`}
        >
          ⚙️ Rules & Lead Time Schedules
        </button>
        <button
          onClick={() => setSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'logs'
              ? 'bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#0B1512] shadow-sm'
              : 'text-ink-600 dark:text-cream-100/70 hover:bg-ink-100 dark:hover:bg-white/5'
          }`}
        >
          📋 Dispatch Logs ({pastLogs.length})
        </button>
      </div>

      {/* SUB-TAB 1: UPCOMING SCHEDULES */}
      {subTab === 'upcoming' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Tenants Rent Reminders */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#12221C] border border-ink-100 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-moss-600 dark:text-[#E5C583]" />
                <h3 className="font-bold text-sm text-ink-900 dark:text-white">Active Rent Schedules</h3>
              </div>
              <span className="text-xs font-bold text-moss-700 dark:text-[#E5C583] bg-moss-50 dark:bg-moss-950/60 px-2.5 py-1 rounded-full">
                {activeTenants.length} Active Tenants
              </span>
            </div>

            {activeTenants.length === 0 ? (
              <div className="text-center py-10 text-ink-500 dark:text-cream-100/70">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">No active tenant rent schedules found.</p>
                <p className="text-[11px] mt-1">Rent reminders automatically track once tenant leases are active.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTenants.map((t) => (
                  <div key={t.id || t.name} className="p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-ink-900 dark:text-white">{t.name}</h4>
                      <p className="text-[11px] text-ink-500 dark:text-cream-100/70 mt-0.5">{t.propertyTitle || 'Leased Unit'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          Due 15th of month
                        </span>
                        <span className="text-[10px] font-semibold text-ink-500 dark:text-cream-100/60">
                          ₦{Number(t.rentAmount || 2500000).toLocaleString()}/yr
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSendManualRentReminder(t)}
                      disabled={manualDispatchingId === (t.id || t.name)}
                      className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{manualDispatchingId === (t.id || t.name) ? 'Sending...' : 'Send Direct Reminder'}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Property Inspections */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#12221C] border border-ink-100 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-moss-600 dark:text-[#E5C583]" />
                <h3 className="font-bold text-sm text-ink-900 dark:text-white">Scheduled Inspection Alerts</h3>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full">
                {upcomingInspectionsList.length} Scheduled
              </span>
            </div>

            {upcomingInspectionsList.length === 0 ? (
              <div className="text-center py-10 text-ink-500 dark:text-cream-100/70">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">No upcoming property inspections scheduled.</p>
                <p className="text-[11px] mt-1">Inspection dates scheduled with tenants will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInspectionsList.map((insp) => (
                  <div key={insp.appId || insp.id} className="p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-ink-900 dark:text-white">{insp.propertyTitle || 'Property Unit'}</h4>
                      <p className="text-[11px] text-ink-500 dark:text-cream-100/70 mt-0.5">Tenant: {insp.applicantName || 'Tenant'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          📅 {insp.date} at {insp.time}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSendManualInspectionReminder(insp)}
                      disabled={manualDispatchingId === (insp.appId || insp.id)}
                      className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{manualDispatchingId === (insp.appId || insp.id) ? 'Sending...' : 'Remind Tenant'}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SETTINGS & SCHEDULE CONFIGURATION */}
      {subTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12221C] border border-ink-100 dark:border-white/10 shadow-sm space-y-6 text-left">
          <div>
            <h3 className="font-bold text-base text-ink-900 dark:text-white mb-1">Automated Dispatch Notice Lead Times</h3>
            <p className="text-xs text-ink-500 dark:text-cream-100/70">
              Select how many days prior to rent due dates and property inspections automated reminders are dispatched to tenants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rent Due Lead Times */}
            <div className="p-5 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-ink-900 dark:text-white uppercase tracking-wider">Rent Due Notice Lead Times</h4>
                <ToggleSwitch checked={settings.autoRentRemindersEnabled} onChange={handleToggleAutoRent} />
              </div>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">
                Click days below to toggle when automated rent reminders fire before due date:
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {[7, 5, 3, 1].map((day) => {
                  const isActive = (settings.rentLeadDays || []).includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleRentLeadDay(day)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-600 text-white dark:bg-[#E5C583] dark:text-[#0B1512] border-emerald-600 dark:border-[#E5C583] shadow-xs'
                          : 'bg-white dark:bg-white/10 text-ink-600 dark:text-cream-100/70 border-ink-200 dark:border-white/10 hover:border-moss-500'
                      }`}
                    >
                      {day} {day === 1 ? 'Day Before' : 'Days Before'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inspection Notice Lead Times */}
            <div className="p-5 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-ink-900 dark:text-white uppercase tracking-wider">Inspection Lead Times</h4>
                <ToggleSwitch checked={settings.autoInspectionRemindersEnabled} onChange={handleToggleAutoInspection} />
              </div>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">
                Select days before property inspections to notify tenants:
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {[7, 3, 1].map((day) => {
                  const isActive = (settings.inspectionLeadDays || []).includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleInspectionLeadDay(day)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-600 text-white dark:bg-[#E5C583] dark:text-[#0B1512] border-emerald-600 dark:border-[#E5C583] shadow-xs'
                          : 'bg-white dark:bg-white/10 text-ink-600 dark:text-cream-100/70 border-ink-200 dark:border-white/10 hover:border-moss-500'
                      }`}
                    >
                      {day} {day === 1 ? 'Day Before' : 'Days Before'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Message Template Customizer */}
          <div className="pt-4 border-t border-ink-100 dark:border-white/10 space-y-4">
            <h4 className="font-bold text-xs text-ink-900 dark:text-white uppercase tracking-wider">Automated Notification Message Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Rent Reminder Message Template</label>
                <textarea
                  rows={3}
                  value={settings.rentMessageTemplate}
                  onChange={(e) => setSettings({ ...settings, rentMessageTemplate: e.target.value })}
                  className="w-full p-3 text-xs rounded-xl bg-ink-50 dark:bg-white/5 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-moss-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Inspection Reminder Template</label>
                <textarea
                  rows={3}
                  value={settings.inspectionMessageTemplate}
                  onChange={(e) => setSettings({ ...settings, inspectionMessageTemplate: e.target.value })}
                  className="w-full p-3 text-xs rounded-xl bg-ink-50 dark:bg-white/5 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-moss-600"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveMessageTemplates} className="px-5 py-2.5 text-xs font-bold">
                Save Message Templates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DISPATCH LOGS */}
      {subTab === 'logs' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12221C] border border-ink-100 dark:border-white/10 shadow-sm space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
            <h3 className="font-bold text-sm text-ink-900 dark:text-white">Sent Reminder Log Audit</h3>
            <span className="text-xs text-ink-500 dark:text-cream-100/70">{pastLogs.length} Records</span>
          </div>

          {pastLogs.length === 0 ? (
            <div className="py-12 text-center text-ink-400 dark:text-cream-100/60">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">No reminders sent yet.</p>
              <p className="text-[11px] mt-1">Dispatched reminders to tenants will record an audit trail here.</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100 dark:divide-white/10">
              {pastLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#E5C583] flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-ink-900 dark:text-white">{log.recipientName} ({log.type})</p>
                      <p className="text-[11px] text-ink-500 dark:text-cream-100/70">{log.message}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-ink-400 shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
