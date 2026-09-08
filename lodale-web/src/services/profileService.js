import { apiClient } from '../lib/apiClient';

/**
 * Profile Service for role-specific profile details (tenant_profiles / landlord_profiles)
 */
export const profileService = {
  /**
   * Get authenticated user's role-specific profile (landlord_profiles or tenant_profiles)
   */
  async getMyProfile() {
    try {
      const data = await apiClient('/profile');
      return data.profile || {};
    } catch (err) {
      console.warn('[profileService.getMyProfile error]:', err.message);
      return {};
    }
  },

  /**
   * Update/Upsert authenticated user's role-specific profile
   */
  async updateMyProfile(profileData) {
    try {
      const data = await apiClient('/profile', {
        method: 'PUT',
        body: profileData
      });
      return data.profile;
    } catch (err) {
      console.warn('[profileService.updateMyProfile error]:', err.message);
      throw err;
    }
  },

  checkProfileCompleteness(profile) {
    if (!profile) return { isComplete: false, percentage: 0, missingFields: ["Full Profile"] };
    const requiredKeys = [
      { key: 'firstName', label: 'First Name', alt: 'first_name' },
      { key: 'lastName', label: 'Last Name', alt: 'last_name' },
      { key: 'email', label: 'Email Address' },
      { key: 'phone', label: 'Phone Number', alt: 'phone_number' },
      { key: 'address', label: 'Residential Address' },
      { key: 'occupation', label: 'Occupation' }
    ];

    const missingFields = [];
    let filledCount = 0;

    requiredKeys.forEach(item => {
      const val = profile[item.key] || (item.alt ? profile[item.alt] : null);
      if (val && String(val).trim().length > 0) {
        filledCount++;
      } else {
        missingFields.push(item.label);
      }
    });

    const percentage = Math.round((filledCount / requiredKeys.length) * 100);
    return {
      isComplete: missingFields.length === 0,
      percentage,
      missingFields
    };
  }
};
