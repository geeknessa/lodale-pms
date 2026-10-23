import { pool } from '../db/db.js';
import { 
  APPLICATION_STATUS, 
  ALLOWED_APPLICATION_TRANSITIONS, 
  INSPECTION_STATUS 
} from '../utils/statusConstants.js';

/**
 * Fetch fresh, comprehensive application detail with nested invoice, lease, and inspections.
 */
export const fetchApplicationDetail = async (db, applicationId) => {
  const { rows } = await db.query(
    `SELECT 
       a.id, 
       a.status, 
       a.notes, 
       a.rejection_reason,
       a.rejection_reason as "rejectionReason",
       a.landlord_reviewed_at as "landlordReviewedAt",
       a.approved_at as "approvedAt",
       a.declined_at as "declinedAt",
       a.created_at as "createdAt",
       a.updated_at as "updatedAt",
       a.property_id as "propertyId",
       a.tenant_id as "tenantId",
       p.title as "propertyTitle",
       p.address_line1 as "propertyAddress",
       p.city as "propertyCity",
       p.state as "propertyState",
       p.rent_amount as "propertyRentAmount",
       p.rent_period as "propertyRentPeriod",
       p.cover_image as "propertyCoverImage",
       p.landlord_id as "landlordId",
       COALESCE(p.minimum_income_required::text, '0') as "minimumIncomeRequired",
       COALESCE(p.requires_guarantor, false) as "requiresGuarantor",
       lu.first_name as "landlordFirstName",
       lu.last_name as "landlordLastName",
       lu.email as "landlordEmail",
       lu.phone_number as "landlordPhone",
       lu.avatar_url as "landlordAvatar",
       tu.first_name as "tenantFirstName",
       tu.last_name as "tenantLastName",
       tu.email as "tenantEmail",
       tu.phone_number as "tenantPhone",
       tu.avatar_url as "tenantAvatar",
       tp.occupation,
       tp.employer_name as "employerName",
       tp.employment_status as "employmentStatus",
       tp.monthly_income as "monthlyIncome",
       tp.marital_status as "maritalStatus",
       tp.number_of_dependants as "numberOfDependants",
       tp.guarantor_name as "guarantorName",
       tp.guarantor_phone as "guarantorPhone",
       tp.guarantor_relationship as "guarantorRelationship",
       tp.guarantor_email as "guarantorEmail",
       tp.address as "tenantAddress",
       tp.location as "tenantLocation",
       tp.postal_code as "tenantPostalCode",
       tp.gender as "tenantGender",
       tp.date_of_birth as "tenantDateOfBirth",
       tp.emergency_contact_name as "emergencyContactName",
       tp.emergency_contact_phone as "emergencyContactPhone",
       tp.emergency_contact_relationship as "emergencyContactRelationship"
     FROM property_applications a
     JOIN properties p ON a.property_id = p.id
     JOIN users lu ON p.landlord_id = lu.id
     JOIN users tu ON a.tenant_id = tu.id
     LEFT JOIN tenant_profiles tp ON tu.id = tp.user_id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (rows.length === 0) return null;
  const raw = rows[0];

  // Fetch latest invoice attached to this application
  const invRes = await db.query(
    `SELECT id, invoice_number, amount, subtotal, lodale_fee, grand_total, status, due_date, issue_date,
            bank_name, bank_account_number, bank_account_name, items, payment_reference, payment_proof_url, paid_at
     FROM rent_invoices
     WHERE application_id = $1 OR id = (SELECT invoice_id FROM property_applications WHERE id = $1)
     ORDER BY created_at DESC LIMIT 1`,
    [applicationId]
  );
  const invoice = invRes.rows[0] ? {
    id: invRes.rows[0].id,
    invoiceNumber: invRes.rows[0].invoice_number,
    amount: parseFloat(invRes.rows[0].amount) || 0,
    subtotal: parseFloat(invRes.rows[0].subtotal) || 0,
    lodaleFee: parseFloat(invRes.rows[0].lodale_fee) || 0,
    grandTotal: parseFloat(invRes.rows[0].grand_total || invRes.rows[0].amount) || 0,
    status: invRes.rows[0].status,
    dueDate: invRes.rows[0].due_date,
    issueDate: invRes.rows[0].issue_date,
    bankName: invRes.rows[0].bank_name,
    bankAccountNumber: invRes.rows[0].bank_account_number,
    bankAccountName: invRes.rows[0].bank_account_name,
    items: invRes.rows[0].items,
    paymentReference: invRes.rows[0].payment_reference,
    paymentProofUrl: invRes.rows[0].payment_proof_url,
    paidAt: invRes.rows[0].paid_at
  } : null;

  // Fetch latest lease attached to this application
  const leaseRes = await db.query(
    `SELECT id, start_date, end_date, rent_amount, rent_period, security_deposit, status,
            tenant_signed_at, landlord_signed_at, move_in_completed_at, move_in_checklist
     FROM leases
     WHERE application_id = $1 OR id = (SELECT lease_id FROM property_applications WHERE id = $1)
     ORDER BY created_at DESC LIMIT 1`,
    [applicationId]
  );
  const lease = leaseRes.rows[0] ? {
    id: leaseRes.rows[0].id,
    startDate: leaseRes.rows[0].start_date,
    endDate: leaseRes.rows[0].end_date,
    rentAmount: parseFloat(leaseRes.rows[0].rent_amount) || 0,
    rentPeriod: leaseRes.rows[0].rent_period,
    securityDeposit: parseFloat(leaseRes.rows[0].security_deposit) || 0,
    status: leaseRes.rows[0].status,
    tenantSignedAt: leaseRes.rows[0].tenant_signed_at,
    landlordSignedAt: leaseRes.rows[0].landlord_signed_at,
    moveInCompletedAt: leaseRes.rows[0].move_in_completed_at,
    moveInChecklist: leaseRes.rows[0].move_in_checklist
  } : null;

  // Fetch inspections attached to this application
  const inspRes = await db.query(
    `SELECT id, application_id as "applicationId", property_id as "propertyId",
            landlord_id as "landlordId", tenant_id as "tenantId",
            status, scheduled_date as "scheduledDate", scheduled_time as "scheduledTime",
            date, time, location, notes, outcome_notes as "outcomeNotes",
            completed_at as "completedAt", created_at as "createdAt"
     FROM property_inspections
     WHERE application_id = $1
     ORDER BY COALESCE(scheduled_date, date) DESC, created_at DESC`,
    [applicationId]
  );
  const inspections = inspRes.rows.map(i => ({
    ...i,
    date: i.scheduledDate || i.date,
    time: i.scheduledTime || i.time
  }));
  const inspection = inspections.length > 0 ? inspections[0] : null;

  return {
    id: raw.id,
    propertyId: raw.propertyId,
    propertyTitle: raw.propertyTitle,
    propertyAddress: raw.propertyAddress,
    propertyCity: raw.propertyCity,
    propertyState: raw.propertyState,
    propertyRentAmount: parseFloat(raw.propertyRentAmount) || 0,
    propertyRentPeriod: raw.propertyRentPeriod,
    propertyCoverImage: raw.propertyCoverImage,
    landlordId: raw.landlordId,
    tenantId: raw.tenantId,
    status: raw.status,
    notes: raw.notes,
    rejectionReason: raw.rejectionReason,
    landlordReviewedAt: raw.landlordReviewedAt,
    approvedAt: raw.approvedAt,
    declinedAt: raw.declinedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    date: new Date(raw.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
    landlord: {
      id: raw.landlordId,
      name: `${raw.landlordFirstName || ''} ${raw.landlordLastName || ''}`.trim() || 'Landlord',
      firstName: raw.landlordFirstName,
      lastName: raw.landlordLastName,
      email: raw.landlordEmail,
      phone: raw.landlordPhone,
      avatar: raw.landlordAvatar
    },
    tenantAddress: raw.tenantAddress || '',
    tenantLocation: raw.tenantLocation || '',
    tenant: {
      id: raw.tenantId,
      name: `${raw.tenantFirstName || ''} ${raw.tenantLastName || ''}`.trim() || 'Tenant',
      firstName: raw.tenantFirstName || '',
      lastName: raw.tenantLastName || '',
      first_name: raw.tenantFirstName || '',
      last_name: raw.tenantLastName || '',
      email: raw.tenantEmail || '',
      phone: raw.tenantPhone || '',
      phoneNumber: raw.tenantPhone || '',
      phone_number: raw.tenantPhone || '',
      avatar: raw.tenantAvatar || '',
      avatarUrl: raw.tenantAvatar || '',
      avatar_url: raw.tenantAvatar || '',
      occupation: raw.occupation || '',
      employerName: raw.employerName || '',
      employer_name: raw.employerName || '',
      employmentStatus: raw.employmentStatus || '',
      employment_status: raw.employmentStatus || '',
      monthlyIncome: raw.monthlyIncome || '',
      monthly_income: raw.monthlyIncome || '',
      maritalStatus: raw.maritalStatus || '',
      marital_status: raw.maritalStatus || '',
      dependants: raw.numberOfDependants ?? null,
      number_of_dependants: raw.numberOfDependants ?? null,
      numberOfDependants: raw.numberOfDependants ?? null,
      guarantorName: raw.guarantorName || '',
      guarantor_name: raw.guarantorName || '',
      guarantorPhone: raw.guarantorPhone || '',
      guarantor_phone: raw.guarantorPhone || '',
      guarantorRelationship: raw.guarantorRelationship || '',
      guarantor_relationship: raw.guarantorRelationship || '',
      guarantorEmail: raw.guarantorEmail || '',
      guarantor_email: raw.guarantorEmail || '',
      address: raw.tenantAddress || '',
      currentAddress: raw.tenantAddress || '',
      tenantAddress: raw.tenantAddress || '',
      tenant_address: raw.tenantAddress || '',
      location: raw.tenantLocation || '',
      tenantLocation: raw.tenantLocation || '',
      tenant_location: raw.tenantLocation || '',
      postalCode: raw.tenantPostalCode || '',
      postal_code: raw.tenantPostalCode || '',
      gender: raw.tenantGender || '',
      dateOfBirth: raw.tenantDateOfBirth || '',
      date_of_birth: raw.tenantDateOfBirth || '',
      emergencyContactName: raw.emergencyContactName || '',
      emergency_contact_name: raw.emergencyContactName || '',
      emergencyContactPhone: raw.emergencyContactPhone || '',
      emergency_contact_phone: raw.emergencyContactPhone || '',
      emergencyContactRelationship: raw.emergencyContactRelationship || '',
      emergency_contact_relationship: raw.emergencyContactRelationship || ''
    },
    propertyRequirements: {
      minimumIncome: parseFloat(raw.minimumIncomeRequired) || 0,
      requiresGuarantor: Boolean(raw.requiresGuarantor)
    },
    invoice,
    lease,
    inspection,
    inspections
  };
};

// @desc    Apply for a property
// @route   POST /api/applications
// @access  Private (Tenant)
export const applyForProperty = async (req, res) => {
  const { 
    propertyId, 
    notes,
    monthlyIncome,
    employmentStatus,
    employerName,
    occupation,
    maritalStatus,
    dependants,
    guarantorName,
    guarantorPhone,
    guarantorRelationship,
    guarantorEmail,
    address,
    currentAddress,
    location,
    gender,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship
  } = req.body;
  const tenantId = req.user.id;

  if (!propertyId) {
    return res.status(400).json({ success: false, message: 'Property ID is required' });
  }

  try {
    // 1. Upsert Tenant Profile details if provided
    const safeIncome = (monthlyIncome !== undefined && monthlyIncome !== null && String(monthlyIncome).trim() !== "") ? String(monthlyIncome).trim() : null;
    const safeDependants = (dependants !== undefined && dependants !== null && String(dependants).trim() !== "") 
      ? Number(dependants) 
      : (Array.isArray(req.body.occupants) && req.body.occupants.length > 0 ? req.body.occupants.length : null);
    const safeAddress = (address || currentAddress || req.body.tenantAddress || req.body.tenant_address || "").trim() || null;
    const safeLocation = (location || req.body.tenantLocation || req.body.tenant_location || "").trim() || null;
    const safeGender = (gender || "").trim() || null;
    const safeEmergencyName = (emergencyContactName || req.body.emergency_contact_name || "").trim() || null;
    const safeEmergencyPhone = (emergencyContactPhone || req.body.emergency_contact_phone || "").trim() || null;
    const safeEmergencyRel = (emergencyContactRelationship || req.body.emergency_contact_relationship || "").trim() || null;

    await pool.query(
      `INSERT INTO tenant_profiles (
         user_id, monthly_income, employment_status, employer_name, occupation,
         marital_status, number_of_dependants, guarantor_name, guarantor_phone,
         guarantor_relationship, guarantor_email, address, location, gender,
         emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         monthly_income = COALESCE(EXCLUDED.monthly_income, tenant_profiles.monthly_income),
         employment_status = COALESCE(EXCLUDED.employment_status, tenant_profiles.employment_status),
         employer_name = COALESCE(EXCLUDED.employer_name, tenant_profiles.employer_name),
         occupation = COALESCE(EXCLUDED.occupation, tenant_profiles.occupation),
         marital_status = COALESCE(EXCLUDED.marital_status, tenant_profiles.marital_status),
         number_of_dependants = COALESCE(EXCLUDED.number_of_dependants, tenant_profiles.number_of_dependants),
         guarantor_name = COALESCE(EXCLUDED.guarantor_name, tenant_profiles.guarantor_name),
         guarantor_phone = COALESCE(EXCLUDED.guarantor_phone, tenant_profiles.guarantor_phone),
         guarantor_relationship = COALESCE(EXCLUDED.guarantor_relationship, tenant_profiles.guarantor_relationship),
         guarantor_email = COALESCE(EXCLUDED.guarantor_email, tenant_profiles.guarantor_email),
         address = COALESCE(EXCLUDED.address, tenant_profiles.address),
         location = COALESCE(EXCLUDED.location, tenant_profiles.location),
         gender = COALESCE(EXCLUDED.gender, tenant_profiles.gender),
         emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, tenant_profiles.emergency_contact_name),
         emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, tenant_profiles.emergency_contact_phone),
         emergency_contact_relationship = COALESCE(EXCLUDED.emergency_contact_relationship, tenant_profiles.emergency_contact_relationship),
         updated_at = NOW()`,
      [
        tenantId,
        safeIncome,
        employmentStatus || null,
        employerName || null,
        occupation || null,
        maritalStatus || null,
        safeDependants,
        guarantorName || null,
        guarantorPhone || null,
        guarantorRelationship || null,
        guarantorEmail || null,
        safeAddress,
        safeLocation,
        safeGender,
        safeEmergencyName,
        safeEmergencyPhone,
        safeEmergencyRel
      ]
    );

    // 2. Insert application record with status 'submitted'
    const newApp = await pool.query(
      `INSERT INTO property_applications (property_id, tenant_id, notes, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [propertyId, tenantId, notes || null, APPLICATION_STATUS.SUBMITTED]
    );

    const createdAppId = newApp.rows[0].id;

    // 3. Create notification for the landlord
    try {
      const propRes = await pool.query(
        `SELECT title, landlord_id FROM properties WHERE id = $1`,
        [propertyId]
      );
      if (propRes.rows.length > 0) {
        const property = propRes.rows[0];
        const landlordId = property.landlord_id;

        if (landlordId) {
          const tenantRes = await pool.query(
            `SELECT first_name, last_name, email FROM users WHERE id = $1`,
            [tenantId]
          );
          const tenantUser = tenantRes.rows[0];
          const tenantName = tenantUser
            ? `${tenantUser.first_name || ''} ${tenantUser.last_name || ''}`.trim() || tenantUser.email
            : 'A prospective tenant';

          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              landlordId,
              'New Rental Application Received',
              `${tenantName} submitted an application for "${property.title}".`,
              'application',
              'application',
              createdAppId
            ]
          );
        }
      }
    } catch (notifErr) {
      console.error('Failed to create landlord application notification:', notifErr);
    }

    const detail = await fetchApplicationDetail(pool, createdAppId);
    res.status(201).json({ success: true, application: detail || newApp.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'You have already applied for this property.' });
    }
    console.error('Apply for property error:', error);
    res.status(500).json({ success: false, message: 'Server error creating application' });
  }
};

