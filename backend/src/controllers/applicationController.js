import { pool } from '../db/db.js';

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
    guarantorEmail
  } = req.body;
  const tenantId = req.user.id;

  if (!propertyId) {
    return res.status(400).json({ success: false, message: 'Property ID is required' });
  }

  try {
    // 1. Upsert Tenant Profile details if provided
    const safeIncome = (monthlyIncome !== undefined && monthlyIncome !== "") ? Number(monthlyIncome) : null;
    const safeDependants = (dependants !== undefined && dependants !== "") ? Number(dependants) : null;

    await pool.query(
      `INSERT INTO tenant_profiles (
         user_id, monthly_income, employment_status, employer_name, occupation,
         marital_status, number_of_dependants, guarantor_name, guarantor_phone,
         guarantor_relationship, guarantor_email, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         monthly_income = COALESCE(EXCLUDED.monthly_income, tenant_profiles.monthly_income),
         employment_status = COALESCE(EXCLUDED.employment_status, tenant_profiles.employment_status),
         employer_name = COALESCE(EXCLUDED.employer_name, tenant_profiles.employer_name),
         occupation = COALESCE(EXCLUDED.occupation, tenant_profiles.occupation),
         marital_status = COALESCE(EXCLUDED.marital_status, tenant_profiles.marital_status),
         number_of_dependants = COALESCE(EXCLUDED.number_of_dependants, tenant_profiles.number_of_dependants),
         guarantor_name = EXCLUDED.guarantor_name,
         guarantor_phone = EXCLUDED.guarantor_phone,
         guarantor_relationship = EXCLUDED.guarantor_relationship,
         guarantor_email = EXCLUDED.guarantor_email,
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
        guarantorEmail || null
      ]
    );

    // 2. Insert application record
    const newApp = await pool.query(
      `INSERT INTO property_applications (property_id, tenant_id, notes) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [propertyId, tenantId, notes || null]
    );
    
    res.status(201).json({ success: true, application: newApp.rows[0] });
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
         a.status, 
         a.notes, 
         a.created_at as date,
         a.property_id as "propertyId",
         p.title as "propertyTitle",
         p.landlord_id as "landlordId",
         u.first_name as "landlordFirstName",
         u.last_name as "landlordLastName",
         u.avatar_url as "landlordAvatar",
         (
           SELECT message FROM chat_messages cm 
           WHERE (cm.sender_id = p.landlord_id AND cm.receiver_id = a.tenant_id)
              OR (cm.sender_id = a.tenant_id AND cm.receiver_id = p.landlord_id)
           ORDER BY cm.created_at DESC LIMIT 1
         ) as "lastMessage"
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users u ON p.landlord_id = u.id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC`,
      [tenantId]
    );
    
    const formattedApps = apps.rows.map(app => {
      const d = new Date(app.date);
      const isToday = new Date().toDateString() === d.toDateString();
      return {
        ...app,
        date: isToday ? "Today" : d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
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
         a.created_at,
         a.property_id,
         a.tenant_id,
         p.title as property_title,
         p.rent_amount as property_rent_amount,
         p.rent_period as property_rent_period,
         p.minimum_income_required,
         p.requires_guarantor,
         u.first_name,
         u.last_name,
         u.email,
         u.avatar_url,
         tp.occupation,
         tp.employer_name,
         tp.employment_status,
         tp.monthly_income,
         tp.marital_status,
         tp.number_of_dependants,
         tp.guarantor_name,
         tp.guarantor_phone,
         tp.guarantor_relationship
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users u ON a.tenant_id = u.id
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       WHERE p.landlord_id = $1
       ORDER BY a.created_at DESC`,
      [landlordId]
    );
    
    const formattedApps = apps.rows.map(app => ({
      id: app.id,
      propertyId: app.property_id,
      propertyTitle: app.property_title,
      propertyRentAmount: app.property_rent_amount,
      propertyRentPeriod: app.property_rent_period,
      tenantId: app.tenant_id,
      status: app.status,
      notes: app.notes,
      rejectionReason: app.rejection_reason,
      createdAt: app.created_at,
      date: new Date(app.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      propertyRequirements: {
        minimumIncome: parseFloat(app.minimum_income_required) || 0,
        requiresGuarantor: app.requires_guarantor
      },
      tenant: {
        firstName: app.first_name,
        lastName: app.last_name,
        name: `${app.first_name} ${app.last_name}`,
        email: app.email,
        avatar: app.avatar_url,
        occupation: app.occupation,
        employerName: app.employer_name,
        employmentStatus: app.employment_status,
        monthlyIncome: parseFloat(app.monthly_income) || 0,
        maritalStatus: app.marital_status,
        dependants: app.number_of_dependants,
        guarantorName: app.guarantor_name,
        guarantorPhone: app.guarantor_phone,
        guarantorRelationship: app.guarantor_relationship
      }
    }));

    res.json({ success: true, applications: formattedApps });
  } catch (error) {
    console.error('Get landlord applications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private (Landlord)
export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  const landlordId = req.user.id;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  try {
    // Verify the landlord owns the property this application is for
    const checkOwnership = await pool.query(
      `SELECT p.landlord_id 
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       WHERE a.id = $1`,
      [id]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (checkOwnership.rows[0].landlord_id !== landlordId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    const updatedApp = await pool.query(
      `UPDATE property_applications 
       SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, rejectionReason || null, id]
    );

    res.json({ success: true, application: updatedApp.rows[0] });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating application status' });
  }
};

// @desc    Withdraw/Cancel an application
// @route   DELETE /api/applications/:id
// @access  Private (Tenant)
export const withdrawApplication = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.id;

  try {
    const appCheck = await pool.query(
      'SELECT id, status FROM property_applications WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (appCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found or not owned by you' });
    }

    const app = appCheck.rows[0];
    if (app.status === 'leased' || app.status === 'active') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw an application for an active tenancy.' });
    }

    // Delete application
    await pool.query('DELETE FROM property_applications WHERE id = $1', [id]);

    res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ success: false, message: 'Server error withdrawing application' });
  }
};
