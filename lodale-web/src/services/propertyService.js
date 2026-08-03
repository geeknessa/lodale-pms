import { apiClient } from '../lib/apiClient';
import { listings as mockListings } from '../data/listings';

/**
 * Property Service for local Express REST API with graceful mock fallback
 */
export const propertyService = {
  /**
   * Get property listings
   */
  async getProperties(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.search) params.append('search', filters.search);
      if (filters.propertyType) params.append('propertyType', filters.propertyType);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      return await apiClient(`/properties${queryString}`);
    } catch (error) {
      console.warn('[PropertyService] Express server unreachable. Using local mock listings fallback:', error.message);
      let filtered = [...mockListings];
      if (filters.city) {
        filtered = filtered.filter(p => p.location?.toLowerCase().includes(filters.city.toLowerCase()));
      }
      return filtered;
    }
  },

  /**
   * Get single property detail by ID
   */
  async getPropertyById(id) {
    try {
      return await apiClient(`/properties/${id}`);
    } catch {
      return mockListings.find(p => String(p.id) === String(id)) || null;
    }
  },

  /**
   * Create a new property
   */
  async createProperty(propertyData) {
    return await apiClient('/properties', {
      method: 'POST',
      body: propertyData,
    });
  },
};
