import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as logic from '../assets/logic.mjs';
const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'(');const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end);}
test('lista combina atendente, etapa e pagamento sem perder filtros ao paginar',()=>{
 const state={ordersPerPage:10,ordersPage:1,orderScope:'profile',profile:'FELIPE',actionFilter:'receivable',paymentFilter:'Sinal',filter:'producao'};
 const orders=[{id:'a',attendant:'FELIPE',stage:'producao',total:100,payments:[{amount:20}]},{id:'b',attendant:'MARIA',stage:'producao',total:100,payments:[{amount:20}]},{id:'c',attendant:'FELIPE',stage:'entregue',total:100,payments:[{amount:20}]},{id:'d',attendant:'FELIPE',stage:'producao',total:100,payments:[]}];
 let shown;
 const context=vm.createContext({...logic,state,ordered:()=>orders,ico:()=>'',ordersTable:rows=>{shown=rows;return '';}});
 vm.runInContext(extract('ordersPage')+'\nordersPage()',context);
 assert.deepEqual(shown.map(o=>o.id),['a']);
 assert.equal(state.actionFilter,'receivable');
 assert.equal(state.orderScope,'profile');
});
test('badge distingue sinal de pendente e KPI é botão acessível',()=>{
 const context=vm.createContext({...logic,ico:()=>''});
 vm.runInContext(extract('paymentBadge')+'\n'+extract('kpi'),context);
 assert.match(context.paymentBadge({total:100,payments:[{amount:20}]}),/partial.*Sinal/);
 assert.match(context.paymentBadge({total:100,payments:[]}),/pending.*Pendente/);
 assert.match(context.kpi('Ativas',2,'file','blue','Serviços','active'),/<button.*data-dashboard-action="active".*aria-label=/);
});
