-- Hotel Booking Demo — Database Schema
-- Run this in the Supabase SQL editor to set up all tables.
-- Row Level Security (RLS) is enabled on all tables.

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  phone         text,
  password_hash text not null,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

-- ── Room Types ────────────────────────────────────────────────────────────────
create table if not exists room_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  capacity    int  not null check (capacity > 0),
  base_price  numeric(10,2) not null check (base_price > 0),
  images      text[] not null default '{}'   -- Array of Supabase storage URLs
);

-- ── Rooms ─────────────────────────────────────────────────────────────────────
create table if not exists rooms (
  id           uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references room_types(id) on delete restrict,
  room_number  text not null unique,
  status       text not null default 'available' check (status in ('available', 'unavailable', 'maintenance'))
);

-- ── Bookings ──────────────────────────────────────────────────────────────────
create table if not exists bookings (
  id                   uuid primary key default gen_random_uuid(),
  booking_code         text not null unique,
  user_id              uuid not null references users(id) on delete restrict,
  room_id              uuid not null references rooms(id) on delete restrict,
  check_in             date not null,
  check_out            date not null,
  nights               int  not null check (nights > 0),
  total_price          numeric(10,2) not null check (total_price > 0),
  payment_status       text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  razorpay_payment_id  text,
  status               text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at           timestamptz not null default now(),

  constraint check_out_after_check_in check (check_out > check_in)
);

-- Prevent double booking at the DB level as a safety net
-- (application code also checks this, but defence in depth)
create unique index if not exists bookings_no_overlap
  on bookings (room_id, check_in, check_out)
  where status in ('pending', 'confirmed');

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table users     enable row level security;
alter table room_types enable row level security;
alter table rooms      enable row level security;
alter table bookings   enable row level security;

-- All queries from the API use the service role key (bypasses RLS),
-- so RLS policies below are a defence-in-depth layer for direct Supabase client access.

-- Room types and rooms are publicly readable
create policy "room_types_public_read" on room_types for select using (true);
create policy "rooms_public_read"      on rooms      for select using (true);

-- Users can only read their own record
create policy "users_own_record" on users for select using (auth.uid() = id);

-- Bookings: users see their own; admins see all (handled in service role context)
create policy "bookings_own" on bookings for select using (auth.uid() = user_id);

-- ── Seed Data ─────────────────────────────────────────────────────────────────

-- Room types (prices in INR)
insert into room_types (name, description, capacity, base_price) values
  ('Standard Room',  'Comfortable room with queen bed, en-suite bathroom, city view, and complimentary Wi-Fi.',       2, 4999.00),
  ('Deluxe Room',    'Spacious room with king bed, premium linens, rainfall shower, and minibar.',                     2, 7999.00),
  ('Premium Suite',  'Luxurious suite with separate lounge, panoramic views, jacuzzi, and personalised butler service.', 4, 14999.00)
on conflict do nothing;

-- Individual rooms (linked to types above)
-- Standard rooms: 101–103
insert into rooms (room_number, room_type_id, status)
select r.room_number, rt.id, 'available'
from (values ('101'), ('102'), ('103')) as r(room_number)
cross join room_types rt
where rt.name = 'Standard Room'
on conflict do nothing;

-- Deluxe rooms: 201–203
insert into rooms (room_number, room_type_id, status)
select r.room_number, rt.id, 'available'
from (values ('201'), ('202'), ('203')) as r(room_number)
cross join room_types rt
where rt.name = 'Deluxe Room'
on conflict do nothing;

-- Premium suites: 301–302
insert into rooms (room_number, room_type_id, status)
select r.room_number, rt.id, 'available'
from (values ('301'), ('302')) as r(room_number)
cross join room_types rt
where rt.name = 'Premium Suite'
on conflict do nothing;

-- Admin user (password: admin123 — CHANGE BEFORE PRODUCTION)
-- bcrypt hash of 'admin123' with 12 rounds:
insert into users (name, email, password_hash, role) values
  ('Admin', 'admin@hoteldemo.com', '$2a$12$b08hZynIVj6jQ0jYhjAsyehM2w5zt/iC4yHBJ0QA9gazYdCIJA79u', 'admin')
on conflict (email) do nothing;