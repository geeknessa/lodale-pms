import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Loader2, Copy, Check, Info, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import Button from './Button';
import { invoiceService } from '../services/invoiceService';
import { chatService } from '../services/chatService';
import { triggerToast } from '../context/ToastContext';

export default function TenantInvoiceModal({ isOpen, onClose, invoice, applicationId, onSuccess }) {
  const [paymentRef, setPaymentRef] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [copiedField, setCopiedField] = useState(null); // 'accountNumber' | 'bankName' | 'accountName'
  const [submitting, setSubmitting] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false);

  if (!isOpen || !invoice) return null;

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    triggerToast(`${fieldName} copied to clipboard!`, 'info', 'Copied');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handlePaystackPay = async () => {
    setSubmitting(true);
    try {
      const invId = invoice.id || invoice.invoiceId;
      const data = await invoiceService.initializePaystackPayment(invId);
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        triggerToast("Failed to initialize Paystack checkout.", "error");
      }
    } catch (err) {
      console.error("Paystack checkout error:", err);
      triggerToast(err.message || "Failed to initialize Paystack payment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("Receipt file size must be under 5MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptFile(event.target.result);
        setReceiptFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentRef.trim()) {
      triggerToast('Please provide your Bank Transfer reference number or payment description.', 'warning', 'Reference Required');
      return;
    }

    setSubmitting(true);
    try {
      const targetAppId = applicationId || invoice.applicationId || invoice.application_id;
      const targetInvoiceId = invoice.id || targetAppId;
      await invoiceService.submitPaymentProof(targetInvoiceId, {
        paymentReference: paymentRef.trim(),
        paymentProofUrl: receiptFile || '',
        applicationId: targetAppId
      });

      // Send chat message notification with receipt proof to landlord
      const landlordId = invoice.landlordId || invoice.landlord_id || (invoice.landlordName ? `landlord-${invoice.landlordName.toLowerCase().replace(/\s+/g, '-')}` : null);
      if (landlordId) {
        try {
          const msg = `[PAYMENT EVIDENCE SUBMITTED FOR INVOICE #${invoice.invoiceNumber}]\nAmount Paid: ₦${Number(invoice.grandTotal || 0).toLocaleString()}\nReference: ${paymentRef.trim()}${receiptFileName ? `\nReceipt Attached: ${receiptFileName}` : ''}\nData: ${receiptFile || 'No file attached'}`;
          await chatService.sendMessage(landlordId, msg, invoice.propertyId);
        } catch (chatErr) {
          console.warn("Failed to send payment proof chat notification:", chatErr);
        }
      }

      triggerToast('Payment proof submitted successfully! The landlord will verify your receipt.', 'success', 'Payment Submitted');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit payment proof:', err);
      triggerToast(err.message || 'Failed to confirm payment.', 'error', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const isPaid = (invoice.status || '').toLowerCase() === 'paid';

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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Official Rent Invoice</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invoice Number: <span className="font-mono font-bold text-slate-900 dark:text-white">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${isPaid ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
              {isPaid ? 'Payment Completed' : ((invoice.status || '').toLowerCase() === 'payment_submitted' ? 'Payment Submitted' : 'Payment Pending')}
            </span>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-none">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable View */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Metadata Row */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Invoice Number</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Date of Issue</span>
              <span className="font-bold text-slate-900 dark:text-white">{invoice.issueDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Due Date</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{invoice.dueDate}</span>
            </div>
          </div>

          {/* Landlord & Tenant Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-1">
              <div className="font-bold text-emerald-800 dark:text-[#E5C583] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Landlord's Information
              </div>
              <div className="font-bold text-slate-900 dark:text-white">{invoice.landlordName}</div>
              <div className="text-slate-600 dark:text-slate-300">{invoice.landlordAddress}</div>
              <div className="text-slate-500 dark:text-slate-400">{invoice.landlordPhone} • {invoice.landlordEmail}</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-1">
              <div className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                Tenant's Information
              </div>
              <div className="font-bold text-slate-900 dark:text-white">{invoice.tenantName}</div>
              <div className="text-slate-600 dark:text-slate-300">{invoice.tenantAddress}</div>
              <div className="text-slate-500 dark:text-slate-400">{invoice.tenantPhone} • {invoice.tenantEmail}</div>
            </div>
          </div>

          {/* Itemized Table */}
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
                {(invoice.items || []).map((item, idx) => (
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

            {/* Subtotal & Total Amount Due */}
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">₦{Number(invoice.subtotal || invoice.grandTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-white/10">
                <span>Total Amount Due</span>
                <span className="text-emerald-700 dark:text-[#E5C583] text-lg font-extrabold">₦{Number(invoice.subtotal || invoice.grandTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Paystack Official Online Payment Card (Primary CTA) */}
          {!isPaid && (
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/40 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">Official Payment Gateway</span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">Pay Online via Paystack</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg">
                    Instant automated payment verification. Pay securely using Debit Card, Direct Bank Transfer, or USSD without manual receipts or confirmation delays.
                  </p>
                </div>
                <div className="text-left sm:text-right sm:shrink-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Total Amount Due</span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-[#E5C583]">₦{Number(invoice.subtotal || invoice.grandTotal || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Secured 256-bit encryption by Paystack</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  disabled={submitting}
                  onClick={handlePaystackPay}
                  className="w-full sm:w-auto px-8 py-3 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Connecting to Paystack...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Pay ₦{Number(invoice.subtotal || invoice.grandTotal || 0).toLocaleString()} with Paystack
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Fallback Option: Collapsed by Default */}
          {!isPaid && (
            <div className="pt-2 text-left">
              <button
                type="button"
                onClick={() => setShowManualFallback((prev) => !prev)}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1.5 transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                {showManualFallback ? 'Hide manual transfer details' : 'Having trouble paying online? Click here for manual transfer details'}
              </button>

              {showManualFallback && (
                <div className="mt-4 space-y-4">
                  {/* Landlord Bank Transfer Details */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-emerald-600 dark:text-[#E5C583]" />
                        Landlord Bank Transfer Details (Manual Fallback)
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        Manual Verification
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Transfer the exact amount of <strong>₦{Number(invoice.subtotal || invoice.grandTotal || 0).toLocaleString()}</strong> to the landlord's account below:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Account Number</span>
                          <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base">{invoice.bankAccountNumber || '0123456789'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(invoice.bankAccountNumber, 'Account Number')}
                          className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-[#E5C583] hover:bg-emerald-100 cursor-pointer border-none"
                          title="Copy Account Number"
                        >
                          {copiedField === 'Account Number' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Bank Name</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{invoice.bankName || 'GTBank'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(invoice.bankName, 'Bank Name')}
                          className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-[#E5C583] hover:bg-emerald-100 cursor-pointer border-none"
                          title="Copy Bank Name"
                        >
                          {copiedField === 'Bank Name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#07130D] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Account Name</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[130px] block">{invoice.bankAccountName || invoice.landlordName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(invoice.bankAccountName || invoice.landlordName, 'Account Name')}
                          className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-[#E5C583] hover:bg-emerald-100 cursor-pointer border-none"
                          title="Copy Account Name"
                        >
                          {copiedField === 'Account Name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manual Payment Proof Submission Form */}
                  <form onSubmit={handleConfirmPayment} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Confirm Manual Transfer & Attach Evidence
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Transfer Reference / Transaction Hash *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TXN980123847 or Bank Ref #88019"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        required
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#07130D] text-slate-900 dark:text-white outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Upload Payment Receipt / Evidence (PDF or Image, max 5MB)
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 dark:file:bg-emerald-900/50 dark:file:text-emerald-300 hover:file:bg-emerald-200 cursor-pointer"
                      />
                    </div>

                    {receiptFileName && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 font-semibold truncate">
                        Attached Proof: <strong>{receiptFileName}</strong>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowManualFallback(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting}
                        className="px-6 py-2 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Payment Proof to Landlord'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {isPaid && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">Payment Completed</span>
                  <p className="text-[11px] opacity-80">Reference: {invoice.paymentReference || 'Confirmed'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold text-xs cursor-pointer border-none"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
