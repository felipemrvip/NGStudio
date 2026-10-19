-- NG Studio: descontinuar o status "Análise".
-- Preserva todas as ordens existentes, alterando apenas o status antigo.
begin;

update public.ng_orders
set stage = 'andamento'
where stage = 'analise';

alter table public.ng_orders
  alter column stage set default 'andamento';

alter table public.ng_orders
  drop constraint if exists ng_orders_stage_check;

alter table public.ng_orders
  add constraint ng_orders_stage_check
  check (stage in ('andamento','producao','pronto','entregue'));

commit;
