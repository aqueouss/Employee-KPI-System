-- Extensions and enums

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE task_status AS ENUM ('pending', 'completed');
CREATE TYPE kpi_flag AS ENUM ('green', 'yellow', 'red', 'no_tasks');
CREATE TYPE termination_status AS ENUM ('none', 'eligible', 'under_review', 'resolved');
CREATE TYPE warning_status AS ENUM ('active', 'acknowledged');
CREATE TYPE reward_status AS ENUM ('eligible', 'issued', 'declined');
CREATE TYPE review_status AS ENUM ('eligible', 'under_review', 'resolved');
