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

export default function LandlordCalendar({ activeTenants = [] }) {
  const [customRentDay, setCustomRentDay] = useState("");
  const [customInspectionDay, setCustomInspectionDay] = useState("");
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
            color: 'purple',
            tenant: t
          });
          
          // Lease Expiry / Rent Due
          let calculatedDueDate = null;
          if (t.endDate || t.rentDueDate) {
            calculatedDueDate = new Date(t.rentDueDate || t.endDate);
          } else {
            // No end date provided: calculate based on rent period
            const period = (t.rentPeriod || 'annually').toLowerCase();
            calculatedDueDate = new Date(startDate);
            if (period === 'monthly' || period === 'month') {
              calculatedDueDate.setMonth(calculatedDueDate.getMonth() + 1);
            } else if (period === 'quarterly') {
              calculatedDueDate.setMonth(calculatedDueDate.getMonth() + 3);
            } else if (period === 'bi-annually' || period === 'biannually' || period === 'semi-annually') {
              calculatedDueDate.setMonth(calculatedDueDate.getMonth() + 6);
            } else {
              // Default to annually (1 year)
              calculatedDueDate.setFullYear(calculatedDueDate.getFullYear() + 1);
            }
          }

          if (calculatedDueDate && !isNaN(calculatedDueDate)) {
            list.push({
              id: `due-${t.id || t.name}`,
              date: calculatedDueDate,
              type: 'rent_due',
              title: `Lease Expiry: ${t.name}`,
              color: 'emerald',
              tenant: t
            });
          }
        }
      } else if (t.endDate || t.rentDueDate) {
        // If there is no start date but there is an end date
        const dueDate = new Date(t.rentDueDate || t.endDate);
        if (!isNaN(dueDate)) {
          list.push({
            id: `due-${t.id || t.name}`,
            date: dueDate,
            type: 'rent_due',
            title: `Lease Expiry: ${t.name}`,
            color: 'emerald',
            tenant: t
          });
        }
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
            color: 'blue',
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
      
      let eventColorClass = '';
      if (dayEvents.length > 0) {
        const primaryColor = dayEvents[0].color;
        if (primaryColor === 'purple') eventColorClass = 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800/60 font-bold';
        else if (primaryColor === 'emerald') eventColorClass = 'bg-emerald-100 dark:bg-[#07130D]merald-900/40 border-emerald-200 dark:border-emerald-800/60 font-bold';
        else if (primaryColor === 'blue') eventColorClass = 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800/60 font-bold';
      }
      
      days.push(
        <div 
          key={i} 
          onClick={() => {
            setSelectedDate(isSelected ? null : date);
            if (isMini) setViewMode('month'); // Zoom in if clicked from year view
          }}
          className={`
            relative flex flex-col items-center justify-center p-1 cursor-pointer transition-all rounded-lg border
            ${isMini ? 'h-8' : 'h-10 sm:h-12 hover:opacity-80'}
            ${isSelected ? 'ring-2 ring-moss-600 dark:ring-[#E5C583] ring-offset-1 dark:ring-offset-[#07130D] shadow-sm' : ''}
            ${dayEvents.length > 0 ? eventColorClass : 'border-transparent bg-white dark:bg-[#07130D] hover:bg-moss-50 dark:hover:bg-white/5'}
            ${isToday && dayEvents.length === 0 ? 'bg-ink-50 dark:bg-white/10 font-black' : ''}
          `}
        >
          <span className={`${isMini ? 'text-[10px]' : 'text-xs sm:text-sm'} ${isToday && dayEvents.length === 0 ? 'text-moss-700 dark:text-[#E5C583]' : (dayEvents.length > 0 ? 'text-ink-900 dark:text-white' : 'text-ink-700 dark:text-cream-100')}`}>
            {i}
          </span>
          {dayEvents.length > 1 && !isMini && (
            <span className="absolute bottom-1 right-1 flex items-center justify-center w-3 h-3 rounded-full bg-ink-900 dark:bg-white text-white dark:text-ink-900 text-[8px] font-bold">
              +{dayEvents.length - 1}
            </span>
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
                    <div className="flex items-center justify-between pt-3 border-t border-ink-200 dark:border-white/10">
                      <span className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583]">₦{Number(event.tenant.rentAmount || 2500000).toLocaleString()}/yr</span>
                      <Button onClick={() => handleSendManualRentReminder(event.tenant)} disabled={manualDispatchingId === event.tenant.id} className="px-3 py-1.5 text-[10px] font-bold flex items-center gap-1">
                        <Send className="w-3 h-3" /> {manualDispatchingId === event.tenant.id ? 'Sending...' : 'Remind'}
                      </Button>
                    </div>
                  )}

                  {event.type === 'inspection' && (
                    <div className="flex items-center justify-between pt-3 border-t border-ink-200 dark:border-white/10">
                      <span className="text-[11px] font-bold text-ink-600 dark:text-cream-100/70">Time: {event.insp.time || 'TBD'}</span>
                      <Button onClick={() => handleSendManualInspectionReminder(event.insp)} disabled={manualDispatchingId === event.insp.id} className="px-3 py-1.5 text-[10px] font-bold flex items-center gap-1">
                        <Send className="w-3 h-3" /> {manualDispatchingId === event.insp.id ? 'Sending...' : 'Remind'}
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
                  <div className="flex flex-wrap gap-2 items-center">
                    {(settings.rentLeadDays || []).concat([7, 5, 3, 1]).filter((v, i, a) => a.indexOf(v) === i).sort((a,b)=>b-a).map((day) => {
                      const isActive = (settings.rentLeadDays || []).includes(day);
                      return (
                        <button key={`rent-${day}`} onClick={() => toggleRentLeadDay(day)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-white/5 border-ink-200 dark:border-white/10 text-ink-600 dark:text-cream-100'}`}>
                          {day} {day === 1 ? 'Day Before' : 'Days Before'}
                        </button>
                      );
                    })}
                    <div className="flex items-center gap-1 ml-2">
                      <input 
                        type="number" 
                        min="1" 
                        placeholder="Custom" 
                        value={customRentDay} 
                        onChange={(e) => setCustomRentDay(e.target.value)}
                        className="w-20 p-1.5 rounded-xl text-xs border border-ink-200 dark:border-white/10 bg-white dark:bg-[#07130D] text-center focus:outline-none focus:border-emerald-500"
                      />
                      <button 
                        onClick={() => {
                          const val = parseInt(customRentDay);
                          if(val > 0) {
                            toggleRentLeadDay(val);
                            setCustomRentDay("");
                          }
                        }}
                        className="px-2 py-1.5 bg-ink-100 hover:bg-ink-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
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
                  <div className="flex flex-wrap gap-2 items-center">
                    {(settings.inspectionLeadDays || []).concat([7, 3, 1]).filter((v, i, a) => a.indexOf(v) === i).sort((a,b)=>b-a).map((day) => {
                      const isActive = (settings.inspectionLeadDays || []).includes(day);
                      return (
                        <button key={`insp-${day}`} onClick={() => toggleInspectionLeadDay(day)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-white/5 border-ink-200 dark:border-white/10 text-ink-600 dark:text-cream-100'}`}>
                          {day} {day === 1 ? 'Day Before' : 'Days Before'}
                        </button>
                      );
                    })}
                    <div className="flex items-center gap-1 ml-2">
                      <input 
                        type="number" 
                        min="1" 
                        placeholder="Custom" 
                        value={customInspectionDay} 
                        onChange={(e) => setCustomInspectionDay(e.target.value)}
                        className="w-20 p-1.5 rounded-xl text-xs border border-ink-200 dark:border-white/10 bg-white dark:bg-[#07130D] text-center focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={() => {
                          const val = parseInt(customInspectionDay);
                          if(val > 0) {
                            toggleInspectionLeadDay(val);
                            setCustomInspectionDay("");
                          }
                        }}
                        className="px-2 py-1.5 bg-ink-100 hover:bg-ink-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
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
