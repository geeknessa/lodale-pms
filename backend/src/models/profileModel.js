import { pool } from '../db/db.js';

const parseSafeDate = (val) => {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const trimmed = val.trim();
  if (trimmed.toLowerCase() === 'dd-mm-yyyy' || trimmed.toLowerCase() === 'yyyy-mm-dd') return null;
  
  // DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const yyyymmdd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
};

const parseSafeNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const toNullableStr = (val) => (!val || (typeof val === 'string' && val.trim() === '') ? null : val);
const toNullableDate = (val) => parseSafeDate(val);
const toNullableInt = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};
const toNullableNum = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const clean = String(val).replace(/[^0-9.]/g, '');
  return clean === '' ? null : clean;
};

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

    const numProperties = parseSafeNumber(total_properties_managed);
    const numYears = parseSafeNumber(years_in_business);

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
      userId,
      toNullableStr(business_name),
      toNullableStr(business_type),
      toNullableStr(tax_id),
      toNullableStr(bank_name),
      toNullableStr(bank_account_number),
      toNullableStr(bank_account_name),
      toNullableInt(total_properties_managed),
      toNullableInt(years_in_business),
      toNullableStr(professional_license),
      toNullableStr(website_url),
      toNullableStr(bio)
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
      preferred_move_in_date, max_budget, gender, address, location, postal_code, bio
    } = data;

    const safeDob = parseSafeDate(date_of_birth);
    const safeMoveIn = parseSafeDate(preferred_move_in_date);
    const safeDependants = parseSafeNumber(number_of_dependants);
    const safeBudget = parseSafeNumber(max_budget);

    const res = await pool.query(`
      INSERT INTO tenant_profiles (
        user_id, date_of_birth, nationality, occupation,
        employer_name, employment_status, monthly_income,
        marital_status, number_of_dependants,
        guarantor_name, guarantor_phone, guarantor_email, guarantor_relationship,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        preferred_move_in_date, max_budget, gender, address, location, postal_code, bio, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23, NOW())
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
        gender                         = COALESCE(EXCLUDED.gender, tenant_profiles.gender),
        address                        = COALESCE(EXCLUDED.address, tenant_profiles.address),
        location                       = COALESCE(EXCLUDED.location, tenant_profiles.location),
        postal_code                    = COALESCE(EXCLUDED.postal_code, tenant_profiles.postal_code),
        bio                            = COALESCE(EXCLUDED.bio, tenant_profiles.bio),
        updated_at                     = NOW()
      RETURNING *
    `, [
      userId,
      safeDob,
      toNullableStr(nationality),
      toNullableStr(occupation),
      toNullableStr(employer_name),
      toNullableStr(employment_status),
      monthly_income ? String(monthly_income) : null,
      toNullableStr(marital_status),
      safeDependants,
      toNullableStr(guarantor_name),
      toNullableStr(guarantor_phone),
      toNullableStr(guarantor_email),
      toNullableStr(guarantor_relationship),
      toNullableStr(emergency_contact_name),
      toNullableStr(emergency_contact_phone),
      toNullableStr(emergency_contact_relationship),
      safeMoveIn,
      safeBudget,
      toNullableStr(gender),
      toNullableStr(address),
      toNullableStr(location),
      toNullableStr(postal_code),
      toNullableStr(bio)
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
