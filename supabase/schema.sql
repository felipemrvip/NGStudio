-- NG STUDIO — banco do sistema. Execute no SQL Editor do Supabase.
-- Antes: habilite Email Auth, crie UM usuário da empresa e desabilite novos cadastros públicos.
-- Nunca coloque a chave service_role em arquivos do site.
create extension if not exists pgcrypto;

create table if not exists public.ng_orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number text not null,
  title text not null,
  client_name text not null,
  client_phone text not null default '',
  attendant text not null default '',
  stage text not null default 'analise' check(stage in ('analise','andamento','producao','pronto','entregue')),
  method text not null default 'PIX',
  total numeric(14,2) not null default 0 check(total>=0),
  due_date date,
  delivered_at timestamptz,
  notes text not null default '',
  items jsonb not null default '[]'::jsonb,
  payments jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint ng_orders_unique_number unique(owner_id,number)
);
create index if not exists ng_orders_owner_created on public.ng_orders(owner_id,created_at desc);
create index if not exists ng_orders_owner_stage on public.ng_orders(owner_id,stage);

create table if not exists public.ng_clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ng_clients_owner_name on public.ng_clients(owner_id,name);

create table if not exists public.ng_settings (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  company text not null default 'NG PrintSign Gráfica',
  "legalName" text not null default '',
  cnpj text not null default '',
  phone text not null default '',
  address text not null default '',
  instagram text not null default '',
  prefix text not null default 'FEL',
  attendants text not null default 'FELIPE',
  footer text not null default ''
);

alter table public.ng_orders enable row level security;
alter table public.ng_clients enable row level security;
alter table public.ng_settings enable row level security;

create policy "orders_read_own" on public.ng_orders for select to authenticated using(owner_id=auth.uid());
create policy "orders_insert_own" on public.ng_orders for insert to authenticated with check(owner_id=auth.uid());
create policy "orders_update_own" on public.ng_orders for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "orders_delete_own" on public.ng_orders for delete to authenticated using(owner_id=auth.uid());
create policy "clients_read_own" on public.ng_clients for select to authenticated using(owner_id=auth.uid());
create policy "clients_insert_own" on public.ng_clients for insert to authenticated with check(owner_id=auth.uid());
create policy "clients_update_own" on public.ng_clients for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "settings_read_own" on public.ng_settings for select to authenticated using(owner_id=auth.uid());
create policy "settings_insert_own" on public.ng_settings for insert to authenticated with check(owner_id=auth.uid());
create policy "settings_update_own" on public.ng_settings for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ng-anexos','ng-anexos',false,12582912,ARRAY['image/png','image/jpeg','image/webp'])
on conflict(id) do nothing;

-- Anexos privados na pasta do UID autenticado: <uid>/<os_id>/<arquivo>.
create policy "ng_storage_read" on storage.objects for select to authenticated
using(bucket_id='ng-anexos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "ng_storage_upload" on storage.objects for insert to authenticated
with check(bucket_id='ng-anexos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "ng_storage_delete" on storage.objects for delete to authenticated
using(bucket_id='ng-anexos' and (storage.foldername(name))[1]=(select auth.uid()::text));

-- Numeração atômica, segura para múltiplos computadores criando OS simultaneamente.
create table if not exists public.ng_counters (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  last_value bigint not null default 1472
);
alter table public.ng_counters enable row level security;
-- A função usa security definer, mas SEMPRE deriva o usuário do JWT autenticado.
create or replace function public.ng_next_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  value_out bigint;
  safe_prefix text;
  existing_max bigint;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  safe_prefix := upper(regexp_replace(coalesce(p_prefix,'FEL'),'[^A-Za-z0-9_-]','','g'));
  if safe_prefix='' or length(safe_prefix)>12 then raise exception 'Prefixo inválido'; end if;
  select coalesce(max(substring(number from '([0-9]+)$')::bigint),0)
  into existing_max from public.ng_orders
  where owner_id=auth.uid() and number like safe_prefix||'-%' and number ~ '-[0-9]+$';
  insert into public.ng_counters(owner_id,last_value)
  values(auth.uid(),greatest(existing_max,1472)+1)
  on conflict(owner_id) do update
     set last_value=greatest(public.ng_counters.last_value,existing_max)+1
  returning last_value into value_out;
  return safe_prefix||'-'||value_out::text;
end;
$$;
revoke all on function public.ng_next_number(text) from public;
grant execute on function public.ng_next_number(text) to authenticated;
