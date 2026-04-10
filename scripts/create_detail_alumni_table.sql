-- Supabase/PostgreSQL schema for PPDIKTI flow used by Ppdikti.jsx and AppContext.jsx
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public."detail-alumni" (
  id uuid primary key default gen_random_uuid(),
  nama_lengkap text not null,
  variasi_nama text[] not null default '{}',
  afiliasi_kata_kunci text[] not null default '{}',
  konteks_kata_kunci text[] not null default '{}',

  status_pelacakan text not null default 'Belum Dilacak',
  last_tracked_date date,
  hasil jsonb,

  -- Fields used by PPDIKTI verification flow
  ppdikti_verified boolean not null default false,
  ppdikti_checked_at timestamptz,
  ppdikti_detail jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint detail_alumni_nama_not_blank check (length(trim(nama_lengkap)) > 0),
  constraint detail_alumni_status_valid check (
    status_pelacakan in (
      'Belum Dilacak',
      'Teridentifikasi dari sumber publik',
      'Perlu Verifikasi Manual',
      'Tidak Ditemukan di Sumber Publik',
      'Tidak Ditemukan'
    )
  )
);

create index if not exists idx_detail_alumni_nama on public."detail-alumni" (nama_lengkap);
create index if not exists idx_detail_alumni_status on public."detail-alumni" (status_pelacakan);
create index if not exists idx_detail_alumni_ppdikti_verified on public."detail-alumni" (ppdikti_verified);
create index if not exists idx_detail_alumni_created_at on public."detail-alumni" (created_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_detail_alumni_set_updated_at on public."detail-alumni";

create trigger trg_detail_alumni_set_updated_at
before update on public."detail-alumni"
for each row
execute function public.set_updated_at_timestamp();

alter table public."detail-alumni" enable row level security;

create policy "Authenticated users can read detail-alumni"
on public."detail-alumni"
for select
to authenticated
using (true);

create policy "Authenticated users can insert detail-alumni"
on public."detail-alumni"
for insert
to authenticated
with check (true);

create policy "Authenticated users can update detail-alumni"
on public."detail-alumni"
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete detail-alumni"
on public."detail-alumni"
for delete
to authenticated
using (true);
