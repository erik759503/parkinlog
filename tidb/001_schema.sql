-- Parkinlog schema for TiDB Cloud / MySQL-compatible databases.
--
-- Run with a MySQL-compatible client:
-- mysql -h gateway01.us-east-1.prod.aws.tidbcloud.com -P 4000 -u 'wkF6X7PzDYQDfce.root' -p --ssl-mode=REQUIRED < tidb/001_schema.sql
--
-- The original Supabase project used auth.users, RLS policies, triggers and
-- Edge Functions. TiDB stores the relational data; authentication,
-- authorization and password hashing must be enforced by a backend API.

CREATE DATABASE IF NOT EXISTS parkinlog
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE parkinlog;

CREATE TABLE IF NOT EXISTS app_users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  username VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY app_users_email_unique (email),
  UNIQUE KEY app_users_username_unique (username),
  KEY app_users_status_idx (status)
);

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  username VARCHAR(120) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY profiles_user_id_unique (user_id),
  UNIQUE KEY profiles_username_unique (username),
  CONSTRAINT profiles_user_id_fk
    FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  role ENUM('dev', 'admin', 'gate', 'office') NOT NULL DEFAULT 'gate',
  PRIMARY KEY (id),
  UNIQUE KEY user_roles_user_id_unique (user_id),
  UNIQUE KEY user_roles_user_id_role_unique (user_id, role),
  KEY user_roles_role_idx (role),
  CONSTRAINT user_roles_user_id_fk
    FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicles (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  internal_number VARCHAR(120) NOT NULL,
  plate VARCHAR(40) NOT NULL DEFAULT '',
  model VARCHAR(255) NOT NULL DEFAULT '',
  color VARCHAR(120) NOT NULL DEFAULT '',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  in_yard BOOLEAN NOT NULL DEFAULT FALSE,
  vehicle_type ENUM('Rainha', 'STB', 'Particular') NOT NULL DEFAULT 'Particular',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY vehicles_internal_number_idx (internal_number),
  KEY vehicles_vehicle_type_idx (vehicle_type),
  KEY vehicles_in_yard_idx (in_yard),
  KEY vehicles_status_idx (status)
);

CREATE TABLE IF NOT EXISTS drivers (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  full_name VARCHAR(255) NOT NULL,
  registration VARCHAR(120) NOT NULL,
  photo_url TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY drivers_full_name_idx (full_name),
  KEY drivers_registration_idx (registration),
  KEY drivers_status_idx (status)
);

CREATE TABLE IF NOT EXISTS movements (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  type ENUM('entry', 'exit') NOT NULL,
  date VARCHAR(10) NOT NULL,
  time VARCHAR(8) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  driver_id CHAR(36) NOT NULL,
  identification_status ENUM('automatic', 'manual') NOT NULL DEFAULT 'manual',
  confirmed_by ENUM('camera', 'gate') NOT NULL DEFAULT 'gate',
  image_url TEXT NULL,
  registered_by CHAR(36) NULL,
  registered_by_username VARCHAR(255) NULL,
  registered_by_role VARCHAR(40) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY movements_created_at_idx (created_at),
  KEY movements_date_idx (date),
  KEY movements_type_idx (type),
  KEY movements_vehicle_id_idx (vehicle_id),
  KEY movements_driver_id_idx (driver_id),
  KEY movements_registered_by_idx (registered_by),
  CONSTRAINT movements_vehicle_id_fk
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
  CONSTRAINT movements_driver_id_fk
    FOREIGN KEY (driver_id) REFERENCES drivers (id),
  CONSTRAINT movements_registered_by_fk
    FOREIGN KEY (registered_by) REFERENCES app_users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deletion_logs (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  entity_data JSON NULL,
  deleted_by CHAR(36) NULL,
  deleted_by_username VARCHAR(255) NULL,
  deleted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY deletion_logs_deleted_at_idx (deleted_at),
  KEY deletion_logs_entity_idx (entity_type, entity_id),
  KEY deletion_logs_deleted_by_idx (deleted_by),
  CONSTRAINT deletion_logs_deleted_by_fk
    FOREIGN KEY (deleted_by) REFERENCES app_users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_action_logs (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  action VARCHAR(80) NOT NULL,
  target_user_id CHAR(36) NULL,
  target_username VARCHAR(255) NULL,
  target_role VARCHAR(40) NULL,
  performed_by CHAR(36) NULL,
  performed_by_username VARCHAR(255) NULL,
  performed_by_role VARCHAR(40) NULL,
  details JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY user_action_logs_created_at_idx (created_at),
  KEY user_action_logs_action_idx (action),
  KEY user_action_logs_target_user_id_idx (target_user_id),
  KEY user_action_logs_performed_by_idx (performed_by),
  CONSTRAINT user_action_logs_target_user_id_fk
    FOREIGN KEY (target_user_id) REFERENCES app_users (id) ON DELETE SET NULL,
  CONSTRAINT user_action_logs_performed_by_fk
    FOREIGN KEY (performed_by) REFERENCES app_users (id) ON DELETE SET NULL
);
