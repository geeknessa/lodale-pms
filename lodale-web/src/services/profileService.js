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
  }
};
