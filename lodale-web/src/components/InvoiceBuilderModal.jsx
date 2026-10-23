import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, Plus, Info, Building2, Calendar } from 'lucide-react';
import Button from './Button';
import { invoiceService } from '../services/invoiceService';
import { profileService } from '../services/profileService';
import { triggerToast } from '../context/ToastContext';
import { getNextRentDue } from '../utils/formatters';
import { PLATFORM_FEE_PERCENT } from '../utils/statusConstants';

export default function InvoiceBuilderModal({ 
  isOpen, 
  onClose, 
  application, 
  property, 
  tenant, 
  lease, 
  mode = 'application', 
  onSuccess 
}) {
  const isLeaseMode = mode === 'lease' || (!application && Boolean(lease || tenant?.leaseId));
  const effectiveLease = lease || application?.lease || tenant?.lease;
  const effectiveLeaseId = effectiveLease?.id || effectiveLease?.lease_id || tenant?.leaseId;

  // Rent amount prefill from lease if in lease mode, otherwise from property
  const leaseRent = Number(effectiveLease?.rent_amount || tenant?.rentAmount || 0);
  const propertyRent = Number(property?.rent_amount || property?.price || 0);
  const initialRent = isLeaseMode && leaseRent > 0 ? leaseRent : (propertyRent || leaseRent || 0);

  const todayStr = new Date().toISOString().split('T')[0];

  // Renewal settings
  const [isRenewal, setIsRenewal] = useState(isLeaseMode);
  const [extendLeaseByMonths, setExtendLeaseByMonths] = useState(12);

  // Period Start and End dates for renewal
  const defaultPeriodStart = (() => {
    if (effectiveLease?.end_date) {
      try {
        const d = new Date(effectiveLease.end_date);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } catch (e) {}
    }
    return todayStr;
  })();

  const calculatePeriodEnd = (startStr, months) => {
    try {
      const d = new Date(startStr || todayStr);
      if (!isNaN(d.getTime())) {
        const date = d.getDate();
        d.setMonth(d.getMonth() + Number(months || 12));
        if (d.getDate() !== date) d.setDate(0);
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
    return '';
  };

  const [periodStart, setPeriodStart] = useState(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(calculatePeriodEnd(defaultPeriodStart, 12));

  // Default due date: check getNextRentDue if lease exists, else 7 days from today
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  const fallbackDueStr = defaultDue.toISOString().split('T')[0];
  const calculatedNextDue = effectiveLease ? getNextRentDue(effectiveLease, property)?.dueDate : null;
  const initialDueStr = calculatedNextDue || fallbackDueStr;

  // Invoice metadata
  const [invoiceNum] = useState(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(initialDueStr);

  // Landlord profile prefill
  const currentProfile = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('currentUserProfile') || localStorage.getItem('currentUserProfile') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const [landlordName, setLandlordName] = useState(currentProfile.name || currentProfile.displayName || 'Landlord');
  const [landlordAddress, setLandlordAddress] = useState(property?.address || property?.location || 'Lagos, Nigeria');
  const [landlordPhone, setLandlordPhone] = useState(currentProfile.phone || '+234 803 123 4567');
  const [landlordEmail, setLandlordEmail] = useState(sessionStorage.getItem('lastLoggedInEmail') || 'landlord@lodale.com');

  // Tenant prefill
  const tenantName = tenant?.full_name || tenant?.name || (tenant?.first_name ? `${tenant.first_name} ${tenant.last_name}` : '') || effectiveLease?.tenant_name || application?.tenant_name || 'Tenant';
  const tenantEmail = tenant?.email || effectiveLease?.tenant_email || application?.tenant_email || 'tenant@lodale.com';
  const tenantPhone = tenant?.phone || tenant?.phone_number || effectiveLease?.tenant_phone || application?.tenant_phone || '+234 800 000 0000';
  const tenantAddress = property?.title ? `Unit at ${property.title}` : (property?.address || 'Lodale Rental Property');

  // Bank Account prefill from Landlord Profile
  const savedRoleProfile = (() => {
    try {
      const emailKey = sessionStorage.getItem('lastLoggedInEmail');
      if (emailKey) {
        const raw = localStorage.getItem(`landlordProfile_${emailKey.toLowerCase()}`);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return {};
  })();

  const [bankName, setBankName] = useState(savedRoleProfile.bank_name || currentProfile.bank_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(savedRoleProfile.bank_account_number || currentProfile.bank_account_number || '');
  const [bankAccountName, setBankAccountName] = useState(savedRoleProfile.bank_account_name || currentProfile.bank_account_name || landlordName);
  const [paystackSubaccountCode, setPaystackSubaccountCode] = useState(() => {
    const isLinked = savedRoleProfile.paystackLinked ?? currentProfile.paystackLinked;
    if (isLinked === false) return '';
    return savedRoleProfile.paystack_subaccount_code || currentProfile.paystack_subaccount_code || '';
  });

  // Live profile fetch on modal open to ensure accurate Paystack payout verification status
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    profileService.getMyProfile()
      .then(prof => {
        if (!isMounted || !prof) return;
        if (prof.bank_name) setBankName(prof.bank_name);
        if (prof.bank_account_number) setBankAccountNumber(prof.bank_account_number);
        if (prof.bank_account_name) setBankAccountName(prof.bank_account_name);
        const isLinked = Boolean(prof.paystackLinked ?? Boolean(prof.paystack_subaccount_code || prof.paystackSubaccountCode));
        const code = isLinked ? (prof.paystack_subaccount_code || prof.paystackSubaccountCode) : '';
        setPaystackSubaccountCode(code || '');
      })
      .catch(err => {
        console.warn('InvoiceBuilderModal: Failed to fetch live landlord profile:', err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Fee additions (for renewal mode, legal/caution default to false since already moved in)
  const [rentAmount, setRentAmount] = useState(initialRent);
  const [legalFeeEnabled, setLegalFeeEnabled] = useState(!isLeaseMode);
  const [legalFeeAmount, setLegalFeeAmount] = useState(Math.round(initialRent * 0.1)); // 10% legal default
  const [cautionFeeEnabled, setCautionFeeEnabled] = useState(!isLeaseMode);
  const [cautionFeeAmount, setCautionFeeAmount] = useState(Math.round(initialRent * 0.05)); // 5% caution default
  const [utilityFeeEnabled, setUtilityFeeEnabled] = useState(false);
  const [utilityFeeAmount, setUtilityFeeAmount] = useState(50000);
  const [lateFeeEnabled] = useState(false);
  const [lateFeeAmount] = useState(25000);

  // Keep rent amount synced when initialRent changes
  useEffect(() => {
    if (initialRent > 0) {
      setRentAmount(initialRent);
      setLegalFeeAmount(Math.round(initialRent * 0.1));
      setCautionFeeAmount(Math.round(initialRent * 0.05));
    }
  }, [initialRent]);

  // Custom Fee items
  const [customItems, setCustomItems] = useState([]);
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomAmount, setNewCustomAmount] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const handleAddCustomFee = () => {
    const title = newCustomTitle.trim();
    const amt = Number(newCustomAmount.replace(/[^0-9]/g, '')) || 0;
    if (title && amt > 0) {
      setCustomItems(prev => [...prev, { description: title, period: 'One-off', unitPrice: amt, quantity: 1, amount: amt }]);
      setNewCustomTitle('');
      setNewCustomAmount('');
    }
  };

  // Compile full invoice items list
  const invoiceItems = [];
  
  // 1. Rent Item
  if (rentAmount > 0) {
    let rentDesc = `Annual Rent Payment (${property?.title || effectiveLease?.property_title || 'Property'})`;
    let rentPeriodLabel = '1 Year';
    if (isLeaseMode) {
      if (isRenewal) {
        rentDesc = `Rent Renewal (${extendLeaseByMonths} Months) - ${property?.title || effectiveLease?.property_title || tenant?.propertyTitle || 'Property'}`;
        rentPeriodLabel = `${extendLeaseByMonths} Months`;
      } else {
        rentDesc = `Rent Payment - ${property?.title || effectiveLease?.property_title || tenant?.propertyTitle || 'Property'}`;
        rentPeriodLabel = effectiveLease?.rent_period || 'Periodic';
      }
    }

    invoiceItems.push({
      description: rentDesc,
      period: rentPeriodLabel,
      unitPrice: rentAmount,
      quantity: 1,
      amount: rentAmount
    });
  }

  // 2. Legal & Lease Agreement Fee
  if (legalFeeEnabled && legalFeeAmount > 0) {
    invoiceItems.push({
      description: 'Legal Documentation & Agreement Fee',
      period: 'One-off',
      unitPrice: legalFeeAmount,
      quantity: 1,
      amount: legalFeeAmount
    });
  }

  // 3. Caution / Security Deposit
  if (cautionFeeEnabled && cautionFeeAmount > 0) {
    invoiceItems.push({
      description: 'Refundable Caution & Security Deposit',
      period: 'One-off',
      unitPrice: cautionFeeAmount,
      quantity: 1,
      amount: cautionFeeAmount
    });
  }

  // 4. Utility / Service Charges
  if (utilityFeeEnabled && utilityFeeAmount > 0) {
    invoiceItems.push({
      description: 'Estate Utility & Service Charges',
      period: 'Annual',
      unitPrice: utilityFeeAmount,
      quantity: 1,
      amount: utilityFeeAmount
    });
  }

  // 5. Late Fee
  if (lateFeeEnabled && lateFeeAmount > 0) {
    invoiceItems.push({
      description: 'Late Payment Administrative Fee',
      period: 'One-off',
      unitPrice: lateFeeAmount,
      quantity: 1,
      amount: lateFeeAmount
    });
  }

  // 6. Custom items
  customItems.forEach(item => invoiceItems.push(item));

  // Financial Calculations
  const subtotal = invoiceItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const lodaleFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100)); // 3.5% Lodale Fee (deducted at payout via split)
  const grandTotal = subtotal;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      triggerToast('Please provide your bank account details for tenant payout transfer.', 'warning', 'Bank Details Required');
      return;
    }

    if (subtotal <= 0) {
      triggerToast('Invoice subtotal must be greater than ₦0.', 'warning', 'Invalid Amount');
      return;
    }

    if (isLeaseMode && !effectiveLeaseId) {
      triggerToast('Active lease ID is required to issue a renewal invoice.', 'error', 'Missing Lease');
      return;
    }

    setSubmitting(true);
    try {
      const targetAppId = isLeaseMode ? (effectiveLease?.application_id || application?.id || null) : application?.id;
      const targetPropertyId = property?.id || effectiveLease?.property_id || application?.property_id || tenant?.propertyId;
      const targetTenantId = tenant?.tenantId || tenant?.tenant_id || (tenant?.id && !String(tenant.id).includes('::') ? tenant.id : null) || effectiveLease?.tenant_id || application?.tenant_id;
      const targetLandlordId = property?.landlord_id || effectiveLease?.landlord_id || application?.landlord_id;

      const result = await invoiceService.createInvoice({
        invoiceNumber: invoiceNum,
        applicationId: targetAppId,
        leaseId: isLeaseMode ? effectiveLeaseId : null,
        propertyId: targetPropertyId,
        tenantId: targetTenantId,
        landlordId: targetLandlordId,
        issueDate,
        dueDate,
        
        periodStart: isLeaseMode && isRenewal ? periodStart : null,
        periodEnd: isLeaseMode && isRenewal ? periodEnd : null,
        extendLeaseByMonths: isLeaseMode && isRenewal ? Number(extendLeaseByMonths) : null,
        metadata: {
          isRenewal: Boolean(isLeaseMode && isRenewal),
          extendLeaseByMonths: isLeaseMode && isRenewal ? Number(extendLeaseByMonths) : null,
          invoiceType: isLeaseMode ? (isRenewal ? 'renewal' : 'rent') : 'application'
        },
        
        landlordName,
        landlordAddress,
        landlordPhone,
        landlordEmail,
        
        tenantName,
        tenantAddress,
        tenantPhone,
        tenantEmail,
        
        items: invoiceItems,
        subtotal,
        lodaleFee,
        grandTotal,
        
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
        note: isLeaseMode && isRenewal
          ? `Lease renewal invoice for ${property?.title || 'Property'}. Payment confirms renewal and extends your lease term.`
          : `Payment is due by the due date specified above via Paystack online payment.`
      });

      if (!result || (!result.id && !result.invoiceNumber)) {
        throw new Error('Server did not return a valid saved invoice.');
      }

      triggerToast(
        isLeaseMode 
          ? 'Rent / Renewal invoice generated & sent to tenant for payment!' 
          : 'Digital Rent Invoice generated & sent to tenant for payment!',
        'success',
        'Invoice Sent'
      );
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      const serverMsg = err?.data?.error || err?.data?.message || err?.response?.data?.error || err?.response?.data?.message || err.message;
      triggerToast(serverMsg || 'Failed to generate rent invoice.', 'error', 'Invoice Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (!isLeaseMode && !application) return null;
  if (isLeaseMode && !effectiveLeaseId && !property) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 text-left text-slate-900 dark:text-white font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#07130D]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isLeaseMode 
                  ? (isRenewal ? 'Issue Lease Renewal Invoice' : 'Issue Rent Invoice')
                  : 'Generate Digital Rent Invoice'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLeaseMode
                  ? <>Official Tenancy Invoice for <span className="font-bold text-emerald-700 dark:text-[#E5C583]">{tenantName}</span> ({property?.title || effectiveLease?.property_title || 'Active Lease'})</>
                  : <>Official Pre-Lease Payment Invoice for candidate <span className="font-bold text-emerald-700 dark:text-[#E5C583]">{tenantName}</span></>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-none">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Invoice Sheet */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Invoice Metadata Row */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium mb-1">Invoice Number</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{invoiceNum}</span>
            </div>
            <div>
              <label className="text-slate-400 block font-medium mb-1">Date of Issue</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-medium mb-1">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
              />
            </div>
          </div>

          {/* Lease Extension / Renewal Controls */}
          {isLeaseMode && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-700 dark:text-[#E5C583]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-[#E5C583]">
                    Lease Renewal & Term Extension
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isRenewal}
                    onChange={(e) => setIsRenewal(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Extend lease duration on payment</span>
                </label>
              </div>

              {isRenewal && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block font-medium mb-1">Extend Lease By</label>
                    <select
                      value={extendLeaseByMonths}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setExtendLeaseByMonths(m);
                        setPeriodEnd(calculatePeriodEnd(periodStart, m));
                      }}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
                    >
                      <option value={1}>1 Month</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block font-medium mb-1">New Period Start</label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => {
                        setPeriodStart(e.target.value);
                        setPeriodEnd(calculatePeriodEnd(e.target.value, extendLeaseByMonths));
                      }}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block font-medium mb-1">New Period End</label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Landlord & Tenant Details Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Landlord Info */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#07130D] space-y-2 text-xs">
              <div className="font-bold text-emerald-800 dark:text-[#E5C583] uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Landlord Information (Bill From)
              </div>
              <input
                type="text"
                value={landlordName}
                onChange={(e) => setLandlordName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
              />
              <input
                type="text"
                value={landlordAddress}
                onChange={(e) => setLandlordAddress(e.target.value)}
                placeholder="Property Address"
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={landlordPhone}
                  onChange={(e) => setLandlordPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                />
                <input
                  type="email"
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Tenant Info */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#07130D] space-y-2 text-xs">
              <div className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                Tenant Information (Bill To)
              </div>
              <div className="font-bold text-slate-900 dark:text-white p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                {tenantName}
              </div>
              <div className="text-slate-600 dark:text-slate-300 p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 truncate">
                {tenantAddress}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 truncate">{tenantPhone}</div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 truncate">{tenantEmail}</div>
              </div>
            </div>
          </div>

          {/* Fee Selection & Addition Controls */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#E5C583]">
              Select Additional Fees to Include
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Rent Amount Box */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-white/10">
                <label className="block font-bold text-slate-900 dark:text-white mb-1">Annual Rent Amount (₦) *</label>
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Legal Fee Toggle */}
              <div className={`p-3 rounded-xl border transition-all ${legalFeeEnabled ? 'bg-white dark:bg-[#07130D] border-emerald-500/40' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={legalFeeEnabled} onChange={(e) => setLegalFeeEnabled(e.target.checked)} className="rounded text-emerald-600" />
                    <span>Legal & Agreement Fee</span>
                  </label>
                  {legalFeeEnabled && <span className="text-[10px] font-bold text-emerald-600">Active</span>}
                </div>
                {legalFeeEnabled && (
                  <input
                    type="number"
                    value={legalFeeAmount}
                    onChange={(e) => setLegalFeeAmount(Number(e.target.value) || 0)}
                    placeholder="Legal Fee Amount"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                  />
                )}
              </div>

              {/* Caution Fee Toggle */}
              <div className={`p-3 rounded-xl border transition-all ${cautionFeeEnabled ? 'bg-white dark:bg-[#07130D] border-emerald-500/40' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={cautionFeeEnabled} onChange={(e) => setCautionFeeEnabled(e.target.checked)} className="rounded text-emerald-600" />
                    <span>Caution & Security Deposit</span>
                  </label>
                  {cautionFeeEnabled && <span className="text-[10px] font-bold text-emerald-600">Active</span>}
                </div>
                {cautionFeeEnabled && (
                  <input
                    type="number"
                    value={cautionFeeAmount}
                    onChange={(e) => setCautionFeeAmount(Number(e.target.value) || 0)}
                    placeholder="Caution Fee Amount"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                  />
                )}
              </div>

              {/* Utility Charges Toggle */}
              <div className={`p-3 rounded-xl border transition-all ${utilityFeeEnabled ? 'bg-white dark:bg-[#07130D] border-emerald-500/40' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={utilityFeeEnabled} onChange={(e) => setUtilityFeeEnabled(e.target.checked)} className="rounded text-emerald-600" />
                    <span>Utility Charges / Service Fee</span>
                  </label>
                  {utilityFeeEnabled && <span className="text-[10px] font-bold text-emerald-600">Active</span>}
                </div>
                {utilityFeeEnabled && (
                  <input
                    type="number"
                    value={utilityFeeAmount}
                    onChange={(e) => setUtilityFeeAmount(Number(e.target.value) || 0)}
                    placeholder="Utility Fee Amount"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                  />
                )}
              </div>
            </div>

            {/* Custom Fee Addition Row */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Add Custom Invoice Item
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Item Description (e.g. Generator Maintenance Fee)"
                  value={newCustomTitle}
                  onChange={(e) => setNewCustomTitle(e.target.value)}
                  className="flex-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Amount (₦)"
                  value={newCustomAmount}
                  onChange={(e) => setNewCustomAmount(e.target.value)}
                  className="w-32 p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFee}
                  className="px-4 py-2 bg-emerald-800 dark:bg-[#E5C583] text-white dark:text-[#07130D] font-bold text-xs rounded-lg cursor-pointer border-none flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* ITEMIZATION TABLE SUMMARY */}
          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#07130D]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {invoiceItems.map((item, idx) => (
                  <tr key={idx} className="text-slate-900 dark:text-white">
                    <td className="p-3 font-semibold">{item.description}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{item.period}</td>
                    <td className="p-3 text-right">₦{Number(item.unitPrice).toLocaleString()}</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right font-bold">₦{Number(item.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Subtotal (Billable Items)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Lodale Platform Fee ({PLATFORM_FEE_PERCENT}%, deducted at payout)
                </span>
                <span>₦{lodaleFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-white/10">
                <span>Total Amount Due from Tenant</span>
                <span className="text-emerald-700 dark:text-[#E5C583] text-base font-extrabold">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Details Card (Direct Online Bank Transfer) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Landlord Payout Account
              </h3>
              {paystackSubaccountCode ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Verified Account
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Payout Not Linked
                </span>
              )}
            </div>
            {paystackSubaccountCode ? (
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Tenant rent paid via Paystack will automatically route 96.5% directly to this bank account:
              </p>
            ) : (
              <p className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                Notice: Payout account is not yet verified on Paystack. Complete bank verification in Landlord Settings to guarantee tenant online payments succeed.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank Name"
                  required
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number *</label>
                <input
                  type="text"
                  maxLength={10}
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0123456789"
                  required
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Account Name *</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Account Holder Name"
                  required
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                isLeaseMode 
                  ? (isRenewal ? 'Issue Renewal Invoice' : 'Issue Rent Invoice') 
                  : 'Generate & Send Digital Invoice'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
