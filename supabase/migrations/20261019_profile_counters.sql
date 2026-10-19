-- NG Studio: sequências independentes por prefixo de perfil.
-- Executar UMA vez no SQL Editor do Supabase.
-- Não altera os números das ordens já existentes.
create table if not exists public.ng_profile_counters (
  owner_id uuid not null references auth.users(id) on delete cascade,
  prefix text not null check (prefix ~ '^[A-Z]{3}$'),
  last_value bigint not null default 0,
  primary key (owner_id, prefix)
);
alter table public.ng_profile_counters enable row level security;
-- Sem políticas de acesso direto: somente a função autenticada abaixo modifica contadores.

create or replace function public.ng_next_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_prefix text;
  existing_max bigint;
  next_value bigint;
  result_number text;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária';
  end if;
  safe_prefix := upper(regexp_replace(
    translate(coalesce(p_prefix, ''), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
              'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'),
    '[^A-Za-z]', '', 'g'
  ));
  if safe_prefix !~ '^[A-Z]{3}$' then
    raise exception 'Prefixo deve ter exatamente três letras';
  end if;

  -- Ignora a numeração legada (ex.: FEL-1473), preservando-a.
  -- Respeita números já existentes na nova sequência (ex.: FEL-01).
  select coalesce(max(substring(number from '[0-9]+$')::bigint), 0)
    into existing_max
  from public.ng_orders
  where owner_id = auth.uid()
    and number ~ ('^' || safe_prefix || '-[0-9]{1,3}$');

  insert into public.ng_profile_counters(owner_id, prefix, last_value)
    values(auth.uid(), safe_prefix, existing_max + 1)
  on conflict(owner_id, prefix) do update
    set last_value = greatest(
      public.ng_profile_counters.last_value,
      existing_max
    ) + 1
  returning last_value into next_value;

  result_number := safe_prefix || '-' || lpad(next_value::text, 2, '0');
  return result_number;
end;
$$;
revoke all on function public.ng_next_number(text) from public;
grant execute on function public.ng_next_number(text) to authenticated;