// @desc    Get current tenant's applications
// @route   GET /api/applications/me
// @access  Private (Tenant)
export const getMyApplications = async (req, res) => {
  const tenantId = req.user.id;

  try {
    const apps = await pool.query(
      `SELECT 
         a.id, 
         a.tenant_id as "tenantId",
         a.status, 
         a.notes, 
         a.rejection_reason as "rejectionReason",
         a.landlord_reviewed_at as "landlordReviewedAt",
         a.approved_at as "approvedAt",
         a.declined_at as "declinedAt",
         a.created_at as "createdAt",
         a.updated_at as "updatedAt",
         a.property_id as "propertyId",
         p.title as "propertyTitle",
         p.address_line1 as "propertyAddress",
         p.city as "propertyCity",
         p.state as "propertyState",
         p.rent_amount as "propertyRentAmount",
         p.rent_period as "propertyRentPeriod",
         p.cover_image as "propertyCoverImage",
         p.landlord_id as "landlordId",
         u.first_name as "landlordFirstName",
         u.last_name as "landlordLastName",
         u.email as "landlordEmail",
         u.avatar_url as "landlordAvatar",
         al.lease_id as "leaseId",
         al.lease_status as "leaseStatus",
         al.tenant_signed_at as "leaseTenantSignedAt",
         al.landlord_signed_at as "leaseLandlordSignedAt",
         al.move_in_checklist as "moveInChecklist",
         ai.invoice_id as "invoiceId",
         ai.invoice_number as "invoiceNumber",
         ai.invoice_amount as "invoiceAmount",
         ai.invoice_status as "invoiceStatus",
         insp.id as "inspectionId",
         insp.status as "inspectionStatus",
         insp.scheduled_date as "inspectionScheduledDate",
         insp.scheduled_time as "inspectionScheduledTime",
         insp.location as "inspectionLocation",
         insp.notes as "inspectionNotes",
         insp.outcome_notes as "inspectionOutcomeNotes",
         (
           SELECT message FROM chat_messages cm 
           WHERE (cm.sender_id = p.landlord_id AND cm.receiver_id = a.tenant_id)
              OR (cm.sender_id = a.tenant_id AND cm.receiver_id = p.landlord_id)
           ORDER BY cm.created_at DESC LIMIT 1
         ) as "lastMessage"
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users u ON p.landlord_id = u.id
       LEFT JOIN LATERAL (
         SELECT id as lease_id, status as lease_status, tenant_signed_at, landlord_signed_at, move_in_checklist
         FROM leases
         WHERE application_id = a.id OR id = a.lease_id
         ORDER BY created_at DESC
         LIMIT 1
       ) al ON true
       LEFT JOIN LATERAL (
         SELECT id as invoice_id, invoice_number, grand_total as invoice_amount, status as invoice_status
         FROM rent_invoices
         WHERE application_id = a.id OR id = a.invoice_id
         ORDER BY created_at DESC
         LIMIT 1
       ) ai ON true
       LEFT JOIN LATERAL (
         SELECT id, status, scheduled_date, scheduled_time, location, notes, outcome_notes
         FROM property_inspections
         WHERE application_id = a.id
         ORDER BY COALESCE(scheduled_date, date) DESC, created_at DESC
         LIMIT 1
       ) insp ON true
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC`,
      [tenantId]
    );
    
    const formattedApps = apps.rows.map(app => {
      const d = new Date(app.createdAt || app.date);
      const isToday = new Date().toDateString() === d.toDateString();
      return {
        ...app,
        date: isToday ? "Today" : d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        lease: app.leaseId ? {
          id: app.leaseId,
          status: app.leaseStatus,
          tenantSignedAt: app.leaseTenantSignedAt,
          landlordSignedAt: app.leaseLandlordSignedAt,
          moveInChecklist: app.moveInChecklist
        } : null,
        invoice: app.invoiceId ? {
          id: app.invoiceId,
          invoiceNumber: app.invoiceNumber,
          amount: parseFloat(app.invoiceAmount) || 0,
          grandTotal: parseFloat(app.invoiceAmount) || 0,
          status: app.invoiceStatus
        } : null,
        inspection: app.inspectionId ? {
          id: app.inspectionId,
          status: app.inspectionStatus,
          scheduledDate: app.inspectionScheduledDate,
          scheduledTime: app.inspectionScheduledTime,
          date: app.inspectionScheduledDate,
          time: app.inspectionScheduledTime,
          location: app.inspectionLocation,
          notes: app.inspectionNotes,
          outcomeNotes: app.inspectionOutcomeNotes
        } : null
      };
    });

    res.json({ success: true, applications: formattedApps });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
};

// @desc    Get all applications for a landlord's properties
// @route   GET /api/applications/landlord
// @access  Private (Landlord)
export const getLandlordApplications = async (req, res) => {
  const landlordId = req.user.id;

  try {
    const apps = await pool.query(
      `SELECT 
         a.id, 
         a.status, 
         a.notes, 
         a.rejection_reason,
         a.landlord_reviewed_at,
         a.approved_at,
         a.declined_at,
         a.created_at,
         a.updated_at,
         a.property_id,
         a.tenant_id,
         p.title as property_title,
         p.address_line1 as property_address,
         p.city as property_city,
         p.state as property_state,
         p.rent_amount as property_rent_amount,
         p.rent_period as property_rent_period,
         p.cover_image as property_cover_image,
         COALESCE(p.minimum_income_required::text, '0') as minimum_income_required,
         COALESCE(p.requires_guarantor, false) as requires_guarantor,
         u.first_name,
         u.last_name,
         u.email,
         u.phone_number,
         u.avatar_url,
         tp.occupation,
         tp.employer_name,
         tp.employment_status,
         tp.monthly_income,
         tp.marital_status,
         tp.number_of_dependants,
         tp.guarantor_name,
         tp.guarantor_phone,
         tp.guarantor_relationship,
         tp.guarantor_email,
         tp.address as tenant_address,
         tp.location as tenant_location,
         tp.postal_code as tenant_postal_code,
         tp.gender as tenant_gender,
         tp.date_of_birth as tenant_date_of_birth,
         tp.emergency_contact_name,
         tp.emergency_contact_phone,
         tp.emergency_contact_relationship,
         app_lease.lease_id,
         app_lease.lease_status,
         app_lease.lease_tenant_signed_at,
         app_lease.lease_landlord_signed_at,
         app_invoice.invoice_id,
         app_invoice.invoice_number,
         app_invoice.invoice_amount,
         app_invoice.invoice_status,
         insp.id as inspection_id,
         insp.status as inspection_status,
         insp.scheduled_date as inspection_scheduled_date,
         insp.scheduled_time as inspection_scheduled_time,
         insp.location as inspection_location,
         insp.notes as inspection_notes,
         insp.outcome_notes as inspection_outcome_notes
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users u ON a.tenant_id = u.id
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       LEFT JOIN LATERAL (
         SELECT id as lease_id, status as lease_status, tenant_signed_at as lease_tenant_signed_at, landlord_signed_at as lease_landlord_signed_at, move_in_checklist
         FROM leases
         WHERE application_id = a.id OR id = a.lease_id
         ORDER BY created_at DESC
         LIMIT 1
       ) app_lease ON true
       LEFT JOIN LATERAL (
         SELECT id as invoice_id, invoice_number, grand_total as invoice_amount, status as invoice_status
         FROM rent_invoices
         WHERE application_id = a.id OR id = a.invoice_id
         ORDER BY created_at DESC
         LIMIT 1
       ) app_invoice ON true
       LEFT JOIN LATERAL (
         SELECT id, status, scheduled_date, scheduled_time, location, notes, outcome_notes
         FROM property_inspections
         WHERE application_id = a.id
         ORDER BY COALESCE(scheduled_date, date) DESC, created_at DESC
         LIMIT 1
       ) insp ON true
       WHERE p.landlord_id = $1
       ORDER BY a.created_at DESC`,
      [landlordId]
    );
    
    const formattedApps = apps.rows.map((app) => {
      return {
        id: app.id,
        propertyId: app.property_id,
        propertyTitle: app.property_title,
        propertyAddress: app.property_address,
        propertyCity: app.property_city,
        propertyState: app.property_state,
        propertyRentAmount: app.property_rent_amount,
        propertyRentPeriod: app.property_rent_period,
        propertyCoverImage: app.property_cover_image,
        tenantId: app.tenant_id,
        tenant_first_name: app.first_name,
        tenant_last_name: app.last_name,
        tenant_email: app.email,
        tenant_phone: app.phone_number,
        tenant_address: app.tenant_address,
        tenantAddress: app.tenant_address,
        tenant_location: app.tenant_location,
        tenantLocation: app.tenant_location,
        status: app.status,
        notes: app.notes,
        rejectionReason: app.rejection_reason,
        landlordReviewedAt: app.landlord_reviewed_at,
        approvedAt: app.approved_at,
        declinedAt: app.declined_at,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
        date: new Date(app.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        leaseId: app.lease_id,
        leaseStatus: app.lease_status,
        leaseTenantSignedAt: app.lease_tenant_signed_at,
        leaseLandlordSignedAt: app.lease_landlord_signed_at,
        moveInChecklist: app.move_in_checklist,
        lease: app.lease_id ? {
          id: app.lease_id,
          status: app.lease_status,
          tenantSignedAt: app.lease_tenant_signed_at,
          landlordSignedAt: app.lease_landlord_signed_at,
          moveInChecklist: app.move_in_checklist
        } : null,
        invoiceId: app.invoice_id,
        invoiceNumber: app.invoice_number,
        invoiceAmount: app.invoice_amount,
        invoiceStatus: app.invoice_status,
        invoice: app.invoice_id ? {
          id: app.invoice_id,
          invoiceNumber: app.invoice_number,
          amount: parseFloat(app.invoice_amount) || 0,
          grandTotal: parseFloat(app.invoice_amount) || 0,
          status: app.invoice_status
        } : null,
        inspection: app.inspection_id ? {
          id: app.inspection_id,
          status: app.inspection_status,
          scheduledDate: app.inspection_scheduled_date,
          scheduledTime: app.inspection_scheduled_time,
          date: app.inspection_scheduled_date,
          time: app.inspection_scheduled_time,
          location: app.inspection_location,
          notes: app.inspection_notes,
          outcomeNotes: app.inspection_outcome_notes
        } : null,
        propertyRequirements: {
          minimumIncome: parseFloat(app.minimum_income_required) || 0,
          requiresGuarantor: Boolean(app.requires_guarantor)
        },
        tenant: {
          id: app.tenant_id,
          firstName: app.first_name || '',
          lastName: app.last_name || '',
          first_name: app.first_name || '',
          last_name: app.last_name || '',
          name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Tenant',
          email: app.email || '',
          phone: app.phone_number || '',
          phoneNumber: app.phone_number || '',
          phone_number: app.phone_number || '',
          avatar: app.avatar_url || '',
          avatarUrl: app.avatar_url || '',
          avatar_url: app.avatar_url || '',
          occupation: app.occupation || '',
          employerName: app.employer_name || '',
          employer_name: app.employer_name || '',
          employmentStatus: app.employment_status || '',
          employment_status: app.employment_status || '',
          monthlyIncome: app.monthly_income || '',
          monthly_income: app.monthly_income || '',
          maritalStatus: app.marital_status || '',
          marital_status: app.marital_status || '',
          dependants: app.number_of_dependants ?? null,
          number_of_dependants: app.number_of_dependants ?? null,
          numberOfDependants: app.number_of_dependants ?? null,
          guarantorName: app.guarantor_name || '',
          guarantor_name: app.guarantor_name || '',
          guarantorPhone: app.guarantor_phone || '',
          guarantor_phone: app.guarantor_phone || '',
          guarantorRelationship: app.guarantor_relationship || '',
          guarantor_relationship: app.guarantor_relationship || '',
          guarantorEmail: app.guarantor_email || '',
          guarantor_email: app.guarantor_email || '',
          address: app.tenant_address || '',
          currentAddress: app.tenant_address || '',
          tenantAddress: app.tenant_address || '',
          tenant_address: app.tenant_address || '',
          location: app.tenant_location || '',
          tenantLocation: app.tenant_location || '',
          tenant_location: app.tenant_location || '',
          postalCode: app.tenant_postal_code || '',
          postal_code: app.tenant_postal_code || '',
          gender: app.tenant_gender || '',
          dateOfBirth: app.tenant_date_of_birth || '',
          date_of_birth: app.tenant_date_of_birth || '',
          emergencyContactName: app.emergency_contact_name || '',
          emergency_contact_name: app.emergency_contact_name || '',
          emergencyContactPhone: app.emergency_contact_phone || '',
          emergency_contact_phone: app.emergency_contact_phone || '',
          emergencyContactRelationship: app.emergency_contact_relationship || '',
          emergency_contact_relationship: app.emergency_contact_relationship || ''
        }
      };
    });

    res.json({ success: true, applications: formattedApps });
  } catch (error) {
    console.error('Get landlord applications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
};

// @desc    Get single application detail by ID with nested invoice, lease, and inspection summary
// @route   GET /api/applications/:id
// @access  Private (Tenant, Landlord, Admin)
export const getApplicationById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role || req.user.primary_role;

  try {
    const detail = await fetchApplicationDetail(pool, id);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (role !== 'admin' && detail.tenantId !== userId && detail.landlordId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this application' });
    }

    res.json({ success: true, application: detail });
  } catch (error) {
    console.error('Get application by id error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching application detail' });
  }
};

// @desc    Update application status (landlord transition engine)
// @route   PATCH /api/applications/:id/status
// @access  Private (Landlord)
export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason, notes } = req.body;
  const landlordId = req.user.id;
  const role = req.user.role || req.user.primary_role;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkOwnership = await client.query(
      `SELECT p.landlord_id, a.tenant_id, a.property_id, a.status as current_status, p.title as property_title
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       WHERE a.id = $1`,
      [id]
    );

    if (checkOwnership.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { landlord_id, tenant_id, current_status, property_title } = checkOwnership.rows[0];

    if (role !== 'admin' && landlord_id !== landlordId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    // Idempotent: if identical status requested, return fresh detail
    if (current_status === status) {
      await client.query('COMMIT');
      const detail = await fetchApplicationDetail(pool, id);
      return res.json({ success: true, application: detail });
    }

    // Enforce transition rules
    const allowed = ALLOWED_APPLICATION_TRANSITIONS[current_status] || [];
    if (!allowed.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${current_status}" to "${status}".`
      });
    }

    // Build timestamp update depending on target status
    let timestampClause = '';
    const updateParams = [status, rejectionReason || null, id];

    if (status === APPLICATION_STATUS.UNDER_REVIEW) {
      timestampClause = ', landlord_reviewed_at = COALESCE(landlord_reviewed_at, NOW())';
    } else if (status === APPLICATION_STATUS.APPROVED) {
      timestampClause = ', approved_at = NOW()';
    } else if (status === APPLICATION_STATUS.DECLINED) {
      timestampClause = ', declined_at = NOW()';
    }

    if (notes) {
      timestampClause += `, notes = '${notes.replace(/'/g, "''")}'`;
    }

    await client.query(
      `UPDATE property_applications 
       SET status = $1, rejection_reason = $2, updated_at = NOW() ${timestampClause}
       WHERE id = $3`,
      updateParams
    );

    // Notify the tenant about the application update
    try {
      const isApproved = status === APPLICATION_STATUS.APPROVED;
      const isDeclined = status === APPLICATION_STATUS.DECLINED;
      const title = isApproved
        ? 'Application Approved'
        : isDeclined
          ? 'Application Declined'
          : `Application Status: ${status.replace(/_/g, ' ').toUpperCase()}`;

      const message = isApproved
        ? `Your rental application for "${property_title}" has been approved! The landlord will issue your rent invoice next.`
        : isDeclined
          ? `Your application for "${property_title}" was declined.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`
          : `Your application status for "${property_title}" is now ${status.replace(/_/g, ' ')}.`;

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenant_id, title, message, isApproved ? 'success' : isDeclined ? 'warning' : 'application', 'application', id]
      );
    } catch (notifErr) {
      console.error('Failed to notify tenant of application update:', notifErr);
    }

    await client.query('COMMIT');

    const detail = await fetchApplicationDetail(pool, id);
    res.json({ success: true, application: detail });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating application status' });
  } finally {
    client.release();
  }
};

