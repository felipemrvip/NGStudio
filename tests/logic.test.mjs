import test from 'node:test';
import assert from 'node:assert/strict';
import {paid,remaining,paymentStatus,money,esc,nextNumber,stats,stageLabel,monthlyRevenue,revenueYears,monthlyPerformance} from '../assets/logic.mjs';
const order={number:'FEL-1473',total:800,stage:'andamento',payments:[{amount:400,date:new Date().toISOString()}]};
test('sinal e restante conferem',()=>{assert.equal(paid(order),400);assert.equal(remaining(order),400);assert.equal(paymentStatus(order),'Sinal');});
test('sinal total = pago',()=>{assert.equal(paymentStatus({...order,payments:[{amount:800}]}),'Pago');assert.equal(remaining({...order,payments:[{amount:800}]}),0);});
test('nenhuma cobrança',()=>{assert.equal(paymentStatus({...order,total:0,payments:[]}), 'Sem cobrança');});
test('formatação brasileira',()=>assert.equal(money(1234.5),'R$ 1.234,50'));
test('sanitiza conteúdo do cliente',()=>assert.equal(esc('<img src=x onerror="oops">'),'&lt;img src=x onerror=&quot;oops&quot;&gt;'));
test('ID sequencial após FEL-1473',()=>assert.equal(nextNumber([order],'FEL'),'FEL-1474'));
test('indicadores não tratam entregue como OS ativa',()=>{const s=stats([order,{...order,stage:'entregue'}]);assert.equal(s.active,1);assert.equal(s.receivable,800);assert.equal(s.production,0);});
test('status mantém nomenclatura Notion',()=>assert.equal(stageLabel('andamento'),'Em andamento'));

test('painel mensal separa OS criadas e pagamentos recebidos em meses diferentes',()=>{
 const orders=[
  {number:'FEL-01',stage:'andamento',total:300,created_at:'2026-01-08T13:00:00',payments:[{amount:100,date:'2026-01-08T14:00:00'},{amount:200,date:'2026-02-05T14:00:00'}]},
  {number:'FEL-02',stage:'entregue',total:250,created_at:'2026-02-10T13:00:00',payments:[{amount:50,date:'2026-02-10T14:00:00'}]}
 ];
 const data=monthlyRevenue(orders,2026);
 assert.equal(data.length,12);
 assert.deepEqual([data[0].orders,data[0].billed,data[0].received,data[0].outstanding],[1,300,100,0]);
 assert.deepEqual([data[1].orders,data[1].billed,data[1].received,data[1].outstanding],[1,250,250,200]);
 assert.equal(data[2].billed,0);
 assert.deepEqual(revenueYears(orders,2026),[2026]);
});
test('dashboard conta pagamentos recebidos de OS antigas no mês correto',()=>{
 const order={number:'MAR-01',stage:'pronto',total:900,created_at:'2025-12-01',payments:[{amount:300,date:'2026-03-02'}]};
 const mar=monthlyRevenue([order],2026)[2];
 assert.equal(mar.billed,0);
 assert.equal(mar.orders,0);
 assert.equal(mar.received,300);
 assert.equal(mar.outstanding,0);
 assert.deepEqual(revenueYears([order],2026),[2026,2025]);
});

test('painel de mês selecionado separa criação, entrega e recebimento',()=>{
 const orders=[
 {id:'a',stage:'entregue',created_at:'2026-08-03T12:00:00',delivered_at:'2026-09-05T12:00:00',total:300,payments:[{date:'2026-09-04T12:00:00',amount:100}]},
 {id:'b',stage:'producao',created_at:'2026-09-07T12:00:00',total:450,payments:[{date:'2026-09-07T12:00:00',amount:200}]},
 {id:'c',stage:'pronto',created_at:'2026-09-15T12:00:00',total:200,payments:[]}
 ];
 const report=monthlyPerformance(orders,2026,8);
 assert.equal(report.orders,2);
 assert.equal(report.delivered,1);
 assert.equal(report.billed,650);
 assert.equal(report.received,300);
 assert.equal(report.outstanding,450);
 assert.equal(report.stages.producao,1);
 assert.equal(report.stages.pronto,1);
 assert.equal(report.stages.entregue,0);
 assert.equal(report.averageTicket,325);
 assert.equal(report.ordersCreated.length,2);
});
