import { pool } from './src/db/db.js';
import { PropertyModel } from './src/models/propertyModel.js';

async function seed() {
  try {
    // 1. Get any landlord
    const res = await pool.query(`SELECT id FROM users WHERE primary_role = 'landlord' LIMIT 1`);
    if (res.rowCount === 0) {
      console.log('No landlord found. Cannot seed property.');
      process.exit(1);
    }
    const landlordId = res.rows[0].id;
    console.log(`Found landlord: ${landlordId}`);

    // 2. Build a bulk property
    const propertyData = {
      effectiveLandlordId: landlordId,
      title: 'Sunrise Bulk Apartments',
      slug: 'sunrise-bulk-apartments-' + Date.now(),
      description: 'A beautiful newly generated multi-unit building to test the bulk generator rendering.',
      property_type: 'apartment',
      sanitizedPropertyType: 'apartment',
      address_line1: '123 Bulk Generator Way',
      city: 'Lagos',
      state: 'Lagos',
      rent_amount: 1500000,
      rent_period: 'annually',
      status: 'active_vacant', // approve it so it shows on tenant search immediately
      is_occupied: false,
      amenities: ['24/7 Security', 'Prepaid Meter', 'Parking Space'],
      rules: ['No Pets', 'No Smoking'],
      cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
      ],
      units: [
        {
          unit_name: 'Flat 1',
          bedrooms: 2,
          bathrooms: 2,
          rent_amount: 1500000,
          rent_period: 'annually',
          status: 'vacant',
          description: 'Ground floor unit',
          images: ['https://images.unsplash.com/photo-1502672260266-1c1de2d9d0d9?auto=format&fit=crop&w=600&q=80']
        },
        {
          unit_name: 'Flat 2',
          bedrooms: 2,
          bathrooms: 2,
          rent_amount: 1500000,
          rent_period: 'annually',
          status: 'vacant',
          description: 'Ground floor unit',
          images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80']
        },
        {
          unit_name: 'Flat 3',
          bedrooms: 2,
          bathrooms: 2,
          rent_amount: 1500000,
          rent_period: 'annually',
          status: 'vacant',
          description: 'First floor unit',
          images: ['https://images.unsplash.com/photo-1502672260266-1c1de2d9d0d9?auto=format&fit=crop&w=600&q=80']
        },
        {
          unit_name: 'Flat 4',
          bedrooms: 2,
          bathrooms: 2,
          rent_amount: 1500000,
          rent_period: 'annually',
          status: 'vacant',
          description: 'First floor unit',
          images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80']
        },
        {
          unit_name: 'Flat 5',
          bedrooms: 3,
          bathrooms: 3,
          rent_amount: 2500000,
          rent_period: 'annually',
          status: 'vacant',
          description: 'Penthouse unit',
          images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80']
        },
        {
          unit_name: 'Flat 6',
          bedrooms: 3,
          bathrooms: 3,
          rent_amount: 2500000,
          rent_period: 'annually',
          status: 'occupied', // Test occupied badge
          description: 'Penthouse unit',
          images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80']
        }
      ]
    };

    // 3. Create property using the model
    const newProperty = await PropertyModel.createProperty(propertyData);

    console.log(`Successfully created bulk property: ${newProperty.title} with ID ${newProperty.id}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding property:', err);
    process.exit(1);
  }
}

seed();
