# Database Migrations & Seeds

Database schema management using Knex.js for SmartAutoCheck.

## Setup

```bash
cd database
npm install
```

## Environment Variables

Ensure your `.env` file has the following variables:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=smartautocheck
POSTGRES_PASSWORD=your-password
POSTGRES_DB=smartautocheck_db
```

## Commands

### Run Migrations

```bash
# Run all pending migrations
npm run migrate:latest

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

### Run Seeds

```bash
# Run all seed files
npm run seed:run

# Create new seed file
npm run seed:make seed_name
```

## Migration Files

### 20240101000000_initial_schema.js

Creates all tables for the consolidated SmartAutoCheck architecture:

- **users** - User accounts (customer, inspector, admin)
- **refresh_tokens** - JWT refresh tokens
- **vehicles** - Customer vehicles
- **appointments** - Inspection appointments
- **payments** - Payment transactions (PayPal)
- **invoices** - Generated invoices
- **inspections** - Inspection records with checkpoints
- **inspection_checkpoints** - Individual inspection items
- **certificates** - Generated certificates with digital signatures
- **audit_logs** - System audit trail

## Seed Files

### Development Seeds

- **001_dev_users.js** - Development users
  - Admin: `admin@smartautocheck.com` / `Password123!`
  - Inspector: `inspector@smartautocheck.com` / `Password123!`
  - Customer: `customer@smartautocheck.com` / `Password123!`
  - Test User: `test@example.com` / `Password123!`

- **002_dev_vehicles.js** - Sample vehicles for testing

## Database Schema

### Users & Authentication
```
users (id, email, password_hash, first_name, last_name, phone, role, ...)
refresh_tokens (id, user_id, token, expires_at, is_revoked)
```

### Vehicles & Appointments
```
vehicles (id, user_id, make, model, year, license_plate, vin, ...)
appointments (id, user_id, vehicle_id, inspector_id, scheduled_date, status, ...)
```

### Payments & Invoices
```
payments (id, appointment_id, amount, payment_method, status, paypal_order_id, ...)
invoices (id, invoice_number, payment_id, amount, pdf_path, ...)
```

### Inspections & Certificates
```
inspections (id, appointment_id, inspector_id, status, result, ...)
inspection_checkpoints (id, inspection_id, checkpoint_name, status, notes, ...)
certificates (id, certificate_number, inspection_id, issue_date, expiry_date, digital_signature, ...)
```

### Audit Trail
```
audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ...)
```

## Quick Start (Docker)

When using Docker Compose, migrations run automatically on first start. To manually run:

```bash
docker-compose exec postgres psql -U smartautocheck -d smartautocheck_db

# Inside psql
\dt  # List all tables
\d users  # Describe users table
```

## Production Deployment

1. **Backup existing database** before running migrations
2. **Test migrations** on staging environment first
3. **Run migrations** during maintenance window
4. **Verify schema** after migration completes

```bash
# Production migration (with backup)
pg_dump -U smartautocheck smartautocheck_db > backup_$(date +%Y%m%d).sql
NODE_ENV=production npm run migrate:latest
```

## Rollback Strategy

If a migration causes issues:

```bash
# Rollback last migration
npm run migrate:rollback

# Restore from backup if needed
psql -U smartautocheck smartautocheck_db < backup_20240101.sql
```

## Creating New Migrations

```bash
# Create migration file
npm run migrate:make add_user_preferences

# Edit the generated file in migrations/
# Implement up() and down() functions
```

Example:
```javascript
exports.up = async function(knex) {
  await knex.schema.table('users', (table) => {
    table.jsonb('notification_preferences').defaultTo('{}');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('users', (table) => {
    table.dropColumn('notification_preferences');
  });
};
```

## Best Practices

- ✅ Always implement both `up()` and `down()` functions
- ✅ Test migrations locally before deploying
- ✅ Use transactions for complex migrations
- ✅ Never modify existing migrations after deployment
- ✅ Create new migrations for schema changes
- ✅ Keep migrations small and focused
- ✅ Document complex migrations with comments
- ✅ Backup before production migrations

## Troubleshooting

### Migration fails with "relation already exists"
```bash
# Check current migration status
npm run migrate:status

# Manually mark migration as run (if safe)
# Or rollback and retry
npm run migrate:rollback
npm run migrate:latest
```

### Seeds fail with duplicate key
```bash
# Seeds are idempotent - they delete before inserting
# If error persists, manually clear tables:
psql -U smartautocheck smartautocheck_db -c "TRUNCATE users CASCADE;"
npm run seed:run
```

## License

MIT
