import { pool } from '../config/db.js';

// @desc    Apply for a property
// @route   POST /api/applications
// @access  Private (Tenant)
export const applyForProperty = async (req, res) => {
  const { propertyId, notes } = req.body;
  const tenantId = req.user.id;

  if (!propertyId) {
    return res.status(400).json({ success: false, message: 'Property ID is required' });
  }

  try {
    const newApp = await pool.query(
      `INSERT INTO property_applications (property_id, tenant_id, notes) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [propertyId, tenantId, notes]
    );
    
    res.status(201).json({ success: true, application: newApp.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      // 23505 is the PostgreSQL unique violation error code
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
         p.title as "propertyTitle"
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC`,
      [tenantId]
    );
    
    // Format the date to something like "Just now" or short date to match frontend expectation for now
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
