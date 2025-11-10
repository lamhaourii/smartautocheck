/**
 * Seed file for development vehicles
 */

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('vehicles').del();

  // Insert seed entries (for customer user)
  await knex('vehicles').insert([
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      user_id: '33333333-3333-3333-3333-333333333333', // Jane Customer
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      license_plate: 'ABC123',
      vin: '1HGBH41JXMN109186',
      color: 'Silver',
      fuel_type: 'gasoline',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      user_id: '33333333-3333-3333-3333-333333333333', // Jane Customer
      make: 'Honda',
      model: 'Accord',
      year: 2019,
      license_plate: 'XYZ789',
      vin: '2HGBH41JXMN109187',
      color: 'Blue',
      fuel_type: 'gasoline',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      user_id: '44444444-4444-4444-4444-444444444444', // Test User
      make: 'Tesla',
      model: 'Model 3',
      year: 2022,
      license_plate: 'TESLA1',
      vin: '5YJ3E1EA0MF000001',
      color: 'Red',
      fuel_type: 'electric',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Development vehicles seeded successfully');
};
