import { apiClient } from '../lib/apiClient';

/**
 * Property Service for local Express REST API
 */
export const propertyService = {
  /**
   * Get public active property listings
   */
  async getProperties(filters = {}) {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.search) params.append('search', filters.search);
    if (filters.propertyType) params.append('propertyType', filters.propertyType);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await apiClient(`/properties${queryString}`);
  },

  /**
   * Get properties owned by a specific landlord (including pending/draft/info_requested)
   */
  async getLandlordProperties(landlordId) {
    if (!landlordId) return [];
    return await apiClient(`/properties/landlord/${landlordId}`);
  },

  /**
   * Get single property detail by ID
   */
  async getPropertyById(id) {
    return await apiClient(`/properties/${id}`);
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

  /**
   * Update a property's status
   */
  async updatePropertyStatus(id, status) {
    return await apiClient(`/properties/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  /**
   * Request deletion of a property
   */
  async requestPropertyDeletion(id, reason) {
    return await apiClient(`/properties/${id}/request-deletion`, {
      method: 'POST',
      body: { reason },
    });
  },

  /**
   * Request suspension of a property
   */
  async requestPropertySuspension(id, reason) {
    return await apiClient(`/properties/${id}/request-suspension`, {
      method: 'POST',
      body: { reason },
    });
  },

  /**
   * Get saved properties for the logged-in user
   */
  async getSavedProperties() {
    try {
      return await apiClient('/properties/saved');
    } catch {
      return [];
    }
  },

  /**
   * Save a property for the user
   */
  async saveProperty(id) {
    return await apiClient(`/properties/${id}/save`, {
      method: 'POST',
    });
  },

  /**
   * Unsave a property for the user
   */
  async unsaveProperty(id) {
    return await apiClient(`/properties/${id}/save`, {
      method: 'DELETE',
    });
  },
};
