import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '../../../components/Button';
import { reminderService } from '../../../services/reminderService';
import { leaseService } from '../../../services/leaseService';

export default function RenewalOfferModal({ isOpen, onClose, tenant, onConfirm }) {
  const [settings, setSettings] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Lease State
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newRentAmount, setNewRentAmount] = useState('');
  const [rentPeriod, setRentPeriod] = useState('Yearly');
  const [includeLoyaltyDiscount, setIncludeLoyaltyDiscount] = useState(false);
  const [loyaltyDiscountAmount, setLoyaltyDiscountAmount] = useState(0);

  useEffect(() => {
    if (isOpen && tenant) {
      const currentSettings = reminderService.getSettings();
      setSettings(currentSettings);

      // Default dates
      const currentEnd = new Date(tenant.endDate || tenant.end_date || Date.now());
      const nextStart = new Date(currentEnd);
      nextStart.setDate(nextStart.getDate() + 1);
      
      const nextEnd = new Date(nextStart);
      const isYearly = (tenant.rentPeriod || 'Yearly').toLowerCase() === 'yearly';
      if (isYearly) {
        nextEnd.setFullYear(nextEnd.getFullYear() + 1);
      } else {
        nextEnd.setMonth(nextEnd.getMonth() + 1);
      }
      setRentPeriod(isYearly ? 'Yearly' : 'Monthly');

      setNewStartDate(nextStart.toISOString().split('T')[0]);
      setNewEndDate(nextEnd.toISOString().split('T')[0]);

      // Default rent calc based on settings
      let baseRent = Number(tenant.rentAmount || tenant.amount || 0);
      if (currentSettings.autoNudgeRentIncreaseProposed > 0) {
        if (currentSettings.autoNudgeRentIncreaseType === 'percentage') {
          baseRent = baseRent * (1 + (currentSettings.autoNudgeRentIncreaseProposed / 100));
        } else {
          baseRent = baseRent + currentSettings.autoNudgeRentIncreaseProposed;
        }
      }
      setNewRentAmount(baseRent.toString());
    }
  }, [isOpen, tenant]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct new lease payload
    let finalRent = Number(newRentAmount);
    if (includeLoyaltyDiscount && loyaltyDiscountAmount > 0) {
       // Discount applies to the first period
       finalRent = finalRent - Number(loyaltyDiscountAmount);
    }

    const payload = {
      propertyId: tenant.propertyId || tenant.property_id,
      tenantId: tenant.tenantId || tenant.id || tenant.tenant_id,
      applicationId: tenant.applicationId || tenant.application_id, // If needed for linkage
      startDate: newStartDate,
      endDate: newEndDate,
      rentAmount: finalRent,
      rentPeriod: rentPeriod,
      securityDeposit: tenant.securityDeposit || 0,
      customClauses: tenant.customClauses || [],
      includePets: tenant.includePets || false,
      includeSmoking: tenant.includeSmoking || false,
      includeLateFee: settings?.lateFeeAmount > 0 ? true : false,
      gracePeriodDays: settings?.gracePeriodDays || 0,
      lateFeeAmount: settings?.lateFeeAmount || 0,
      lateFeeType: settings?.lateFeeType || 'fixed'
    };

    try {
      // Create new lease
      const newLease = await leaseService.generateLease(payload);
      if (onConfirm) onConfirm(newLease, tenant);
      onClose();
    } catch (err) {
      console.error("Failed to generate renewal lease", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#FFFFFF] dark:bg-[#07130D] rounded-3xl border border-ink-200 dark:border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar">
        
        <div className="sticky top-0 bg-[#FFFFFF]/90 dark:bg-[#07130D]/90 backdrop-blur-md p-6 border-b border-ink-100 dark:border-white/10 flex items-center justify-between z-10">
          <h2 className="text-xl font-black text-ink-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-moss-600 dark:text-[#E5C583]" /> Offer Lease Renewal
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-ink-50 hover:bg-ink-100 dark:bg-[#FFFFFF]/5 dark:hover:bg-[#FFFFFF]/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-ink-600 dark:text-cream-100" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-moss-50 dark:bg-[#FFFFFF]/5 rounded-2xl border border-moss-100 dark:border-white/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-moss-600 dark:text-[#E5C583] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-moss-800 dark:text-white mb-1">
                Renewing {tenant.name || tenant.tenantName}'s Lease
              </p>
              <p className="text-xs text-moss-700/80 dark:text-cream-100/70">
                Generate a new, signable lease agreement. The rent price is pre-calculated based on your Auto-Nudge configuration rules, but you can adjust it below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">New Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input 
                  type="date"
                  required
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-ink-50 dark:bg-[#FFFFFF]/5 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white focus:ring-2 focus:ring-moss-600 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">New End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input 
                  type="date"
                  required
                  value={newEndDate}
                  onChange={e => setNewEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-ink-50 dark:bg-[#FFFFFF]/5 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white focus:ring-2 focus:ring-moss-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">New Rent Amount (₦)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input 
                  type="number"
                  required
                  value={newRentAmount}
                  onChange={e => setNewRentAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-bold rounded-xl bg-ink-50 dark:bg-[#FFFFFF]/5 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white focus:ring-2 focus:ring-moss-600 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Period</label>
              <select 
                value={rentPeriod}
                onChange={e => setRentPeriod(e.target.value)}
                className="w-32 px-3 py-2.5 text-sm font-bold rounded-xl bg-ink-50 dark:bg-[#FFFFFF]/5 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white focus:ring-2 focus:ring-moss-600 outline-none"
              >
                <option value="Yearly">Yearly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          {settings?.loyaltyRewardsEnabled && (
            <div className="p-4 border border-ink-100 dark:border-white/10 rounded-2xl bg-ink-50/50 dark:bg-[#FFFFFF]/5">
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input 
                  type="checkbox"
                  checked={includeLoyaltyDiscount}
                  onChange={e => setIncludeLoyaltyDiscount(e.target.checked)}
                  className="w-4 h-4 text-moss-600 rounded border-ink-300 focus:ring-moss-600"
                />
                <span className="text-sm font-bold text-ink-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Apply Loyalty Discount
                </span>
              </label>
              
              {includeLoyaltyDiscount && (
                <div className="pl-7">
                  <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Discount Amount (First Month Only)</label>
                  <input 
                    type="number"
                    value={loyaltyDiscountAmount}
                    onChange={e => setLoyaltyDiscountAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-[#FFFFFF] dark:bg-[#07130D] border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {settings?.lateFeeAmount > 0 && (
             <div className="text-[11px] text-ink-500 dark:text-cream-100/60 flex items-start gap-1.5 p-3 rounded-xl bg-ink-50 dark:bg-[#FFFFFF]/5 border border-ink-100 dark:border-white/5">
               <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
               <p>Your configured late fee clause ({settings.lateFeeType === 'percentage' ? `${settings.lateFeeAmount}%` : `₦${settings.lateFeeAmount}`} after {settings.gracePeriodDays} days) will be explicitly injected into this lease agreement.</p>
             </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Generate Renewal Lease'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
