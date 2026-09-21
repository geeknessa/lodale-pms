import React, { useState, useMemo } from 'react';
import { Bell, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Send, Settings, ShieldCheck, Mail, ChevronRight, ChevronLeft, CalendarDays, X } from 'lucide-react';
import Button from '../../../components/Button';
import { reminderService } from '../../../services/reminderService';
import { inspectionService } from '../../../services/inspectionService';
import { triggerToast } from '../../../context/ToastContext';

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
  const [settings, setSettings] = useState(() => reminderService.getSettings());
  const [inspections, setInspections] = useState([]);
  React.useEffect(() => {
    async function fetchInspections() {
      if (typeof inspectionService.getAllInspections === 'function') {
        const data = await inspectionService.getAllInspections();
        setInspections(data);
      }
    }
    fetchInspections();
  }, []);
  const [manualDispatchingId, setManualDispatchingId] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Layout States
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Inspections List
  const upcomingInspectionsList = Object.values(inspections).filter(i => i.status === 'scheduled');
  
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  React.useEffect(() => {
    async function fetchMaintenance() {
      try {
        const { maintenanceService } = await import('../../../services/maintenanceService');
        const requests = await maintenanceService.getLandlordRequests();
        if (Array.isArray(requests)) {
          // Get the 3 most recent
          setRecentMaintenance(requests.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).slice(0, 3));
        }
      } catch (err) {
        console.warn("Could not fetch maintenance for fallback activity:", err);
      }
    }
    fetchMaintenance();
  }, []);

  // Parse Events
  const events = useMemo(() => {
    const list = [];
    
    activeTenants.forEach(t => {
      // Lease Start
      if (t.leaseStart || t.startDate) {
        const startDate = new Date(t.leaseStart || t.startDate);
        if (!isNaN(startDate)) {
          list.push({
            id: `start-${t.id || t.name}`,
            date: startDate,
            type: 'lease_start',
            title: `Lease Started: ${t.name}`,
            color: 'bg-purple-500',
            tenant: t
          });
          
          // Rent Due (Assuming yearly rent in Nigeria by default, so 1 year after lease start, or use rentDueDate)
          const dueDate = t.rentDueDate ? new Date(t.rentDueDate) : new Date(startDate.setFullYear(startDate.getFullYear() + 1));
          if (!isNaN(dueDate)) {
            list.push({
              id: `due-${t.id || t.name}`,
              date: dueDate,
              type: 'rent_due',
              title: `Rent Due: ${t.name}`,
              color: 'bg-emerald-500',
              tenant: t
            });
          }
        }
      } else {
        // Fallback for hardcoded 15th if no lease start
        const fallbackDate = new Date();
        fallbackDate.setDate(15);
        list.push({
          id: `due-${t.id || t.name}`,
          date: fallbackDate,
          type: 'rent_due',
          title: `Rent Due: ${t.name}`,
          color: 'bg-emerald-500',
          tenant: t
        });
      }
    });

    upcomingInspectionsList.forEach(insp => {
      if (insp.date) {
        const d = new Date(insp.date);
        if (!isNaN(d)) {
          list.push({
            id: `insp-${insp.appId || insp.id}`,
            date: d,
            type: 'inspection',
            title: `Inspection: ${insp.propertyTitle}`,
            color: 'bg-blue-500',
            insp: insp
          });
        }
      }
    });
    
    return list;
  }, [activeTenants, upcomingInspectionsList]);

  // Settings Handlers
  const toggleRentLeadDay = (day) => {
    const current = settings.rentLeadDays || [];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort((a, b) => b - a);
    const newSettings = { ...settings, rentLeadDays: updated };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
  };

  const toggleInspectionLeadDay = (day) => {
    const current = settings.inspectionLeadDays || [];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort((a, b) => b - a);
    const newSettings = { ...settings, inspectionLeadDays: updated };
    setSettings(newSettings);
    reminderService.saveSettings(newSettings);
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

  // Calendar Helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const isSameDay = (d1, d2) => d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextYear = () => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  const prevYear = () => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));

  // Render Calendar Grid
  const renderMonthGrid = (year, month, isMini = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-full w-full opacity-0" />);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = isSameDay(date, new Date());
      const isSelected = isSameDay(date, selectedDate);
      
      const dayEvents = events.filter(e => isSameDay(e.date, date));
      
      days.push(
        <div 
          key={i} 
          onClick={() => {
            setSelectedDate(isSelected ? null : date);
            if (isMini) setViewMode('month'); // Zoom in if clicked from year view
          }}
          className={`
            relative flex flex-col items-center p-1 cursor-pointer transition-all rounded-lg border
            ${isMini ? 'h-8' : 'h-14 sm:h-20 hover:bg-moss-50 dark:hover:bg-white/5'}
            ${isSelected ? 'border-moss-600 bg-moss-50 dark:border-[#E5C583] dark:bg-white/10' : 'border-transparent'}
            ${isToday && !isSelected ? 'bg-ink-50 dark:bg-white/5 font-black' : ''}
          `}
        >
          <span className={`${isMini ? 'text-[10px]' : 'text-xs sm:text-sm'} ${isToday ? 'text-moss-700 dark:text-[#E5C583]' : 'text-ink-700 dark:text-cream-100'}`}>
            {i}
          </span>
          {dayEvents.length > 0 && (
            <div className={`flex flex-wrap justify-center gap-0.5 mt-auto ${isMini ? 'mb-0.5' : 'mb-1'}`}>
              {dayEvents.slice(0, 3).map((e, idx) => (
                <span key={idx} className={`w-1.5 h-1.5 rounded-full ${e.color}`} title={e.title} />
              ))}
              {dayEvents.length > 3 && !isMini && <span className="w-1.5 h-1.5 rounded-full bg-ink-400" />}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {isMini && (
          <h4 className="text-center text-[11px] font-bold text-ink-900 dark:text-white mb-2 uppercase tracking-wider">
            {new Date(year, month).toLocaleString('default', { month: 'long' })}
          </h4>
        )}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-ink-400 dark:text-cream-100/50 mb-1">{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Filtered feed
  const feedEvents = selectedDate 
    ? events.filter(e => isSameDay(e.date, selectedDate))
    : events.filter(e => e.date >= new Date().setHours(0,0,0,0)).sort((a,b) => a.date - b.date);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-ink-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-moss-600 dark:text-[#E5C583]" />
            Reminders & Notifications
          </h2>
          <p className="text-sm text-ink-500 dark:text-cream-100/70 mt-1 max-w-2xl leading-relaxed">
            Visual timeline of upcoming rent due dates, lease starts, and inspections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-4 py-2 bg-moss-50 dark:bg-white/5 hover:bg-moss-100 dark:hover:bg-white/10 text-moss-700 dark:text-[#E5C583] border border-moss-200 dark:border-white/10 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors"
          >
            <Settings className="w-4 h-4" /> Configuration Rules
          </Button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-6">
        
        {/* LEFT COLUMN: CALENDAR */}
        <div className="bg-white dark:bg-[#07130D] rounded-3xl p-6 border border-ink-100 dark:border-white/10 shadow-sm flex flex-col">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-ink-900 dark:text-white">
                {viewMode === 'month' 
                  ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                  : currentDate.getFullYear()
                }
              </h3>
              <div className="flex items-center bg-ink-50 dark:bg-white/5 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-white/10 text-ink-900 dark:text-white shadow-sm' : 'text-ink-500'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${viewMode === 'year' ? 'bg-white dark:bg-white/10 text-ink-900 dark:text-white shadow-sm' : 'text-ink-500'}`}
                >
                  Yearly
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={viewMode === 'month' ? prevMonth : prevYear} className="p-2 rounded-xl bg-ink-50 hover:bg-ink-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-4 h-4 text-ink-700 dark:text-cream-100" />
              </button>
              <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }} className="px-3 py-1.5 rounded-xl bg-ink-50 hover:bg-ink-100 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-ink-700 dark:text-cream-100 transition-colors">
                Today
              </button>
              <button onClick={viewMode === 'month' ? nextMonth : nextYear} className="p-2 rounded-xl bg-ink-50 hover:bg-ink-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-ink-700 dark:text-cream-100" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/70">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Rent Due</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Lease Start</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Inspection</span>
          </div>

          {/* Calendar Body */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {viewMode === 'month' ? (
              renderMonthGrid(currentDate.getFullYear(), currentDate.getMonth())
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx}>
                    {renderMonthGrid(currentDate.getFullYear(), idx, true)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FEED & LOGS */}
        <div className="flex flex-col h-[600px] lg:h-auto">
          {/* Feed Header */}
          <div className="flex items-center gap-2 mb-4">
            <h3 className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-sm">
              {selectedDate ? `Schedule for ${selectedDate.toLocaleDateString()}` : 'Upcoming Schedule'}
            </h3>
          </div>

          {/* Feed Content */}
          <div className="flex-1 bg-white dark:bg-[#07130D] rounded-3xl p-6 border border-ink-100 dark:border-white/10 shadow-sm overflow-y-auto custom-scrollbar">
            
            {/* Upcoming Feed */}
            <div className="space-y-4 h-full">
              {feedEvents.length === 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex flex-col items-center justify-center text-center text-ink-500 dark:text-cream-100/70 py-8 border-b border-ink-100 dark:border-white/10 mb-6">
                    <CalendarDays className="w-10 h-10 mb-3 opacity-30 text-moss-700 dark:text-[#E5C583]" />
                    <p className="text-sm font-bold text-ink-800 dark:text-white">Nothing scheduled.</p>
                    <p className="text-xs mt-1 max-w-xs leading-relaxed">There are no rent due dates, lease starts, or inspections scheduled for this selection.</p>
                  </div>
                  
                  {/* Fallback Activity */}
                  <div>
                    <h4 className="font-extrabold text-sm text-ink-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-moss-600 dark:text-[#E5C583]" />
                      Recent Maintenance Activity
                    </h4>
                    {recentMaintenance.length === 0 ? (
                      <p className="text-xs text-ink-500 dark:text-cream-100/70">No recent activity found.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentMaintenance.map((req, idx) => (
                          <div key={req.id || idx} className="p-4 rounded-xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {req.type || 'Maintenance'}
                              </span>
                              <span className="text-[10px] font-semibold text-ink-400 dark:text-cream-100/50">
                                {req.created_at ? new Date(req.created_at).toLocaleDateString() : req.date}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-ink-900 dark:text-white line-clamp-1">{req.details || req.description}</p>
                            <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-1">From: {req.tenant_name || req.tenantName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                feedEvents.map(event => (
                <div key={event.id} className="p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${event.color}`} />
                      <div>
                        <h4 className="font-bold text-sm text-ink-900 dark:text-white">{event.title}</h4>
                        <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">
                          {event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {event.type === 'rent_due' && (
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-ink-200 dark:border-white/10">
                      <span className="text-xs font-extrabold text-moss-700 dark:text-[#E5C583]">₦{Number(event.tenant.rentAmount || 2500000).toLocaleString()}/yr</span>
                      <Button variant="secondary" onClick={() => handleSendManualRentReminder(event.tenant)} disabled={manualDispatchingId === event.tenant.id} className="py-1.5 px-4 text-xs font-bold flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> {manualDispatchingId === event.tenant.id ? 'Sending...' : 'Remind'}
                      </Button>
                    </div>
                  )}

                  {event.type === 'inspection' && (
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-ink-200 dark:border-white/10">
                      <span className="text-xs font-semibold text-ink-600 dark:text-cream-100/70">Time: {event.insp.time || 'TBD'}</span>
                      <Button variant="secondary" onClick={() => handleSendManualInspectionReminder(event.insp)} disabled={manualDispatchingId === event.insp.id} className="py-1.5 px-4 text-xs font-bold flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> {manualDispatchingId === event.insp.id ? 'Sending...' : 'Remind'}
                      </Button>
                    </div>
                  )}
                  
                  {event.type === 'lease_start' && (
                    <div className="pt-2 text-[10px] text-ink-500 dark:text-cream-100/60 uppercase font-bold tracking-wider">
                      Official Lease Start Date (Uneditable)
                    </div>
                  )}
                </div>
              ))
            )}
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#07130D] rounded-3xl border border-ink-200 dark:border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar">
            
            <div className="sticky top-0 bg-white/90 dark:bg-[#07130D]/90 backdrop-blur-md p-6 border-b border-ink-100 dark:border-white/10 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-ink-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-moss-600 dark:text-[#E5C583]" /> Configuration Rules
              </h2>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-2 bg-ink-50 hover:bg-ink-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-ink-600 dark:text-cream-100" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Rent Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">Auto Rent Reminders</h4>
                  <ToggleSwitch checked={settings.autoRentRemindersEnabled} onChange={() => {
                    const newSettings = { ...settings, autoRentRemindersEnabled: !settings.autoRentRemindersEnabled };
                    setSettings(newSettings);
                    reminderService.saveSettings(newSettings);
                  }} />
                </div>
                <div className="p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10">
                  <p className="text-xs text-ink-500 dark:text-cream-100/70 mb-3">Trigger automated notices before due date:</p>
                  <div className="flex flex-wrap gap-2">
                    {[7, 5, 3, 1].map((day) => {
                      const isActive = (settings.rentLeadDays || []).includes(day);
                      return (
                        <button key={day} onClick={() => toggleRentLeadDay(day)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-white/5 border-ink-200 dark:border-white/10 text-ink-600 dark:text-cream-100'}`}>
                          {day} {day === 1 ? 'Day Before' : 'Days Before'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Inspection Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">Auto Inspection Reminders</h4>
                  <ToggleSwitch checked={settings.autoInspectionRemindersEnabled} onChange={() => {
                    const newSettings = { ...settings, autoInspectionRemindersEnabled: !settings.autoInspectionRemindersEnabled };
                    setSettings(newSettings);
                    reminderService.saveSettings(newSettings);
                  }} />
                </div>
                <div className="p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10">
                  <p className="text-xs text-ink-500 dark:text-cream-100/70 mb-3">Trigger inspection notices before scheduled date:</p>
                  <div className="flex flex-wrap gap-2">
                    {[7, 3, 1].map((day) => {
                      const isActive = (settings.inspectionLeadDays || []).includes(day);
                      return (
                        <button key={day} onClick={() => toggleInspectionLeadDay(day)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-white/5 border-ink-200 dark:border-white/10 text-ink-600 dark:text-cream-100'}`}>
                          {day} {day === 1 ? 'Day Before' : 'Days Before'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Auto-Nudge Renewals */}
              <div className="space-y-4 pt-6 border-t border-ink-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">Auto-Nudge Lease Renewals</h4>
                  <ToggleSwitch checked={settings.autoNudgeEnabled} onChange={() => {
                    const newSettings = { ...settings, autoNudgeEnabled: !settings.autoNudgeEnabled };
                    setSettings(newSettings);
                  }} />
                </div>
                {settings.autoNudgeEnabled && (
                  <div className="p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Days before expiry to send notice</label>
                      <input 
                        type="number" 
                        value={settings.autoNudgeDays} 
                        onChange={e => setSettings({...settings, autoNudgeDays: Number(e.target.value)})}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Proposed Rent Increase (Optional)</label>
                        <input 
                          type="number" 
                          value={settings.autoNudgeRentIncreaseProposed} 
                          onChange={e => setSettings({...settings, autoNudgeRentIncreaseProposed: Number(e.target.value)})}
                          className="w-full p-2 text-xs rounded-xl bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Increase Type</label>
                        <select 
                          value={settings.autoNudgeRentIncreaseType} 
                          onChange={e => setSettings({...settings, autoNudgeRentIncreaseType: e.target.value})}
                          className="w-full p-2 text-xs rounded-xl bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white"
                        >
                          <option value="fixed">Fixed Amount (₦)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Late Fees & Grace Periods */}
              <div className="space-y-4 pt-6 border-t border-ink-100 dark:border-white/10">
                <h4 className="font-bold text-sm text-ink-900 dark:text-white">Grace Periods & Late Fees</h4>
                <div className="p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Grace Period (Days)</label>
                    <input 
                      type="number" 
                      value={settings.gracePeriodDays} 
                      onChange={e => setSettings({...settings, gracePeriodDays: Number(e.target.value)})}
                      className="w-full p-2 text-xs rounded-xl bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Late Fee Penalty</label>
                      <input 
                        type="number" 
                        value={settings.lateFeeAmount} 
                        onChange={e => setSettings({...settings, lateFeeAmount: Number(e.target.value)})}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Fee Type</label>
                      <select 
                        value={settings.lateFeeType} 
                        onChange={e => setSettings({...settings, lateFeeType: e.target.value})}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white"
                      >
                        <option value="fixed">Fixed Amount (₦)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Move-out & Loyalty */}
              <div className="space-y-4 pt-6 border-t border-ink-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">Tenant Loyalty Rewards</h4>
                  <ToggleSwitch checked={settings.loyaltyRewardsEnabled} onChange={() => {
                    const newSettings = { ...settings, loyaltyRewardsEnabled: !settings.loyaltyRewardsEnabled };
                    setSettings(newSettings);
                  }} />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Days before move-out to send Checklist</label>
                  <input 
                    type="number" 
                    value={settings.moveOutChecklistDays} 
                    onChange={e => setSettings({...settings, moveOutChecklistDays: Number(e.target.value)})}
                    className="w-full p-2 text-xs rounded-xl bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white" 
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-[#07130D] p-4 border-t border-ink-100 dark:border-white/10 flex justify-end">
              <Button onClick={() => {
                reminderService.saveSettings(settings);
                triggerToast("Templates saved", "success");
                setIsSettingsModalOpen(false);
              }} className="px-6 py-2">
                Save & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
