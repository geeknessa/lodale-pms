import { useState, useEffect } from 'react';
import { doesIncomeMeetRequirement } from '../utils/incomeRanges';
import { profileService } from '../services/profileService';

export function useTenantQualification(property, overrideProfile = null) {
  const [tenantProfile, setTenantProfile] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!property) return;
      setLoading(true);
      try {
        const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
        const rawTenantProf = sessionStorage.getItem("tenantCurrentProfile") || 
                              sessionStorage.getItem("currentUserProfile") || 
                              (userEmail ? localStorage.getItem("tenantProfile_" + userEmail) : null);
        let mergedProf = {};
        if (rawTenantProf) {
          try { mergedProf = JSON.parse(rawTenantProf); } catch (e) {}
        }

        const auth = sessionStorage.getItem("isAuthenticated") === "true";
        if (auth) {
          const prof = await profileService.getMyProfile();
          if (prof) {
            mergedProf = { ...mergedProf, ...prof };
          }
        }
        setTenantProfile(mergedProf);
      } catch (err) {
        console.warn("Failed to load tenant profile for qualification:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [property]);

  if (!property) {
    return { loading: true, meetsAll: false };
  }

  const profileToUse = overrideProfile || tenantProfile;

  // 1. Income Qualification
  const requiredIncome = property.minimum_income_required || property.minimumIncome || "No Minimum Income";
  const tenantIncome = profileToUse.income || profileToUse.incomeRange || profileToUse.monthlyIncome || profileToUse.annualIncome || profileToUse.monthly_income || "";
  const meetsIncome = doesIncomeMeetRequirement(tenantIncome, requiredIncome);

  // 2. Guarantor Qualification
  const reqGuarantor = property.requires_guarantor ?? property.requiresGuarantor ?? true;
  const hasGuarantor = Boolean(profileToUse.guarantorName || profileToUse.guarantor_name);
  const meetsGuarantor = !reqGuarantor || hasGuarantor;

  // 3. Employment Qualification
  const employmentReq = property.employment_requirement || property.employmentRequirement || "Any Employment";
  const tenantEmp = profileToUse.employmentStatus || profileToUse.employment_status || "";
  const meetsEmployment = employmentReq === "Any Employment" || tenantEmp.includes("Employed");

  return {
    loading,
    tenantProfile,
    meetsIncome,
    meetsGuarantor,
    meetsEmployment,
    meetsAll: meetsIncome && meetsGuarantor && meetsEmployment,
    requirements: {
      income: requiredIncome,
      guarantor: reqGuarantor,
      employment: employmentReq
    },
    tenantStats: {
      income: tenantIncome || "Not Provided",
      hasGuarantor,
      employment: tenantEmp || "Not Provided"
    }
  };
}
