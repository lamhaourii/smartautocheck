/**
 * Seed file for development users
 * Password for all users: Password123!
 */

const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Hash password once for all users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Delete existing entries
  await knex('users').del();

  // Insert seed entries
  await knex('users').insert([
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@smartautocheck.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1234567890',
      role: 'admin',
      email_verified: true,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'inspector@smartautocheck.com',
      password_hash: passwordHash,
      first_name: 'John',
      last_name: 'Inspector',
      phone: '+1234567891',
      role: 'inspector',
      email_verified: true,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'customer@smartautocheck.com',
      password_hash: passwordHash,
      first_name: 'Jane',
      last_name: 'Customer',
      phone: '+1234567892',
      role: 'customer',
      email_verified: true,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'test@example.com',
      password_hash: passwordHash,
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567893',
      role: 'customer',
      email_verified: true,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Development users seeded successfully');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@smartautocheck.com / Password123!');
  console.log('   Inspector: inspector@smartautocheck.com / Password123!');
  console.log('   Customer: customer@smartautocheck.com / Password123!');
};
