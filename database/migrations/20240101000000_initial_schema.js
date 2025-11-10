/**
 * Initial database schema for SmartAutoCheck
 * Creates all tables for the consolidated microservices architecture
 */

exports.up = async function(knex) {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20);
    table.enum('role', ['customer', 'inspector', 'admin']).defaultTo('customer');
    table.boolean('email_verified').defaultTo(false);
    table.string('verification_token', 255);
    table.timestamp('verification_token_expires');
    table.string('reset_password_token', 255);
    table.timestamp('reset_password_expires');
    table.jsonb('preferences').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login');
    table.timestamps(true, true);
    
    table.index('email');
    table.index('role');
  });

  // Refresh tokens table
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 500).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('token');
    table.index('expires_at');
  });

  // Vehicles table
  await knex.schema.createTable('vehicles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('make', 50).notNullable();
    table.string('model', 50).notNullable();
    table.integer('year').notNullable();
    table.string('license_plate', 20).notNullable();
    table.string('vin', 17);
    table.string('color', 30);
    table.enum('fuel_type', ['gasoline', 'diesel', 'electric', 'hybrid']).defaultTo('gasoline');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('license_plate');
  });

  // Appointments table
  await knex.schema.createTable('appointments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('vehicle_id').references('id').inTable('vehicles').onDelete('SET NULL');
    table.uuid('inspector_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('scheduled_date').notNullable();
    table.enum('service_type', ['standard', 'premium', 'express']).defaultTo('standard');
    table.enum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
    table.enum('payment_status', ['unpaid', 'paid', 'refunded']).defaultTo('unpaid');
    table.text('notes');
    table.text('cancellation_reason');
    table.timestamp('cancelled_at');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('vehicle_id');
    table.index('inspector_id');
    table.index('scheduled_date');
    table.index('status');
    table.index('payment_status');
  });

  // Payments table
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('appointment_id').notNullable().references('id').inTable('appointments').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.enum('payment_method', ['paypal', 'credit_card', 'debit_card']).defaultTo('paypal');
    table.string('paypal_order_id', 100);
    table.string('paypal_capture_id', 100);
    table.enum('status', ['pending', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.enum('refund_status', ['none', 'partial', 'refunded']).defaultTo('none');
    table.decimal('refund_amount', 10, 2);
    table.string('refund_id', 100);
    table.timestamp('refunded_at');
    table.timestamp('captured_at');
    table.timestamps(true, true);
    
    table.index('appointment_id');
    table.index('user_id');
    table.index('status');
    table.index('paypal_order_id');
  });

  // Invoices table
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('invoice_number', 50).notNullable().unique();
    table.uuid('payment_id').notNullable().references('id').inTable('payments').onDelete('CASCADE');
    table.uuid('appointment_id').notNullable().references('id').inTable('appointments').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.enum('status', ['generated', 'sent', 'viewed']).defaultTo('generated');
    table.string('pdf_path', 500);
    table.timestamps(true, true);
    
    table.index('invoice_number');
    table.index('payment_id');
    table.index('user_id');
  });

  // Inspections table
  await knex.schema.createTable('inspections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('appointment_id').notNullable().references('id').inTable('appointments').onDelete('CASCADE');
    table.uuid('inspector_id').notNullable().references('id').inTable('users').onDelete('SET NULL');
    table.enum('status', ['pending', 'in_progress', 'completed']).defaultTo('pending');
    table.enum('result', ['pass', 'fail', 'conditional']).defaultTo(null);
    table.text('notes');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.index('appointment_id');
    table.index('inspector_id');
    table.index('status');
    table.index('result');
  });

  // Inspection checkpoints table
  await knex.schema.createTable('inspection_checkpoints', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('inspection_id').notNullable().references('id').inTable('inspections').onDelete('CASCADE');
    table.string('checkpoint_name', 100).notNullable();
    table.enum('status', ['pass', 'fail', 'warning']).notNullable();
    table.text('notes');
    table.string('photo_url', 500);
    table.timestamps(true, true);
    
    table.index('inspection_id');
    table.unique(['inspection_id', 'checkpoint_name']);
  });

  // Certificates table
  await knex.schema.createTable('certificates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('certificate_number', 50).notNullable().unique();
    table.uuid('inspection_id').notNullable().references('id').inTable('inspections').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('vehicle_id').references('id').inTable('vehicles').onDelete('SET NULL');
    table.date('issue_date').notNullable();
    table.date('expiry_date').notNullable();
    table.enum('status', ['active', 'expired', 'revoked']).defaultTo('active');
    table.string('digital_signature', 500).notNullable();
    table.string('pdf_path', 500);
    table.text('revocation_reason');
    table.timestamp('revoked_at');
    table.boolean('expiry_notification_sent').defaultTo(false);
    table.timestamps(true, true);
    
    table.index('certificate_number');
    table.index('inspection_id');
    table.index('user_id');
    table.index('vehicle_id');
    table.index('status');
    table.index('expiry_date');
  });

  // Audit log table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('entity_type');
    table.index('entity_id');
    table.index('created_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('certificates');
  await knex.schema.dropTableIfExists('inspection_checkpoints');
  await knex.schema.dropTableIfExists('inspections');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('appointments');
  await knex.schema.dropTableIfExists('vehicles');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
};
