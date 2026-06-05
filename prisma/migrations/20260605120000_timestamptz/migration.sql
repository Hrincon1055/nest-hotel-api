-- Migracion: convertir columnas DateTime de TIMESTAMP a TIMESTAMPTZ.
-- Se asume que los valores existentes fueron guardados como UTC (PGTZ por defecto).
-- USING ... AT TIME ZONE 'UTC' reinterpreta esos valores como instantes UTC.

-- employees
ALTER TABLE "employees"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC';

-- refresh_tokens
ALTER TABLE "refresh_tokens"
  ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ(3) USING "expires_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "revoked_at" TYPE TIMESTAMPTZ(3) USING "revoked_at" AT TIME ZONE 'UTC';

-- customers
ALTER TABLE "customers"
  ALTER COLUMN "birth_date" TYPE TIMESTAMPTZ(3) USING "birth_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC';

-- rooms
ALTER TABLE "rooms"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC';

-- reservations
ALTER TABLE "reservations"
  ALTER COLUMN "check_in_date" TYPE TIMESTAMPTZ(3) USING "check_in_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "check_out_date" TYPE TIMESTAMPTZ(3) USING "check_out_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC';

-- multi_room_reservations
ALTER TABLE "multi_room_reservations"
  ALTER COLUMN "check_in_date" TYPE TIMESTAMPTZ(3) USING "check_in_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "check_out_date" TYPE TIMESTAMPTZ(3) USING "check_out_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC';

-- additional_services
ALTER TABLE "additional_services"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC';

-- reservation_services
ALTER TABLE "reservation_services"
  ALTER COLUMN "service_date" TYPE TIMESTAMPTZ(3) USING "service_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

-- check_in_outs
ALTER TABLE "check_in_outs"
  ALTER COLUMN "check_in_time" TYPE TIMESTAMPTZ(3) USING "check_in_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "check_out_time" TYPE TIMESTAMPTZ(3) USING "check_out_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

-- cleaning_tasks
ALTER TABLE "cleaning_tasks"
  ALTER COLUMN "scheduled_date" TYPE TIMESTAMPTZ(3) USING "scheduled_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "completed_date" TYPE TIMESTAMPTZ(3) USING "completed_date" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

-- audit_logs
ALTER TABLE "audit_logs"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
