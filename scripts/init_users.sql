-- scripts/init_users.sql
-- Database seed script with predefined users
-- Requires PostgreSQL with the pgcrypto extension available

-- Enable pgcrypto (provides gen_random_uuid and crypt functions)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert predefined users (passwords will be bcrypt-hashed using crypt(..., gen_salt('bf')) )
-- Passwords:
--  - alice   -> password1
--  - bob     -> password2

INSERT INTO users (id, username, "passwordHash", "firstName", "lastName", "birthDate", alias, "avatarUrl", "createdAt")
VALUES
  (gen_random_uuid(), 'alice', crypt('password1', gen_salt('bf', 10)), 'Alice', 'Admin', '1990-01-01', 'alice', NULL, now()),
  (gen_random_uuid(), 'bob',   crypt('password2', gen_salt('bf', 10)), 'Bob',   'Tester', '1992-06-15', 'bobby', NULL, now());

-- Add more users as needed by duplicating the INSERT row above.

-- Usage (example):
-- psql -h localhost -U postgres -d mydb -f scripts/init_users.sql
