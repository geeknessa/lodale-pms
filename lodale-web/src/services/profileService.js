const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const profileService = {
  /**
   * Get authenticated user's role-specific profile (landlord_profiles or tenant_profiles)
   */
  async getMyProfile() {
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.statusText}`);
      }
      const data = await res.json();
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
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update profile');
    }
    const data = await res.json();
    return data.profile;
  }
};
