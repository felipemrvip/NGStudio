import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as logic from '../assets/logic.mjs';

const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end);}
test('nova navegação mantém todas as páginas e os controles de perfil e celular',()=>{
 const state={page:'ordens',profile:'Felipe <Teste>',sidebarCollapsed:false,mobileMenuOpen:false};
 const ctx=vm.createContext({...logic,state,ico:()=>''});
 vm.runInContext(extract('navItem')+'\n'+extract('nav'),ctx);
 for(const collapsed of [false,true]){
  state.sidebarCollapsed=collapsed;
  const html=ctx.nav();
  for(const id of ['dashboard','geral','ordens','producao','clientes','financeiro','historico','equipe','configuracoes'])assert.ok(html.includes(`data-nav="${id}"`));
  for(const action of ['data-switch-profile','data-collapse-sidebar','data-mobile-more','data-new'])assert.ok(html.includes(action));
  assert.ok(html.includes('Felipe &lt;Teste&gt;'));
  assert.ok(!html.includes('Felipe <Teste>'));
 }
});
test('novo dashboard preserva indicadores, dados individuais e visão geral',()=>{
 const orders=[{id:'felipe',attendant:'FELIPE',stage:'producao',total:300,payments:[],created_at:'2026-10-01'}, {id:'maria',attendant:'MARIA',stage:'pronto',total:500,payments:[],created_at:'2026-10-02'}];
 const state={profile:'FELIPE',orders};
 const ctx=vm.createContext({...logic,state,ico:()=>'',filteredOrders:o=>o,profileOrders:()=>orders.filter(o=>o.attendant==='FELIPE'),revenuePanel:()=>'',chartMarkup:()=>'',dashboardStatus:()=>'',dashboardActivity:()=>'',ordersTable:os=>os.map(o=>`<span data-test-order="${o.id}"></span>`).join('')});
 vm.runInContext(extract('kpi')+'\n'+extract('dashboard'),ctx);
 const personal=ctx.dashboard(true),general=ctx.dashboard(false);
 assert.ok(personal.includes('data-test-order="felipe"'));
 assert.ok(!personal.includes('data-test-order="maria"'));
 assert.ok(general.includes('data-test-order="maria"'));
 assert.equal((personal.match(/data-dashboard-action=/g)||[]).length,5);
 for(const action of ['active','production','ready','receivable','received'])assert.ok(personal.includes(`data-dashboard-action="${action}"`));
 assert.ok(personal.includes('data-nav="dashboard" aria-pressed="true"'));
 assert.ok(general.includes('data-nav="geral" aria-pressed="true"'));
 assert.ok(!personal.includes('Precisa de atenção'));
});
