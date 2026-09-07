import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2, XCircle, Loader2, ArrowLeft, Briefcase, User, Phone,
  DollarSign, MessageSquare, ShieldCheck, AlertTriangle, Check
} from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import { propertyService } from "../services/propertyService";
import { applicationService } from "../services/applicationService";
import { triggerToast } from "../context/ToastContext";
import { INCOME_RANGES, doesIncomeMeetRequirement } from "../utils/incomeRanges";

import SearchableOccupationSelect from "../components/SearchableOccupationSelect";

export default function Application() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [appStatus, setAppStatus] = useState("");

  // Prefilled Form State
  const [formData, setFormData] = useState({
    notes: "",
    monthlyIncome: "",
    employmentStatus: "",
    employerName: "",
    occupation: "",
    maritalStatus: "Single",
    dependants: "0",
    guarantorName: "",
    guarantorPhone: "",
    guarantorRelationship: "Parent",
    guarantorEmail: ""
  });

  // House Rules Agreement Checkboxes State
  const [agreedRules, setAgreedRules] = useState([]);

  useEffect(() => {
    // 1. Prefill from Tenant Profile
    const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    const rawProf = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (userEmail ? localStorage.getItem("tenantProfile_" + userEmail) : null);
    if (rawProf) {
      try {
        const prof = JSON.parse(rawProf);
        setFormData(prev => ({
          ...prev,
          monthlyIncome: prof.income || prof.monthlyIncome || prof.monthly_income || prev.monthlyIncome,
          employmentStatus: prof.employmentStatus || prof.employment_status || prev.employmentStatus,
          employerName: prof.employerName || prof.employer_name || prev.employerName,
          occupation: prof.occupation || prev.occupation,
          maritalStatus: prof.maritalStatus || prof.marital_status || prev.maritalStatus,
          dependants: String(prof.dependants ?? prof.number_of_dependants ?? prev.dependants),
          guarantorName: prof.guarantorName || prof.guarantor_name || prev.guarantorName,
          guarantorPhone: prof.guarantorPhone || prof.guarantor_phone || prev.guarantorPhone,
          guarantorRelationship: prof.guarantorRelationship || prof.guarantor_relationship || prev.guarantorRelationship,
          guarantorEmail: prof.guarantorEmail || prof.guarantor_email || prev.guarantorEmail
        }));
      } catch (e) { }
    }

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

  // Requirements checks
  const requiredIncome = listing?.minimum_income_required || listing?.minimumIncome || "No Minimum Income";
  const meetsIncome = doesIncomeMeetRequirement(formData.monthlyIncome, requiredIncome);

  // Parse house rules list from listing
  const propertyRulesList = Array.isArray(listing?.house_rules)
    ? listing.house_rules
    : (typeof listing?.rules === 'string' && listing.rules ? listing.rules.split(',').map(r => r.trim()) : []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!meetsIncome) {
      triggerToast(`Your annual income tier (${formData.monthlyIncome || 'Not Provided'}) does not meet the landlord requirement (${requiredIncome}). You cannot apply.`, "error", "Qualification Blocked");
      return;
    }

    if (!formData.guarantorName.trim() || !formData.guarantorPhone.trim() || !formData.guarantorEmail.trim()) {
      triggerToast("Guarantor details (Full Name, Phone Number, Email) are mandatory for submitting an application.", "warning", "Guarantor Required");
      return;
    }

    if (propertyRulesList.length > 0 && agreedRules.length < propertyRulesList.length) {
      triggerToast("Please confirm compliance with all landlord house rules before submitting.", "warning", "House Rules Required");
      return;
    }

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
            className="flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-cream-100 hover:text-ink-900 transition-colors cursor-pointer"
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
                {listing?.title} • ₦{Number(listing?.price || listing?.rent_amount || 0).toLocaleString()} / {listing?.rent_period || 'year'}
              </p>
            </div>
          </div>

          {hasApplied ? (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                Application Already Submitted
              </h2>
              <p className="text-xs text-ink-600 dark:text-cream-100/70 max-w-md mx-auto">
                You have an existing application for <strong>{listing?.title}</strong>. Current Status: <span className="font-bold text-moss-700 dark:text-[#E5C583]">{appStatus}</span>.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button onClick={() => navigate("/dashboard/tenant?tab=4")} className="bg-moss-600 hover:bg-moss-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl">
                  View My Applications
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-moss-600 mx-auto" />
              <p className="text-xs text-ink-500 dark:text-cream-100/60 font-semibold">Loading listing details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              {/* Landlord Income Tier Qualification Warning Banner */}
              {!meetsIncome && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5 font-medium">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm text-rose-700 dark:text-rose-300">Application Blocked: Annual Income Requirement Unmet</span>
                    <p className="mt-0.5 leading-relaxed">
                      The landlord requires an annual income tier of <strong>{requiredIncome}</strong>. Your recorded profile income range is <strong>{formData.monthlyIncome || 'Not Provided'}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Additional Notes / Message */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100">
                  Message to Landlord (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Introduce yourself, mention your move-in timeline, or add any notes for the landlord..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-3 text-xs text-ink-900 dark:text-white bg-cream-50/50 dark:bg-white/5 outline-none focus:border-moss-600 transition-colors"
                />
              </div>

              {/* Section 2: Profile Overview */}
              <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-moss-600" /> Applicant Financials & Employment Profile
                  </h3>
                  {meetsIncome ? (
                    <span className="text-[10.5px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-600" /> Meets Income Requirement
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-rose-600" /> Does Not Meet Requirement
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Annual Income Range</label>
                    <select
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#12221C] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 font-medium"
                    >
                      <option value="">Select Annual Income Range</option>
                      {INCOME_RANGES.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Employment Status</label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, employmentStatus: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#12221C] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 font-medium cursor-pointer"
                    >
                      <option value="Employed">Employed</option>
                      <option value="Student">Student</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>

                  {(formData.employmentStatus === "Employed" || formData.employmentStatus?.toLowerCase().startsWith("employed")) && (
                    <div>
                      <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Occupation</label>
                      <SearchableOccupationSelect
                        value={formData.occupation}
                        onChange={(val) => setFormData(prev => ({ ...prev, occupation: val }))}
                        placeholder="Search or select occupation..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Employer / Institution Name</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Lagos / TechCorp"
                      value={formData.employerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, employerName: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Mandatory Guarantor Information */}
              <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-moss-600" /> Mandatory Guarantor Details <span className="text-rose-500">*</span>
                  </h3>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                    Mandatory
                  </span>
                </div>

                <p className="text-xs text-ink-500 dark:text-cream-100/70">
                  Landlord policy requires a valid guarantor. Please complete or verify your guarantor's information below:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">
                      Guarantor Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chief John Doe"
                      value={formData.guarantorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantorName: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">
                      Guarantor Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +234 801 234 5678"
                      value={formData.guarantorPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantorPhone: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">
                      Guarantor Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. guarantor@example.com"
                      value={formData.guarantorEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantorEmail: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">
                      Relationship to Tenant <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.guarantorRelationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantorRelationship: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#12221C] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Employer">Employer</option>
                      <option value="Relative">Relative</option>
                      <option value="Sponsor / Benefactor">Sponsor / Benefactor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Landlord House Rules Checklist (Checkboxes) */}
              {propertyRulesList.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-moss-600" /> Confirm Landlord House Rules Compliance
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-cream-100/70">
                    Tick to confirm you meet and agree to abide by each rule for this property:
                  </p>

                  <div className="space-y-2">
                    {propertyRulesList.map((rule) => {
                      const isChecked = agreedRules.includes(rule);
                      return (
                        <label
                          key={rule}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${isChecked
                            ? 'bg-moss-50 border-moss-300 text-moss-900 dark:bg-moss-950/40 dark:border-moss-800 dark:text-cream-100'
                            : 'bg-cream-50/50 dark:bg-white/5 border-ink-200 dark:border-white/10 text-ink-800 dark:text-cream-100/80'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAgreedRules(prev => [...prev, rule]);
                              } else {
                                setAgreedRules(prev => prev.filter(r => r !== rule));
                              }
                            }}
                            className="h-4 w-4 rounded accent-moss-600 cursor-pointer"
                          />
                          <span>I confirm compliance with rule: <strong>{rule}</strong></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="mt-6 w-full flex items-center justify-center gap-2 !py-3.5 bg-moss-600 hover:bg-moss-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading || submitting || !meetsIncome || !formData.guarantorName.trim() || !formData.guarantorPhone.trim() || !formData.guarantorEmail.trim() || (propertyRulesList.length > 0 && agreedRules.length < propertyRulesList.length)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : !meetsIncome ? (
                  "Blocked: Income Below Requirement"
                ) : !formData.guarantorName.trim() || !formData.guarantorPhone.trim() || !formData.guarantorEmail.trim() ? (
                  "Mandatory Guarantor Details Required"
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
