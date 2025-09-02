-- Initialize Budget Invest Development Database
-- This script sets up the basic database structure for development

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS budget_invest;

-- Set timezone
SET timezone = 'UTC';

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic tables structure will be handled by the application's migration system
-- This file serves as a placeholder for any additional setup needed

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE budget_invest TO budget_invest;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO budget_invest;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO budget_invest;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO budget_invest;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO budget_invest;

-- Insert development notice
CREATE TABLE IF NOT EXISTS dev_info (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO dev_info (message) VALUES 
('Budget Invest Development Database Initialized'),
('Database ready for development use');