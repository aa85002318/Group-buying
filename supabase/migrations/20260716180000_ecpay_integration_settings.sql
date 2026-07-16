-- ECPay payment + logistics integration settings (admin-managed)
create table if not exists public.ecpay_integration_settings (
  singleton_key text primary key default 'main',
  -- payment
  payment_enabled boolean not null default false,
  environment text not null default 'stage' check (environment in ('stage', 'production')),
  merchant_id text not null default '',
  hash_key text not null default '',
  hash_iv text not null default '',
  credit_card_enabled boolean not null default true,
  atm_enabled boolean not null default false,
  cvs_payment_enabled boolean not null default false,
  -- logistics
  logistics_enabled boolean not null default false,
  home_delivery_enabled boolean not null default false,
  cvs_pickup_enabled boolean not null default false,
  sender_name text not null default '',
  sender_phone text not null default '',
  sender_address text not null default '',
  logistics_merchant_id text not null default '',
  -- notes
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ecpay_integration_settings enable row level security;

insert into public.ecpay_integration_settings (singleton_key)
values ('main')
on conflict (singleton_key) do nothing;
