import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ArrowLeft, Briefcase, User, Phone, DollarSign, MessageSquare } from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import { propertyService } from "../services/propertyService";
import { applicationService } from "../services/applicationService";
import { triggerToast } from "../context/ToastContext";

export default function Application() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [appStatus, setAppStatus] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    notes: "",
    monthlyIncome: "",
    employmentStatus: "Employed",
    employerName: "",
    occupation: "",
    maritalStatus: "Single",
    dependants: "0",
    guarantorName: "",
    guarantorPhone: "",
    guarantorRelationship: "Parent"
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, existingApp] = await Promise.all([
          propertyService.getPropertyById(listingId),
          applicationService.getApplicationForProperty(listingId),
        ]);
        setListing(data);
        if (existingApp) {
          setHasApplied(true);
          setAppStatus(existingApp.status || "Pending");
        }
      } catch (err) {
        console.warn("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (listingId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [listingId]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      await applicationService.apply(listingId, formData);
      triggerToast("Application submitted successfully! The landlord will review your profile.", "success", "Application Sent");
      navigate("/dashboard/tenant?tab=4");
    } catch (err) {
      const message = err.message || "Failed to submit application.";
      if (message.toLowerCase().includes("already")) {
        triggerToast("You have already applied for this property.", "info", "Already Applied");
        setHasApplied(true);
      } else {
        triggerToast(message, "error", "Application Error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0B1512] py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-cream-100 hover:text-ink-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Listing
          </button>
          <Logo />
        </div>

        <div className="rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 sm:p-8 shadow-sm text-left">
          <div className="flex items-center gap-4 pb-6 border-b border-ink-100 dark:border-white/10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-moss-100 dark:bg-moss-900/40 text-moss-700 dark:text-moss-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-900 dark:text-white">
                Apply for Tenancy
              </h1>
              <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">
                {loading ? "Loading property..." : (listing?.title || "Property Listing")}
                {listing?.location ? ` • ${listing.location}` : (listing?.city ? ` • ${listing.city}` : "")}
              </p>
            </div>
          </div>

          {hasApplied ? (
            <div className="mt-6 rounded-xl bg-moss-50 dark:bg-moss-900/20 border border-moss-200 dark:border-moss-800 p-6 text-center text-sm text-moss-900 dark:text-moss-300 font-medium">
              You have already submitted an application for this property.<br />
              Current Status: <span className="font-bold uppercase tracking-wider text-moss-700 dark:text-moss-400">{appStatus}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              
              {/* Section 1: Note to Landlord */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-moss-600" /> Note to Landlord
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Introduce yourself and explain why you're interested in this property..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-3 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors resize-none"
                />
              </div>

              {/* Section 2: Employment & Income */}
              <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-moss-600" /> Employment & Financial Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Declared Monthly Income (₦)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 350000"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Employment Status</label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#16241F] px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    >
                      <option value="Employed">Employed</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Student">Student</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Employer / Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Tech Solutions"
                      value={formData.employerName}
                      onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Occupation / Profession</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Household */}
              <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-moss-600" /> Household Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Marital Status</label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#16241F] px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Number of Dependants</label>
                    <select
                      value={formData.dependants}
                      onChange={(e) => setFormData({ ...formData, dependants: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#16241F] px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    >
                      <option value="0">None (0)</option>
                      <option value="1">1 Dependant</option>
                      <option value="2">2 Dependants</option>
                      <option value="3">3+ Dependants</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Guarantor Info */}
              <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-moss-600" /> Guarantor Information
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                    Required for Application
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Guarantor Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. John Doe"
                      value={formData.guarantorName}
                      onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Guarantor Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +234 801 234 5678"
                      value={formData.guarantorPhone}
                      onChange={(e) => setFormData({ ...formData, guarantorPhone: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Guarantor Relationship *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Parent, Employer, Relative"
                      value={formData.guarantorRelationship}
                      onChange={(e) => setFormData({ ...formData, guarantorRelationship: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-600 dark:text-cream-100/70 mb-1">Guarantor Email</label>
                    <input
                      type="email"
                      placeholder="e.g. guarantor@example.com"
                      value={formData.guarantorEmail}
                      onChange={(e) => setFormData({ ...formData, guarantorEmail: e.target.value })}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3 py-2.5 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-6 w-full flex items-center justify-center gap-2 !py-3 bg-moss-600 hover:bg-moss-700 text-white font-bold"
                disabled={loading || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : "Submit Application"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