// @desc    Withdraw/Cancel an application (Tenant only - early stages)
// @route   DELETE /api/applications/:id
// @access  Private (Tenant)
export const withdrawApplication = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const tenantId = req.user.id;

  try {
    const appCheck = await pool.query(
      `SELECT pa.id, pa.status, pa.property_id, p.landlord_id, p.title as property_title, 
              u.first_name, u.last_name 
       FROM property_applications pa
       JOIN properties p ON pa.property_id = p.id
       LEFT JOIN users u ON pa.tenant_id = u.id
       WHERE pa.id = $1 AND pa.tenant_id = $2`,
      [id, tenantId]
    );

    const app = appCheck.rows[0];
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found or not owned by you' });
    }

    // Only allow withdrawal in early statuses
    const earlyStatuses = [
      APPLICATION_STATUS.SUBMITTED,
      APPLICATION_STATUS.UNDER_REVIEW,
      APPLICATION_STATUS.INSPECTION_PENDING
    ];

    if (!earlyStatuses.includes(app.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot withdraw an application once it has progressed to "${app.status}". Please contact your landlord.` 
      });
    }

    // Auto-create notification message in landlord chat thread
    if (app.landlord_id) {
      try {
        const tenantName = `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Tenant';
        const withdrawalMsg = `[APPLICATION WITHDRAWN]\nProperty: ${app.property_title || 'Listing'}\nTenant: ${tenantName}\nReason for Withdrawal: ${reason || 'No specific reason provided.'}`;

        await pool.query(
          `INSERT INTO chat_messages (sender_id, receiver_id, property_id, message)
           VALUES ($1, $2, $3, $4)`,
          [tenantId, app.landlord_id, app.property_id, withdrawalMsg]
        );

        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            app.landlord_id,
            'Application Withdrawn',
            `${tenantName} has withdrawn their application for "${app.property_title || 'Listing'}".`,
            'info',
            'application',
            id
          ]
        );
      } catch (msgErr) {
        console.warn('Could not auto-insert withdrawal notification:', msgErr.message);
      }
    }

    // Delete application and any associated inspections
    await pool.query('DELETE FROM property_inspections WHERE application_id = $1', [id]);
    await pool.query('DELETE FROM property_applications WHERE id = $1', [id]);

    res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (error) {
    console.error('Withdraw application error:', error);
    const message = 'Server error withdrawing application';
    res.status(500).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  }
};

