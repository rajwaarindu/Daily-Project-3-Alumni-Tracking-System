-- Supabase/PostgreSQL schema for Alumni master data
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public."Alumni" (
  id uuid primary key default gen_random_uuid(),
  nama_lengkap text not null,
  variasi_nama text[] not null default '{}',
  afiliasi_kata_kunci text[] not null default '{}',
  konteks_kata_kunci text[] not null default '{}',
  status_pelacakan text not null default 'Belum Dilacak',
  last_tracked_date date,
  hasil text,
  ppdikti_verified boolean not null default false,
  ppdikti_checked_at timestamptz,
  ppdikti_detail jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alumni_nama_lengkap_not_blank check (length(trim(nama_lengkap)) > 0),
  constraint alumni_status_pelacakan_valid check (
    status_pelacakan in (
      'Belum Dilacak',
      'Teridentifikasi dari sumber publik',
      'Perlu Verifikasi Manual',
      'Tidak Ditemukan'
    )
  )
);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_alumni_set_updated_at on public."Alumni";

create trigger trg_alumni_set_updated_at
before update on public."Alumni"
for each row
execute function public.set_updated_at_timestamp();

create index if not exists idx_alumni_nama_lengkap on public."Alumni" (nama_lengkap);
create index if not exists idx_alumni_status_pelacakan on public."Alumni" (status_pelacakan);

-- Optional for authenticated app access; adjust to your security model.
alter table public."Alumni" enable row level security;

create policy "Authenticated users can read Alumni"
on public."Alumni"
for select
to authenticated
using (true);

create policy "Authenticated users can insert Alumni"
on public."Alumni"
for insert
to authenticated
with check (true);

create policy "Authenticated users can update Alumni"
on public."Alumni"
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete Alumni"
on public."Alumni"
for delete
to authenticated
using (true);
