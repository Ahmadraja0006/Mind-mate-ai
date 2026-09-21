CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('elderly','caregiver','admin')),
  age INTEGER CHECK (age IS NULL OR age BETWEEN 1 AND 120),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caregiver_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','rejected','revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (caregiver_id, elderly_id)
);

ALTER TABLE caregiver_links ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE caregiver_links ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE caregiver_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE caregiver_links SET status='active' WHERE status IS NULL;
UPDATE caregiver_links SET id=gen_random_uuid() WHERE id IS NULL;
ALTER TABLE caregiver_links ALTER COLUMN id SET NOT NULL;
ALTER TABLE caregiver_links ALTER COLUMN status SET NOT NULL;
ALTER TABLE caregiver_links ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE caregiver_links ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE caregiver_links ALTER COLUMN updated_at SET DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS idx_caregiver_links_id ON caregiver_links(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_caregiver_links_pending ON caregiver_links(caregiver_id, elderly_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_caregiver_links_elderly_status ON caregiver_links(elderly_id, status);

CREATE TABLE IF NOT EXISTS caregiver_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caregiver_invites_lookup ON caregiver_invites(code_hash);
CREATE INDEX IF NOT EXISTS idx_caregiver_invites_owner ON caregiver_invites(elderly_id, created_at DESC);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_key VARCHAR(40) NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  accuracy INTEGER NOT NULL CHECK (accuracy BETWEEN 0 AND 100),
  response_time NUMERIC(10,2) NOT NULL DEFAULT 0,
  difficulty_before INTEGER NOT NULL CHECK (difficulty_before BETWEEN 1 AND 4),
  difficulty_after INTEGER NOT NULL CHECK (difficulty_after BETWEEN 1 AND 4),
  total_questions INTEGER NOT NULL DEFAULT 1,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  client_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  reminder_time VARCHAR(50) NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_date ON game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_name VARCHAR(180) NOT NULL,
  clinic VARCHAR(180) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_elderly_date ON appointments(elderly_id, appointment_date, appointment_time);
