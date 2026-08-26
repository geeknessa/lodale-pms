import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, Shield, CheckCircle2, Loader2, PenTool } from 'lucide-react';
import Button from './Button';
import { leaseService } from '../services/leaseService';
import { triggerToast } from '../context/ToastContext';

export default function LeaseBuilderModal({ isOpen, onClose, application, property, tenant, onSuccess }) {
  if (!isOpen || !application) return null;

  const initialRent = property?.rent_amount || property?.price || 0;
  const todayStr = new Date().toISOString().split('T')[0];

  // Default 1-year end date
  const defaultEnd = new Date();
  defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
  const defaultEndStr = defaultEnd.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(tenant?.preferred_move_in_date || todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [rentAmount, setRentAmount] = useState(initialRent);
  const [rentPeriod, setRentPeriod] = useState(property?.rent_period || 'annually');
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [includePets, setIncludePets] = useState(false);
  const [includeSmoking, setIncludeSmoking] = useState(false);
  const [includeLateFee, setIncludeLateFee] = useState(true);
  const [customClauses, setCustomClauses] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signature.trim()) {
      triggerToast('Please type your full name signature to generate and execute the lease draft.', 'warning', 'Signature Required');
      return;
    }

    setSubmitting(true);
    try {
      await leaseService.generateLease({
        propertyId: property?.id || application.property_id,
        tenantId: application.tenant_id,
        applicationId: application.id,
        startDate,
        endDate,
        rentAmount: Number(rentAmount),
        rentPeriod,
        securityDeposit: Number(securityDeposit),
        customClauses,
        includePets,
        includeSmoking,
        includeLateFee
      });

      triggerToast('Lease generated successfully and sent to tenant for review!', 'success', 'Lease Drafted');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to generate lease:', err);
      triggerToast(err.message || 'Failed to generate lease agreement.', 'error', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8 text-left text-ink-900 dark:text-white font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-100 dark:border-white/10 bg-cream-50 dark:bg-[#162721]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-moss-100 text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-900 dark:text-white">Generate Residential Lease</h2>
              <p className="text-xs text-ink-600 dark:text-cream-100/70">
                Applicant: <span className="font-semibold text-moss-700 dark:text-[#E5C583]">{application.tenant_name || 'Tenant Candidate'}</span> • Property: {property?.title || 'Property'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-white/5 dark:hover:bg-white/10 text-ink-600 dark:text-cream-100/70 dark:hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Lease Dates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4" /> 1. Tenancy Period & Duration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100/70 mb-1">Lease Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100/70 mb-1">Lease End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
                />
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
            <h3 className="text-xs font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> 2. Rent & Security Deposit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100/70 mb-1">Agreed Rent (₦) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100/70 mb-1">Payment Frequency *</label>
                <select
                  value={rentPeriod}
                  onChange={(e) => setRentPeriod(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#1A2D26] px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
                >
                  <option value="annually">Annually (/yr)</option>
                  <option value="monthly">Monthly (/mo)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100/70 mb-1">Security Deposit (₦)</label>
                <input
                  type="number"
                  min={0}
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
                />
              </div>
            </div>
          </div>

          {/* House Rules & Policies */}
          <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
            <h3 className="text-xs font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4" /> 3. House Rules & Covenant Policies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50/50 dark:bg-white/5 border border-ink-200 dark:border-white/10 cursor-pointer hover:bg-cream-100 dark:hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={includePets}
                  onChange={(e) => setIncludePets(e.target.checked)}
                  className="accent-moss-600 dark:accent-[#E5C583] h-4 w-4"
                />
                <span className="text-xs font-medium text-ink-800 dark:text-cream-100">Allow Pets</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50/50 dark:bg-white/5 border border-ink-200 dark:border-white/10 cursor-pointer hover:bg-cream-100 dark:hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={includeSmoking}
                  onChange={(e) => setIncludeSmoking(e.target.checked)}
                  className="accent-moss-600 dark:accent-[#E5C583] h-4 w-4"
                />
                <span className="text-xs font-medium text-ink-800 dark:text-cream-100">Allow Smoking</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50/50 dark:bg-white/5 border border-ink-200 dark:border-white/10 cursor-pointer hover:bg-cream-100 dark:hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={includeLateFee}
                  onChange={(e) => setIncludeLateFee(e.target.checked)}
                  className="accent-moss-600 dark:accent-[#E5C583] h-4 w-4"
                />
                <span className="text-xs font-medium text-ink-800 dark:text-cream-100">Late Fee Penalty</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100/70 mb-1">Additional Custom Clauses & Covenants</label>
              <textarea
                rows={3}
                placeholder="Add any property-specific rules, service charge terms, or quiet hours..."
                value={customClauses}
                onChange={(e) => setCustomClauses(e.target.value)}
                className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-3 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583] resize-none"
              />
            </div>
          </div>

          {/* Landlord E-Signature */}
          <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
            <h3 className="text-xs font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wider flex items-center gap-2">
              <PenTool className="h-4 w-4" /> 4. Execution & Digital Signature
            </h3>
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100/70 mb-1">Type Your Full Name to Sign *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chief John Doe"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583] font-serif italic text-lg tracking-wide"
              />
              <p className="text-[11px] text-ink-500 dark:text-cream-100/50 mt-1">
                By clicking "Approve & Generate Lease", you authorize this lease agreement and approve the tenant candidate.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-ink-100 dark:border-white/10 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="bg-ink-100 hover:bg-ink-200 text-ink-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 border border-ink-200 dark:border-white/10 text-xs px-5 py-2.5 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#0B1512] font-bold text-xs px-6 py-2.5 flex items-center gap-2 rounded-xl shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve & Generate Lease
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
