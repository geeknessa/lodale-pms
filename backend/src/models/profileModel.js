import { pool } from '../config/db.js';

export const ProfileModel = {
  // ──────────────────────────────────────────
  // LANDLORD PROFILE
  // ──────────────────────────────────────────

  async getLandlordProfile(userId) {
    const res = await pool.query(
      'SELECT * FROM landlord_profiles WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  },

  async upsertLandlordProfile(userId, data) {
    const {
      business_name, business_type, tax_id,
      bank_name, bank_account_number, bank_account_name,
      total_properties_managed, years_in_business,
      professional_license, website_url, bio
    } = data;

    const res = await pool.query(`
      INSERT INTO landlord_profiles (
        user_id, business_name, business_type, tax_id,
        bank_name, bank_account_number, bank_account_name,
        total_properties_managed, years_in_business,
        professional_license, website_url, bio, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        business_name         = COALESCE(EXCLUDED.business_name, landlord_profiles.business_name),
        business_type         = COALESCE(EXCLUDED.business_type, landlord_profiles.business_type),
        tax_id                = COALESCE(EXCLUDED.tax_id, landlord_profiles.tax_id),
        bank_name             = COALESCE(EXCLUDED.bank_name, landlord_profiles.bank_name),
        bank_account_number   = COALESCE(EXCLUDED.bank_account_number, landlord_profiles.bank_account_number),
        bank_account_name     = COALESCE(EXCLUDED.bank_account_name, landlord_profiles.bank_account_name),
        total_properties_managed = COALESCE(EXCLUDED.total_properties_managed, landlord_profiles.total_properties_managed),
        years_in_business     = COALESCE(EXCLUDED.years_in_business, landlord_profiles.years_in_business),
        professional_license  = COALESCE(EXCLUDED.professional_license, landlord_profiles.professional_license),
        website_url           = COALESCE(EXCLUDED.website_url, landlord_profiles.website_url),
        bio                   = COALESCE(EXCLUDED.bio, landlord_profiles.bio),
        updated_at            = NOW()
      RETURNING *
    `, [
      userId, business_name, business_type, tax_id,
      bank_name, bank_account_number, bank_account_name,
      total_properties_managed ?? null, years_in_business ?? null,
      professional_license, website_url, bio
    ]);
    return res.rows[0];
  },

  /** Called automatically when a landlord registers */
  async createEmptyLandlordProfile(userId) {
    await pool.query(`
      INSERT INTO landlord_profiles (user_id) VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId]);
  },

  // ──────────────────────────────────────────
  // TENANT PROFILE
  // ──────────────────────────────────────────

  async getTenantProfile(userId) {
    const res = await pool.query(
      'SELECT * FROM tenant_profiles WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  },

  async upsertTenantProfile(userId, data) {
    const {
      date_of_birth, nationality, occupation,
      employer_name, employment_status, monthly_income,
      marital_status, number_of_dependants,
      guarantor_name, guarantor_phone, guarantor_email, guarantor_relationship,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      preferred_move_in_date, max_budget, bio
    } = data;

    const res = await pool.query(`
      INSERT INTO tenant_profiles (
        user_id, date_of_birth, nationality, occupation,
        employer_name, employment_status, monthly_income,
        marital_status, number_of_dependants,
        guarantor_name, guarantor_phone, guarantor_email, guarantor_relationship,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        preferred_move_in_date, max_budget, bio, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        date_of_birth                  = COALESCE(EXCLUDED.date_of_birth, tenant_profiles.date_of_birth),
        nationality                    = COALESCE(EXCLUDED.nationality, tenant_profiles.nationality),
        occupation                     = COALESCE(EXCLUDED.occupation, tenant_profiles.occupation),
        employer_name                  = COALESCE(EXCLUDED.employer_name, tenant_profiles.employer_name),
        employment_status              = COALESCE(EXCLUDED.employment_status, tenant_profiles.employment_status),
        monthly_income                 = COALESCE(EXCLUDED.monthly_income, tenant_profiles.monthly_income),
        marital_status                 = COALESCE(EXCLUDED.marital_status, tenant_profiles.marital_status),
        number_of_dependants           = COALESCE(EXCLUDED.number_of_dependants, tenant_profiles.number_of_dependants),
        guarantor_name                 = COALESCE(EXCLUDED.guarantor_name, tenant_profiles.guarantor_name),
        guarantor_phone                = COALESCE(EXCLUDED.guarantor_phone, tenant_profiles.guarantor_phone),
        guarantor_email                = COALESCE(EXCLUDED.guarantor_email, tenant_profiles.guarantor_email),
        guarantor_relationship         = COALESCE(EXCLUDED.guarantor_relationship, tenant_profiles.guarantor_relationship),
        emergency_contact_name         = COALESCE(EXCLUDED.emergency_contact_name, tenant_profiles.emergency_contact_name),
        emergency_contact_phone        = COALESCE(EXCLUDED.emergency_contact_phone, tenant_profiles.emergency_contact_phone),
        emergency_contact_relationship = COALESCE(EXCLUDED.emergency_contact_relationship, tenant_profiles.emergency_contact_relationship),
        preferred_move_in_date         = COALESCE(EXCLUDED.preferred_move_in_date, tenant_profiles.preferred_move_in_date),
        max_budget                     = COALESCE(EXCLUDED.max_budget, tenant_profiles.max_budget),
        bio                            = COALESCE(EXCLUDED.bio, tenant_profiles.bio),
        updated_at                     = NOW()
      RETURNING *
    `, [
      userId, date_of_birth ?? null, nationality, occupation,
      employer_name, employment_status, monthly_income ?? null,
      marital_status, number_of_dependants ?? null,
      guarantor_name, guarantor_phone, guarantor_email, guarantor_relationship,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      preferred_move_in_date ?? null, max_budget ?? null, bio
    ]);
    return res.rows[0];
  },

  /** Called automatically when a tenant registers */
  async createEmptyTenantProfile(userId) {
    await pool.query(`
      INSERT INTO tenant_profiles (user_id) VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId]);
  }
};
