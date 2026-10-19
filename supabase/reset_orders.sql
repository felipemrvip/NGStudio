-- NG Studio — reiniciar ordens de serviço e numeração.
-- ATENÇÃO: apaga permanentemente todas as ordens de serviço
-- de todos os usuários deste projeto e seus pagamentos embutidos.
-- Preserva clientes, configurações e contas de acesso.
begin;
delete from public.ng_orders;
delete from public.ng_profile_counters;
delete from public.ng_counters;
commit;
-- Verificação: ambos devem retornar 0.
select (select count(*) from public.ng_orders) as ordens,
       (select count(*) from public.ng_profile_counters) as contadores_por_perfil;
