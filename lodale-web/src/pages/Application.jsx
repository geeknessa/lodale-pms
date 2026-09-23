import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle2, XCircle, Loader2, ArrowLeft, Briefcase, User, Phone,
  ShieldCheck, AlertTriangle, Check, Building2, Home, MapPin, Info, AlertCircle,
  Users, Plus, Trash2
} from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import Input from "../components/Input";
import { propertyService } from "../services/propertyService";
import { applicationService } from "../services/applicationService";
import { triggerToast } from "../context/ToastContext";
import { useTenantQualification } from "../hooks/useTenantQualification";
import { getApplicationSchema } from "../schemas/applicationSchemas";

export default function Application() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse unit parameter from URL query (e.g. ?unit=Unit%201)
  const queryParams = new URLSearchParams(location.search);
  const initialUnit = queryParams.get("unit") || "";

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [appStatus, setAppStatus] = useState("");
  const [isFirstTimeRenting, setIsFirstTimeRenting] = useState(false);
  const [tenantProfile, setTenantProfile] = useState(null);

  // Application Form State
  const [formData, setFormData] = useState({
    unitName: initialUnit,
    maritalStatus: "Single",
    notes: "",
    // Employer details (if employed)
    employerName: "",
    employerContact: "",
    // Rental History
    previousAddress: "",
    previousLandlordName: "",
    previousLandlordPhone: "",
    durationOfStay: "",
    reasonForMoving: "",
    // Guarantor details
    guarantorName: "",
    guarantorPhone: "",
    guarantorRelationship: "Parent",
    guarantorEmail: ""
  });

  // Other Co-Occupants State
  const [occupants, setOccupants] = useState([]);

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // House Rules Checklist State
  const [agreedRules, setAgreedRules] = useState([]);

  useEffect(() => {
    // Load pre-filled profile details for guarantor, marital status, and employer if present
    const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    const rawProf = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (userEmail ? localStorage.getItem("tenantProfile_" + userEmail) : null);
    
    if (rawProf) {
      try {
        const prof = JSON.parse(rawProf);
        setTenantProfile(prof);
        setFormData(prev => ({
          ...prev,
          maritalStatus: prof.maritalStatus || prof.marital_status || prev.maritalStatus,
          employerName: prof.employerName || prof.employer_name || prev.employerName,
          employerContact: prof.employerContact || prof.employer_contact || prof.employerPhone || prev.employerContact,
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
        
        // Auto-select unit if there's only 1 vacant unit or if specified in query
        if (data && Array.isArray(data.units) && data.units.length > 0) {
          if (initialUnit) {
            setFormData(prev => ({ ...prev, unitName: initialUnit }));
          } else if (data.units.length === 1) {
            setFormData(prev => ({ ...prev, unitName: data.units[0].unit_name }));
          }
        }
      } catch (err) {
        console.warn("Failed to load property application data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [listingId, initialUnit]);

  // Requirements & qualification checks
  const { meetsIncome, requirements, tenantStats } = useTenantQualification(listing);
  const requiredIncome = requirements?.income || 'No Minimum Income';
  const requiresGuarantor = listing?.requires_guarantor ?? listing?.requiresGuarantor ?? true;

  // Check if tenant profile or current form indicates employed
  const tenantEmpStatus = (tenantProfile?.employmentStatus || tenantProfile?.employment_status || "Employed").toLowerCase();
  const isEmployed = tenantEmpStatus.includes("employed") && !tenantEmpStatus.includes("unemployed");

  // Multi-unit property check
  const hasMultipleUnits = Boolean(listing?.units && listing.units.length > 1);

  // House Rules list
  const propertyRulesList = Array.isArray(listing?.house_rules)
    ? listing.house_rules.map(r => typeof r === 'string' ? r.replace(/^[{"]+|[}"]+$/g, '').trim() : r)
    : (typeof listing?.rules === 'string' && listing.rules ? listing.rules.split(',').map(r => r.replace(/^[{"]+|[}"]+$/g, '').trim()).filter(Boolean) : []);

  // Occupants Management
  const addOccupant = () => {
    setOccupants(prev => [
      ...prev,
      { name: "", relationship: "Spouse", isAdult: true, age: "" }
    ]);
  };

  const removeOccupant = (index) => {
    setOccupants(prev => prev.filter((_, i) => i !== index));
  };

  const updateOccupant = (index, field, value) => {
    setOccupants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Inline Validation Handler
  const validateField = (name, value) => {
    const schema = getApplicationSchema({ requiresGuarantor, isEmployed, hasMultipleUnits, isFirstTimeRenting });
    const result = schema.safeParse({ ...formData, [name]: value, occupants });
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path[0] === name);
      setErrors(prev => ({ ...prev, [name]: issue ? issue.message : null }));
    } else {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Mark all fields touched
    const allTouched = {
      unitName: true,
      employerName: true,
      employerContact: true,
      previousAddress: true,
      previousLandlordName: true,
      previousLandlordPhone: true,
      durationOfStay: true,
      reasonForMoving: true,
      guarantorName: true,
      guarantorPhone: true,
      guarantorRelationship: true,
      guarantorEmail: true
    };
    setTouched(allTouched);

    const schema = getApplicationSchema({ requiresGuarantor, isEmployed, hasMultipleUnits, isFirstTimeRenting });
    const validation = schema.safeParse({ ...formData, occupants });

    if (!validation.success) {
      const newErrors = {};
      validation.error.issues.forEach(issue => {
        if (issue.path[0]) newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      triggerToast("Please fix the highlighted errors in the form before submitting.", "warning", "Validation Error");
      return;
    }

    if (!meetsIncome) {
      triggerToast(`Your annual income tier (${tenantStats.income}) does not meet the landlord requirement (${requirements.income}). You cannot apply.`, "error", "Qualification Blocked");
      return;
    }

    if (propertyRulesList.length > 0 && agreedRules.length < propertyRulesList.length) {
      triggerToast("Please confirm compliance with all landlord house rules before submitting.", "warning", "House Rules Required");
      return;
    }

    setSubmitting(true);
    try {
      // Build structured application payload
      const payload = {
        unitName: formData.unitName,
        maritalStatus: formData.maritalStatus,
        occupants: occupants.map(occ => ({
          name: occ.name.trim(),
          relationship: occ.relationship,
          isAdult: occ.isAdult,
          ageGroup: occ.isAdult ? "Adult (18+)" : "Child (Under 18)",
          age: occ.age ? occ.age.trim() : null
        })),
        employerName: isEmployed ? formData.employerName.trim() : null,
        employerContact: isEmployed ? formData.employerContact.trim() : null,
        rentalHistory: isFirstTimeRenting ? null : {
          previousAddress: formData.previousAddress.trim(),
          previousLandlordName: formData.previousLandlordName.trim(),
          previousLandlordPhone: formData.previousLandlordPhone.trim(),
          durationOfStay: formData.durationOfStay.trim(),
          reasonForMoving: formData.reasonForMoving.trim()
        },
        guarantorName: requiresGuarantor ? formData.guarantorName.trim() : null,
        guarantorPhone: requiresGuarantor ? formData.guarantorPhone.trim() : null,
        guarantorRelationship: requiresGuarantor ? formData.guarantorRelationship.trim() : null,
        guarantorEmail: requiresGuarantor && formData.guarantorEmail ? formData.guarantorEmail.trim() : null,
        notes: formData.notes
      };

      await applicationService.apply(listingId, payload);
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
          {/* Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-ink-100 dark:border-white/10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-moss-100 dark:bg-moss-900/40 text-moss-700 dark:text-moss-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-900 dark:text-white">
                Apply for Tenancy
              </h1>
              <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">
                {listing?.title} • ₦{Number(String(listing?.price || listing?.rent_amount || '0').replace(/[^\d.]/g, '')).toLocaleString()} / {listing?.rent_period || 'year'}
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
                <Button onClick={() => navigate("/dashboard/tenant?tab=4")} className="bg-moss-600 hover:bg-moss-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer">
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
              
              {/* Informational Profile Sharing Banner */}
              <div className="p-4 rounded-2xl bg-moss-500/10 border border-moss-500/20 text-moss-900 dark:text-moss-200 text-xs flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-moss-600 dark:text-[#E5C583] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-moss-900 dark:text-cream-100">
                    Verified Tenant Profile Transmitted Automatically
                  </h4>
                  <p className="mt-1 leading-relaxed text-ink-600 dark:text-cream-100/80">
                    When you submit this application, your verified identity profile (including your Annual Income Tier, Employment Status, Occupation, and Verification status) will be securely shared with the landlord to expedite approval.
                  </p>
                </div>
              </div>

              {/* Landlord Income Tier Qualification Warning Banner */}
              {!meetsIncome && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5 font-medium">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm text-rose-700 dark:text-rose-300">Application Blocked: Annual Income Requirement Unmet</span>
                    <p className="mt-0.5 leading-relaxed">
                      The landlord requires an annual income tier of <strong>{requiredIncome}</strong>. Your recorded profile income range is <strong>{tenantStats.income || 'Not Provided'}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Sleek Attached Profile Summary Preview Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-cream-50/70 dark:bg-white/5 border border-ink-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-ink-100 dark:border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> Attached Tenant Profile Summary
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-600" /> Attached
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10.5px] font-bold text-ink-400 dark:text-cream-100/50 uppercase block">Income Tier</span>
                    <span className="font-bold text-ink-900 dark:text-white">{tenantStats.income || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-ink-400 dark:text-cream-100/50 uppercase block">Employment</span>
                    <span className="font-bold text-ink-900 dark:text-white">{tenantStats.employment || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-ink-400 dark:text-cream-100/50 uppercase block">Occupation</span>
                    <span className="font-bold text-ink-900 dark:text-white">{tenantProfile?.occupation || "Provided in Profile"}</span>
                  </div>
                </div>
              </div>

              {/* Multi-Unit Selector (If Multi-Unit Property) */}
              {hasMultipleUnits && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-ink-800 dark:text-cream-100">
                    Select Unit You Are Applying To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.unitName}
                    onChange={(e) => handleInputChange("unitName", e.target.value)}
                    onBlur={() => handleBlur("unitName")}
                    className={`w-full rounded-xl border ${errors.unitName ? 'border-rose-500 bg-rose-500/5' : 'border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#12221C]'} p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 font-medium cursor-pointer`}
                  >
                    <option value="">-- Choose Unit --</option>
                    {listing.units.map((unit, idx) => (
                      <option key={idx} value={unit.unit_name} disabled={unit.status?.toLowerCase() !== 'vacant'}>
                        {unit.unit_name} ({unit.bedrooms || 1} Bed, {unit.bathrooms || 1} Bath - ₦{Number(unit.rent_amount || 0).toLocaleString()}/{unit.rent_period || 'yr'}) {unit.status?.toLowerCase() !== 'vacant' ? '[Occupied]' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.unitName && (
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.unitName}
                    </p>
                  )}
                </div>
              )}

              {/* Marital Status Field */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-ink-800 dark:text-cream-100">
                  Marital Status
                </label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#12221C] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 font-medium cursor-pointer"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* Section: Other Occupants */}
              <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> Other Occupants Living With You
                  </h3>
                  <button
                    type="button"
                    onClick={addOccupant}
                    className="text-xs font-bold text-moss-700 dark:text-[#E5C583] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Occupant
                  </button>
                </div>

                <p className="text-xs text-ink-500 dark:text-cream-100/70">
                  List any family members, dependents, or co-occupants who will reside in the property with you:
                </p>

                {occupants.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-ink-200 dark:border-white/10 text-center text-xs text-ink-400 dark:text-cream-100/50">
                    No co-occupants added. If you will live alone, leave this empty.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {occupants.map((occ, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-ink-100 dark:border-white/10">
                          <span className="text-xs font-bold text-ink-800 dark:text-cream-100">
                            Occupant #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeOccupant(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <Input
                            label="Full Name *"
                            placeholder="e.g. Mary Jane"
                            value={occ.name}
                            onChange={(e) => updateOccupant(idx, "name", e.target.value)}
                          />

                          <div>
                            <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
                              Relationship *
                            </label>
                            <select
                              value={occ.relationship}
                              onChange={(e) => updateOccupant(idx, "relationship", e.target.value)}
                              className="w-full h-[42px] rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-[#07130D] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors"
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Child / Son / Daughter">Child / Son / Daughter</option>
                              <option value="Parent">Parent</option>
                              <option value="Sibling">Sibling</option>
                              <option value="Relative">Relative</option>
                              <option value="Roommate / Friend">Roommate / Friend</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div>
                            <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
                              Age Category *
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => updateOccupant(idx, "isAdult", true)}
                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${occ.isAdult
                                  ? 'bg-moss-600 text-white border-moss-600 dark:bg-[#E5C583] dark:text-[#09090b] dark:border-[#E5C583]'
                                  : 'bg-white dark:bg-white/5 text-ink-700 dark:text-cream-100 border-ink-200 dark:border-white/10'
                                  }`}
                              >
                                Adult (18+ yrs)
                              </button>
                              <button
                                type="button"
                                onClick={() => updateOccupant(idx, "isAdult", false)}
                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${!occ.isAdult
                                  ? 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:text-black dark:border-amber-500'
                                  : 'bg-white dark:bg-white/5 text-ink-700 dark:text-cream-100 border-ink-200 dark:border-white/10'
                                  }`}
                              >
                                Child (Under 18)
                              </button>
                            </div>
                          </div>

                          <Input
                            label="Exact Age / Date of Birth (Optional)"
                            placeholder={occ.isAdult ? "e.g. 25 yrs or 1999-05-12" : "e.g. 8 yrs or 2016-08-20"}
                            value={occ.age}
                            onChange={(e) => updateOccupant(idx, "age", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 1: Employer Name & Contact (If Employed) */}
              {isEmployed && (
                <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> Employment Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Input
                      label="Employer / Business Name *"
                      placeholder="e.g. Chevron Nigeria / TechCorp"
                      value={formData.employerName}
                      error={errors.employerName}
                      touched={touched.employerName}
                      onChange={(e) => handleInputChange("employerName", e.target.value)}
                      onBlur={() => handleBlur("employerName")}
                    />
                    <Input
                      label="Employer Contact (Phone or Email) *"
                      placeholder="e.g. hr@company.com or +234 801 234 5678"
                      value={formData.employerContact}
                      error={errors.employerContact}
                      touched={touched.employerContact}
                      onChange={(e) => handleInputChange("employerContact", e.target.value)}
                      onBlur={() => handleBlur("employerContact")}
                    />
                  </div>
                </div>
              )}

              {/* Section 2: Rental History */}
              <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> Rental History
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={isFirstTimeRenting} 
                        onChange={(e) => {
                          setIsFirstTimeRenting(e.target.checked);
                          if (e.target.checked) {
                            setErrors(prev => {
                              const newErrs = { ...prev };
                              delete newErrs.previousAddress;
                              delete newErrs.previousLandlordName;
                              delete newErrs.previousLandlordPhone;
                              delete newErrs.durationOfStay;
                              delete newErrs.reasonForMoving;
                              return newErrs;
                            });
                          }
                        }} 
                      />
                      <div className={`w-8 h-4.5 rounded-full transition-colors ${isFirstTimeRenting ? 'bg-moss-500' : 'bg-ink-200 dark:bg-ink-700'}`}></div>
                      <div className={`absolute left-0.5 top-[2px] w-3.5 h-3.5 rounded-full bg-white transition-transform ${isFirstTimeRenting ? 'translate-x-[14px]' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-xs font-semibold text-ink-600 dark:text-cream-100/70 group-hover:text-ink-900 dark:group-hover:text-white transition-colors">
                      This is my first time renting
                    </span>
                  </label>
                </div>

                {!isFirstTimeRenting && (
                  <>
                    <Input
                      label="Previous Residence Address *"
                      placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos"
                      value={formData.previousAddress}
                      onChange={(e) => handleInputChange("previousAddress", e.target.value)}
                      error={errors.previousAddress}
                      touched={touched.previousAddress}
                      onBlur={() => handleBlur("previousAddress")}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Input
                        label="Previous Landlord / Manager Name *"
                        placeholder="e.g. Mr. Timothy Adebayo"
                        value={formData.previousLandlordName}
                        onChange={(e) => handleInputChange("previousLandlordName", e.target.value)}
                        error={errors.previousLandlordName}
                        touched={touched.previousLandlordName}
                        onBlur={() => handleBlur("previousLandlordName")}
                      />
                      <Input
                        label="Previous Landlord Contact Phone *"
                        placeholder="e.g. +234 802 345 6789"
                        value={formData.previousLandlordPhone}
                        onChange={(e) => handleInputChange("previousLandlordPhone", e.target.value)}
                        error={errors.previousLandlordPhone}
                        touched={touched.previousLandlordPhone}
                        onBlur={() => handleBlur("previousLandlordPhone")}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Input
                        label="Duration of Stay *"
                        placeholder="e.g. 2 years (2022 - 2024)"
                        value={formData.durationOfStay}
                        onChange={(e) => handleInputChange("durationOfStay", e.target.value)}
                        error={errors.durationOfStay}
                        touched={touched.durationOfStay}
                        onBlur={() => handleBlur("durationOfStay")}
                      />
                      <Input
                        label="Reason for Moving *"
                        placeholder="e.g. Relocating closer to workplace"
                        value={formData.reasonForMoving}
                        onChange={(e) => handleInputChange("reasonForMoving", e.target.value)}
                        error={errors.reasonForMoving}
                        touched={touched.reasonForMoving}
                        onBlur={() => handleBlur("reasonForMoving")}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Section 3: Guarantor Details (Renders ONLY if landlord requires guarantor) */}
              {requiresGuarantor && (
                <div className="space-y-4 pt-4 border-t border-ink-100 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> Guarantor Details
                    </h3>
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                      Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Input
                      label="Guarantor Full Name *"
                      placeholder="e.g. Chief John Doe"
                      value={formData.guarantorName}
                      error={errors.guarantorName}
                      touched={touched.guarantorName}
                      onChange={(e) => handleInputChange("guarantorName", e.target.value)}
                      onBlur={() => handleBlur("guarantorName")}
                    />
                    <Input
                      label="Guarantor Phone Number *"
                      placeholder="e.g. +234 801 234 5678"
                      value={formData.guarantorPhone}
                      error={errors.guarantorPhone}
                      touched={touched.guarantorPhone}
                      onChange={(e) => handleInputChange("guarantorPhone", e.target.value)}
                      onBlur={() => handleBlur("guarantorPhone")}
                    />
                    <Input
                      label="Guarantor Email Address (Optional)"
                      type="email"
                      placeholder="e.g. guarantor@example.com (Optional)"
                      value={formData.guarantorEmail}
                      error={errors.guarantorEmail}
                      touched={touched.guarantorEmail}
                      onChange={(e) => handleInputChange("guarantorEmail", e.target.value)}
                      onBlur={() => handleBlur("guarantorEmail")}
                    />
                    <div className="space-y-1">
                      <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
                        Relationship to Tenant *
                      </label>
                      <select
                        value={formData.guarantorRelationship}
                        onChange={(e) => handleInputChange("guarantorRelationship", e.target.value)}
                        onBlur={() => handleBlur("guarantorRelationship")}
                        className="w-full h-[42px] rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-[#07130D] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 transition-colors"
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
              )}

              {/* Section 4: Message to Landlord */}
              <div className="space-y-2 pt-4 border-t border-ink-100 dark:border-white/10">
                <Input
                  label="Message to Landlord (Optional)"
                  multiline
                  rows={3}
                  placeholder="Introduce yourself, mention your intended move-in date, or add any notes for the landlord..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                />
              </div>

              {/* Section 5: Landlord House Rules Checklist */}
              {propertyRulesList.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> Confirm Landlord House Rules Compliance
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-cream-100/70">
                    Tick to confirm you agree to abide by each rule for this property:
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
                disabled={loading || submitting || !meetsIncome || (hasMultipleUnits && !formData.unitName) || (propertyRulesList.length > 0 && agreedRules.length < propertyRulesList.length)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : !meetsIncome ? (
                  "Blocked: Income Below Requirement"
                ) : hasMultipleUnits && !formData.unitName ? (
                  "Please Select a Unit Above"
                ) : (
                  "Submit Rental Application"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


