import { apiClient } from '../lib/apiClient';

/**
 * Property Service for local Express REST API
 */
export const propertyService = {
  /**
   * Get public active property listings
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
      console.warn('[PropertyService] Failed to fetch properties:', error.message);
      return [];
    }
  },

  /**
   * Get properties owned by a specific landlord (including pending/draft/info_requested)
   */
  async getLandlordProperties(landlordId) {
    try {
      if (!landlordId) return [];
      return await apiClient(`/properties/landlord/${landlordId}`);
    } catch (error) {
      console.warn('[PropertyService] Failed to fetch landlord properties:', error.message);
      return [];
    }
  },

  /**
   * Get single property detail by ID
   */
  async getPropertyById(id) {
    try {
      return await apiClient(`/properties/${id}`);
    } catch {
      return null;
    }
  },

  /**
   * Create a new property listing (defaults to status = 'pending_review')
   */
  async createProperty(propertyData) {
    return await apiClient('/properties', {
      method: 'POST',
      body: propertyData,
    });
  },

  /**
   * Update a property listing
   */
  async updateProperty(id, propertyData) {
    return await apiClient(`/properties/${id}`, {
      method: 'PUT',
      body: propertyData,
    });
  },

  /**
   * Delete a property listing
   */
  async deleteProperty(id) {
    return await apiClient(`/properties/${id}`, {
      method: 'DELETE',
    });
  },
};