// @desc    Delete declined application (Landlord only)
// @route   DELETE /api/applications/landlord/:id
// @access  Private (Landlord)
export const deleteLandlordApplication = async (req, res) => {
  const { id } = req.params;
  const landlordId = req.user.id;

  try {
    const checkApp = await pool.query(
      `SELECT a.id, a.status 
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       WHERE a.id = $1 AND p.landlord_id = $2`,
      [id, landlordId]
    );

    const app = checkApp.rows[0];
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    if (app.status !== APPLICATION_STATUS.DECLINED) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only declined applications can be deleted from the pipeline.' 
      });
    }

    await pool.query('DELETE FROM property_inspections WHERE application_id = $1', [id]);
    await pool.query('DELETE FROM property_applications WHERE id = $1', [id]);

    res.json({ success: true, message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('Delete landlord application error:', error);
    const message = 'Server error deleting application';
    res.status(500).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  }
};

// ============================================================
// INSPECTION ENDPOINTS (OPTIONAL WORKFLOW PATH)
// ============================================================

// @desc    Tenant requests an optional inspection
// @route   POST /api/applications/:id/inspections/request
// @access  Private (Tenant)
export const requestInspection = async (req, res) => {
  const { id } = req.params;
  const { date, time, notes } = req.body;
  const tenantId = req.user.id;

  try {
    const appRes = await pool.query(
      `SELECT a.id, a.status, a.property_id, p.landlord_id, p.title as property_title,
              tu.first_name, tu.last_name
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users tu ON a.tenant_id = tu.id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [id, tenantId]
    );

    if (appRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    const app = appRes.rows[0];
    if (app.status !== APPLICATION_STATUS.SUBMITTED && app.status !== APPLICATION_STATUS.UNDER_REVIEW) {
      return res.status(400).json({ 
        success: false, 
        message: 'Inspections can only be requested while the application is submitted or under review.' 
      });
    }

    const scheduledDate = date || new Date().toISOString().split('T')[0];
    const scheduledTime = time || '10:00 AM';

    const insertRes = await pool.query(
      `INSERT INTO property_inspections 
       (application_id, property_id, tenant_id, landlord_id, scheduled_date, scheduled_time, date, time, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $5, $6, $7, $8, 'tenant')
       RETURNING *`,
      [
        id, 
        app.property_id, 
        tenantId, 
        app.landlord_id, 
        scheduledDate, 
        scheduledTime, 
        notes || '', 
        INSPECTION_STATUS.REQUESTED
      ]
    );

    const inspection = insertRes.rows[0];
    const tenantName = `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Tenant';

    // Notify landlord
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          app.landlord_id,
          'Inspection Requested',
          `${tenantName} requested an inspection for "${app.property_title}" on ${scheduledDate} at ${scheduledTime}.`,
          'inspection',
          'inspection',
          inspection.id
        ]
      );

      await pool.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, property_id, message)
         VALUES ($1, $2, $3, $4)`,
        [
          tenantId,
          app.landlord_id,
          app.property_id,
          `[INSPECTION REQUESTED]\nProperty: ${app.property_title}\nProposed Date: ${scheduledDate} at ${scheduledTime}${notes ? `\nNotes: ${notes}` : ''}`
        ]
      );
    } catch (e) {
      console.warn('Failed to send inspection request notification:', e.message);
    }

    const detail = await fetchApplicationDetail(pool, id);
    res.status(201).json({ success: true, inspection, application: detail });
  } catch (error) {
    console.error('Request inspection error:', error);
    res.status(500).json({ success: false, message: 'Server error requesting inspection' });
  }
};

// @desc    Landlord schedules date, time, location for inspection
// @route   POST /api/applications/:id/inspections/schedule
// @access  Private (Landlord)
export const scheduleInspection = async (req, res) => {
  const { id } = req.params;
  const { date, time, location, notes } = req.body;
  const landlordId = req.user.id;
  const role = req.user.role || req.user.primary_role;

  if (!date) {
    return res.status(400).json({ success: false, message: 'Scheduled date is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT a.id, a.status, a.tenant_id, a.property_id, p.landlord_id, p.title as property_title, p.address_line1 as property_address
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       WHERE a.id = $1`,
      [id]
    );

    if (appRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = appRes.rows[0];
    if (role !== 'admin' && app.landlord_id !== landlordId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this property' });
    }

    const schedDate = date;
    const schedTime = time || '10:00 AM';
    const schedLocation = location || app.property_address || app.property_title;

    // Check if an inspection record already exists for this application
    const existingInsp = await client.query(
      `SELECT id FROM property_inspections WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    let savedInsp;
    if (existingInsp.rowCount > 0) {
      const updateRes = await client.query(
        `UPDATE property_inspections 
         SET scheduled_date = $1, scheduled_time = $2, date = $1, time = $2,
             location = $3, notes = $4, status = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [schedDate, schedTime, schedLocation, notes || '', INSPECTION_STATUS.SCHEDULED, existingInsp.rows[0].id]
      );
      savedInsp = updateRes.rows[0];
    } else {
      const insertRes = await client.query(
        `INSERT INTO property_inspections 
         (application_id, property_id, tenant_id, landlord_id, scheduled_date, scheduled_time, date, time, location, notes, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $5, $6, $7, $8, $9, 'landlord')
         RETURNING *`,
        [id, app.property_id, app.tenant_id, landlordId, schedDate, schedTime, schedLocation, notes || '', INSPECTION_STATUS.SCHEDULED]
      );
      savedInsp = insertRes.rows[0];
    }

    // Advance application status to inspection_pending
    await client.query(
      `UPDATE property_applications 
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [APPLICATION_STATUS.INSPECTION_PENDING, id]
    );

    // Notify tenant
    try {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          app.tenant_id,
          'Inspection Scheduled',
          `An inspection for "${app.property_title}" has been scheduled for ${schedDate} at ${schedTime}. Location: ${schedLocation}`,
          'inspection',
          'inspection',
          savedInsp.id
        ]
      );

      await client.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, property_id, message)
         VALUES ($1, $2, $3, $4)`,
        [
          landlordId,
          app.tenant_id,
          app.property_id,
          `[INSPECTION SCHEDULED]\nProperty: ${app.property_title}\nDate: ${schedDate}\nTime: ${schedTime}\nLocation: ${schedLocation}${notes ? `\nNotes: ${notes}` : ''}\n\nPlease attend at the scheduled time.`
        ]
      );
    } catch (e) {
      console.warn('Failed to send inspection scheduled notification:', e.message);
    }

    await client.query('COMMIT');

    const detail = await fetchApplicationDetail(pool, id);
    res.json({ success: true, inspection: savedInsp, application: detail });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Schedule inspection error:', error);
    res.status(500).json({ success: false, message: 'Server error scheduling inspection' });
  } finally {
    client.release();
  }
};

