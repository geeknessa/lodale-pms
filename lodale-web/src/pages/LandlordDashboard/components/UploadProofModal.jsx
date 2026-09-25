import React, { useState } from 'react';
import { X, Upload, ShieldAlert, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { propertyService } from '../../../services/propertyService';
import { triggerToast } from '../../../context/ToastContext';

export default function UploadProofModal({ isOpen, onClose, property, onSuccess }) {
  if (!isOpen || !property) return null;

  const [docType, setDocType] = useState('Certificate of Occupancy (C of O)');
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState('');
  const [docDataUrl, setDocDataUrl] = useState('');
  const [landlordNotes, setLandlordNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      triggerToast('File size must be under 10MB.', 'warning', 'File Too Large');
      return;
    }

    setDocFile(file);
    setDocFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!docFileName && !docDataUrl) {
      triggerToast('Please select a document file to upload as proof of ownership.', 'warning', 'File Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatePayload = {
        status: 'pending_review',
        verificationStatus: 'Under Verification',
        ownership_doc: `${docType}: ${docFileName}`,
        ownership_doc_name: docFileName,
        ownership_doc_url: docDataUrl || docFileName,
        ownership_doc_type: docType,
        admin_notes: landlordNotes ? `Landlord Note: ${landlordNotes}` : 'Updated proof of ownership uploaded by landlord.'
      };

      // Update backend via API if ID is valid
      try {
        await propertyService.updateProperty(property.id, updatePayload);
      } catch (err) {
        console.warn('API update failed, updating local state:', err);
      }

      // Update per-user session storage array
      try {
        const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
        const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
        const userKey = "landlord_properties_" + (currentUserId || userEmail);
        const sProps = sessionStorage.getItem(userKey);
        if (sProps) {
          const arr = JSON.parse(sProps);
          const updated = arr.map(p => String(p.id) === String(property.id) ? { ...p, ...updatePayload } : p);
          sessionStorage.setItem(userKey, JSON.stringify(updated));
        }
      } catch (_e) {}

      // Add notification to landlord feed
      try {
        const savedNotifs = localStorage.getItem('landlordNotifications');
        const currentNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
        const newNotif = {
          id: 'notif-proof-' + Date.now(),
          title: 'Proof Submitted to Admin',
          message: `Your updated proof of ownership for "${property.title}" has been submitted and is under admin review.`,
          time: 'Just now',
          type: 'info',
          read: false
        };
        localStorage.setItem('landlordNotifications', JSON.stringify([newNotif, ...currentNotifs]));
      } catch (_e) {}

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('propertyUpdated', { detail: { id: property.id, status: 'pending_review' } }));

      triggerToast('Proof of ownership submitted to Admin! Property status changed to Pending Review.', 'success', 'Proof Uploaded');

      if (onSuccess) onSuccess({ ...property, ...updatePayload });
      onClose();
    } catch (err) {
      console.error('Failed to submit proof:', err);
      triggerToast('Failed to submit proof. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 text-left text-ink-900 dark:text-white font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-100 dark:border-white/10 bg-cream-50 dark:bg-[#162721]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink-900 dark:text-white">Upload Proof of Ownership</h3>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">Submit updated title documents to Admin for property verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-white/10 dark:hover:bg-white/20 text-ink-600 dark:text-cream-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Target Property Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Target Property</span>
            <p className="font-bold text-sm text-ink-900 dark:text-white">{property.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{property.location}</p>
          </div>

          {/* Admin Note Warning Banner */}
          {(property.admin_notes || property.adminNotes) && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">Admin Request Notes:</span>
                <p className="text-rose-800 dark:text-rose-200 leading-relaxed font-medium">
                  {property.admin_notes || property.adminNotes}
                </p>
              </div>
            </div>
          )}

          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-cream-100/70 mb-1.5">
              Document Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 rounded-xl text-xs font-bold text-ink-900 dark:text-white focus:outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
            >
              <option value="Certificate of Occupancy (C of O)">Certificate of Occupancy (C of O)</option>
              <option value="Deed of Assignment">Deed of Assignment</option>
              <option value="Governor's Consent">Governor's Consent</option>
              <option value="Land Purchase Receipt & Survey Plan">Land Purchase Receipt & Survey Plan</option>
              <option value="Building Plan Approval">Building Plan Approval</option>
              <option value="Other Official Title Document">Other Official Title Document</option>
            </select>
          </div>

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-cream-100/70 mb-1.5">
              Proof File (PDF, PNG, JPG) <span className="text-rose-500">*</span>
            </label>
            <div className="relative border-2 border-dashed border-ink-200 dark:border-white/20 hover:border-moss-600 dark:hover:border-[#E5C583] rounded-2xl p-5 text-center transition-all bg-cream-50/50 dark:bg-white/5 cursor-pointer">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="h-8 w-8 text-moss-700 dark:text-[#E5C583] mx-auto mb-2" />
              {docFileName ? (
                <div>
                  <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block">{docFileName}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Click to select a different file</span>
                </div>
              ) : (
                <div>
                  <span className="font-bold text-xs text-ink-900 dark:text-white block">Click or Drag File to Upload</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Supports PDF, PNG, JPG (Max 10MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Landlord Additional Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-cream-100/70 mb-1.5">
              Message to Admin (Optional)
            </label>
            <textarea
              rows={3}
              value={landlordNotes}
              onChange={(e) => setLandlordNotes(e.target.value)}
              placeholder="e.g. Attached is the newly stamped Deed of Assignment from the Land Registry..."
              className="w-full p-3 bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 rounded-xl text-xs text-ink-900 dark:text-white focus:outline-none focus:border-moss-600 dark:focus:border-[#E5C583] resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-ink-100 dark:border-white/10">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-moss-700 hover:bg-moss-800 text-white dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] dark:text-[#16241F] font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting to Admin...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Submit Proof to Admin
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