// @desc    Landlord marks inspection outcome (passed, failed, cancelled)
// @route   PATCH /api/applications/:id/inspections/:inspId
// @access  Private (Landlord)
export const updateInspectionOutcome = async (req, res) => {
  const { id, inspId } = req.params;
  const { status, outcomeNotes } = req.body;
  const landlordId = req.user.id;
  const role = req.user.role || req.user.primary_role;

  const validOutcomes = [
    INSPECTION_STATUS.COMPLETED_PASSED,
    INSPECTION_STATUS.COMPLETED_FAILED,
    INSPECTION_STATUS.CANCELLED
  ];

  if (!status || !validOutcomes.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validOutcomes.join(', ')}`
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inspRes = await client.query(
      `SELECT i.*, p.landlord_id, p.title as property_title, a.status as app_status
       FROM property_inspections i
       JOIN property_applications a ON i.application_id = a.id
       JOIN properties p ON i.property_id = p.id
       WHERE i.id = $1 AND i.application_id = $2`,
      [inspId, id]
    );

    if (inspRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Inspection not found for this application' });
    }

    const insp = inspRes.rows[0];
    if (role !== 'admin' && insp.landlord_id !== landlordId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this property' });
    }

    const updatedInspRes = await client.query(
      `UPDATE property_inspections 
       SET status = $1, outcome_notes = $2, completed_at = NOW(), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, outcomeNotes || null, inspId]
    );
    const updatedInspection = updatedInspRes.rows[0];

    // Transition application status back to under_review so landlord can proceed to approve or decline
    await client.query(
      `UPDATE property_applications 
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [APPLICATION_STATUS.UNDER_REVIEW, id]
    );

    // Notify tenant
    try {
      const outcomeLabel = status === INSPECTION_STATUS.COMPLETED_PASSED
        ? 'Inspection Passed'
        : status === INSPECTION_STATUS.COMPLETED_FAILED
          ? 'Inspection Failed'
          : 'Inspection Cancelled';

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          insp.tenant_id,
          outcomeLabel,
          `Inspection for "${insp.property_title}" marked as ${status.replace(/_/g, ' ')}.${outcomeNotes ? ` Notes: ${outcomeNotes}` : ''}`,
          status === INSPECTION_STATUS.COMPLETED_PASSED ? 'success' : 'info',
          'inspection',
          inspId
        ]
      );
    } catch (e) {
      console.warn('Failed to send inspection outcome notification:', e.message);
    }

    await client.query('COMMIT');

    const detail = await fetchApplicationDetail(pool, id);
    res.json({ success: true, inspection: updatedInspection, application: detail });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update inspection outcome error:', error);
    res.status(500).json({ success: false, message: 'Server error updating inspection outcome' });
  } finally {
    client.release();
  }
};

// ============================================================
// MOVE-IN COMPLETION
// ============================================================

// @desc    Landlord completes move-in and marks tenancy active
// @route   POST /api/applications/:id/move-in
// @access  Private (Landlord)
export const completeMoveIn = async (req, res) => {
  const { id } = req.params;
  const { checklist, notes, moveInDate } = req.body;
  const landlordId = req.user.id;
  const role = req.user.role || req.user.primary_role;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT a.id, a.status, a.tenant_id, a.property_id, a.lease_id, p.landlord_id, p.title as property_title,
              tu.first_name || ' ' || tu.last_name as tenant_name
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users tu ON a.tenant_id = tu.id
       WHERE a.id = $1`,
      [id]
    );

    if (appRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Application not found', message: 'Application not found' });
    }

    const app = appRes.rows[0];
    if (role !== 'admin' && app.landlord_id !== landlordId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not own this property', message: 'Unauthorized: You do not own this property' });
    }

    const normalizedStatus = (app.status || '').toLowerCase().trim();
    const isLeaseSignedOrMovedIn = normalizedStatus === APPLICATION_STATUS.LEASE_SIGNED || normalizedStatus === APPLICATION_STATUS.MOVED_IN;

    // Fetch lease associated with this application
    const leaseRes = await client.query(
      `SELECT id, status, start_date, tenant_signed_at, landlord_signed_at 
       FROM leases 
       WHERE application_id = $1 OR id = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [id, app.lease_id || null]
    );

    const lease = leaseRes.rows[0];
    const isLeaseSignedByTenant = Boolean(lease?.tenant_signed_at || lease?.status === 'fully_signed' || lease?.status === 'active');

    if (!isLeaseSignedOrMovedIn && !isLeaseSignedByTenant) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: `Move-in can only be completed when lease signatures are complete (current status: "${app.status}", required: "lease_signed").`,
        message: `Move-in can only be completed when lease signatures are complete (current status: "${app.status}", required: "lease_signed").` 
      });
    }

    const effectiveStartDate = moveInDate || (lease?.start_date) || new Date().toISOString().split('T')[0];

    // 1. Update lease to 'active'
    if (lease) {
      await client.query(
        `UPDATE leases 
         SET status = 'active', 
             move_in_completed_at = NOW(), 
             move_in_checklist = $1, 
             landlord_signed_at = COALESCE(landlord_signed_at, NOW()),
             tenant_signed_at = COALESCE(tenant_signed_at, NOW()),
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(checklist || {}), lease.id]
      );
    }

    // 2. Update property to 'active_occupied'
    await client.query(
      `UPDATE properties 
       SET status = 'active_occupied', is_occupied = true, 
           tenant_name = $1, lease_start_date = $2, updated_at = NOW()
       WHERE id = $3`,
      [app.tenant_name, effectiveStartDate, app.property_id]
    );

    // 2b. Also update any vacant/available property_units for this property to 'occupied'
    try {
      await client.query(
        `UPDATE property_units 
         SET status = 'occupied', updated_at = NOW()
         WHERE property_id = $1 AND status IN ('vacant', 'available')`,
        [app.property_id]
      );
    } catch (unitErr) {
      console.warn('Property units update notice:', unitErr.message);
    }

    // 3. Update application to 'moved_in'
    await client.query(
      `UPDATE property_applications 
       SET status = $1, lease_id = COALESCE(lease_id, $2), updated_at = NOW()
       WHERE id = $3`,
      [APPLICATION_STATUS.MOVED_IN, lease?.id || null, id]
    );

    // 4. Send notifications & chat message
    try {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          app.tenant_id,
          'Move-in Complete - Welcome to Your Home',
          `Your move-in for "${app.property_title}" has been finalized! Your tenancy is now officially active.`,
          'success',
          'application',
          id
        ]
      );

      await client.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, property_id, message)
         VALUES ($1, $2, $3, $4)`,
        [
          landlordId,
          app.tenant_id,
          app.property_id,
          `[MOVE-IN FINALIZED]\nWelcome to "${app.property_title}"! Key handover and move-in inspection have been completed successfully. Your tenancy is now active.${notes ? `\n\nNotes from Landlord: ${notes}` : ''}`
        ]
      );
    } catch (e) {
      console.warn('Failed to send move-in notifications:', e.message);
    }

    await client.query('COMMIT');

    const detail = await fetchApplicationDetail(pool, id);
    res.json({ success: true, application: detail });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete move-in error:', error);
    const message = 'Server error completing move-in';
    res.status(500).json({ 
      success: false, 
      error: message,
      message,
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  } finally {
    client.release();
  }
};
