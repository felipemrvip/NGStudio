import {STAGES,defaultSettings,money,paid,remaining,paymentStatus,stageLabel,fmtDate,currentMonth,esc,uid,nextNumber,stats} from './logic.mjs';
import {seedDemo} from './demo.js';
import {buildPrintHtml} from './print.js';
import {downloadOrderPdf,printOrderDocument} from './pdf.js';
import * as cloud from './supabase.js';

const ICONS={
 home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22v-8h6v8"/>',
 file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
 layers:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 chart:'<path d="M3 3v18h18M7 17v-5M12 17V7M17 17v-9"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34l-.08.04a1.7 1.7 0 0 0-1 1.54V21h-4v-.08a1.7 1.7 0 0 0-1-1.54l-.08-.04a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15l-.04-.08a1.7 1.7 0 0 0-1.54-1H3v-4h.08a1.7 1.7 0 0 0 1.54-1l.04-.08A1.7 1.7 0 0 0 4.32 7l-.06-.06 2.83-2.83.06.06a1.7 1.7 0 0 0 1.88.34l.08-.04a1.7 1.7 0 0 0 1-1.54V3h4v.08a1.7 1.7 0 0 0 1 1.54l.08.04a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88l.04.08a1.7 1.7 0 0 0 1.54 1H21v4h-.08a1.7 1.7 0 0 0-1.54 1z"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 wallet:'<path d="M20 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM3 11h19M3 7V5a2 2 0 0 1 2-2h13"/><path d="M17 16h1"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
 filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
 close:'<path d="M18 6 6 18M6 6l12 12"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
 edit:'<path d="m16 5 3 3M4 20l4-1 12-12-3-3L5 16l-1 4Z"/>',
 printer:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6zM18 12h.01"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/>',
 grip:'<circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>',
 more:'<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
 dollar:'<path d="M12 2v20M17 6H9a4 4 0 1 0 0 8h6a4 4 0 0 1 0 8H7"/>',
 alert:'<path d="M12 2 1 21h22L12 2ZM12 9v4m0 4h.01"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>',
 panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'
};
function ico(name){return `<svg class="ico" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ICONS[name]||ICONS.info}</svg>`;}
const $=s=>document.querySelector(s);
const DEMO_KEY='ngstudio_demo_v1';
const PROFILE_KEY='ngstudio_selected_profile_v1';
const SIDEBAR_KEY='ngstudio_sidebar_v1';
function sidebarPrefs(){try{return JSON.parse(localStorage.getItem(SIDEBAR_KEY)||'null')||{};}catch{return {};}}
const storedSidebar=sidebarPrefs();
function persistSidebar(){try{localStorage.setItem(SIDEBAR_KEY,JSON.stringify({collapsed:state.sidebarCollapsed,groups:state.sidebarGroups}));}catch{}}
function team(){return [...new Set(String(state.settings.attendants||'').split(',').map(n=>n.trim()).filter(Boolean))];}
function selectedName(){return team().find(n=>n===state.profile)||null;}
function profileOrders(){return state.orders.filter(o=>String(o.attendant||'').trim().toLocaleLowerCase('pt-BR')===String(state.profile||'').toLocaleLowerCase('pt-BR'));}
function chooseProfile(name){if(!team().includes(name))return;state.profile=name;localStorage.setItem(PROFILE_KEY,name);render();}
function profileScreen(){const root=$('#app');root.innerHTML=`<div class="profile-screen"><section class="profile-panel"><div class="logo-word">N<span>G</span> Studio</div><h1>Quem está trabalhando?</h1><p>Escolha seu perfil para abrir seu dashboard individual.</p><div class="profile-grid">${team().map(n=>`<button class="profile-choice" data-choose-profile="${esc(n)}"><span class="profile-avatar">${esc(n.slice(0,2).toUpperCase())}</span><b>${esc(n)}</b></button>`).join('')}</div><p class="caption">Todos os perfis têm o mesmo acesso. A seleção não exige senha individual.</p>${state.mode==='demo'?'<p class="caption">Modo demonstração: perfis e serviços ficam somente neste navegador.</p>':''}<span class="caption">Para cadastrar novos perfis, selecione um nome e abra Equipe.</span></section></div>`;$('#modal-root').innerHTML='';}
function ready(){const saved=localStorage.getItem(PROFILE_KEY);state.profile=team().includes(saved)?saved:null;if(state.profile)render();else profileScreen();}
const state={mode:cloud.isConfigured?'cloud':'demo',page:'dashboard',orders:[],clients:[],settings:{...defaultSettings},search:'',filter:'todos',draft:null,clientDraft:null,loading:false,busy:false,signCache:new Map(),pendingFiles:new Map(),menuOpen:false,profile:null,sidebarCollapsed:storedSidebar.collapsed===true,sidebarGroups:{gerenciamento:true,analises:false,administracao:false,...storedSidebar.groups},mobileMenuOpen:false};
function toast(message,error=false){const root=$('#toast-root');root.innerHTML=`<div class="notify ${error?'err':''}">${esc(message)}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>root.innerHTML='',4400);}
function getDemo(){try{const data=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(data&&Array.isArray(data.orders)&&Array.isArray(data.clients))return data;}catch{}return seedDemo();}
function persistDemo(){try{localStorage.setItem(DEMO_KEY,JSON.stringify({orders:state.orders,clients:state.clients,settings:state.settings}));}catch{toast('Armazenamento local cheio. Reduza as imagens ou conecte o Supabase.',true);}}
async function boot(){if(state.mode==='demo'){const data=getDemo();state.orders=data.orders;state.clients=data.clients;state.settings={...defaultSettings,...(data.settings||{})};ready();return;}try{const sess=await cloud.restoreSession();if(!sess){renderLogin();return;}await loadCloud();}catch(e){toast('Erro ao acessar banco: '+e.message,true);renderLogin();}}
async function loadCloud(){try{const data=await cloud.loadAll();state.orders=data.orders||[];state.clients=data.clients||[];state.settings={...defaultSettings,...(data.settings||{})};ready();}catch(e){toast('Não foi possível carregar: '+e.message,true);if(/Sessão/.test(e.message))renderLogin();else render();}}

const NAV_GROUPS=[
 {id:'gerenciamento',title:'Gerenciamento',icon:'layers',items:[['ordens','file','Ordens de Serviço'],['producao','layers','Produção'],['clientes','users','Clientes']]},
 {id:'analises',title:'Análises e finanças',icon:'chart',items:[['geral','chart','Dashboard Geral'],['financeiro','wallet','Financeiro'],['historico','clock','Histórico']]},
 {id:'administracao',title:'Administração',icon:'settings',items:[['equipe','users','Equipe'],['configuracoes','settings','Configurações']]}
];
function navItem(id,icon,label,mobile=false){
 const selected=state.page===id;
 return `<button type="button" class="navbtn ${mobile?'mobile-menu-link':'sidebar-sub-link'} ${selected?'active':''}" data-nav="${id}" title="${esc(label)}" ${selected?'aria-current="page"':''}>${ico(icon)}<span>${esc(label)}</span></button>`;
}
function nav(){
 const collapsed=state.sidebarCollapsed;
 const sidebarGroups=NAV_GROUPS.map(group=>{
  const open=Boolean(state.sidebarGroups[group.id]);
  const active=group.items.some(([id])=>state.page===id);
  return `<div class="sidebar-group ${open?'is-open':''} ${active?'has-active':''}">
    <button type="button" class="sidebar-group-toggle ${active?'has-active':''}" data-toggle-group="${group.id}" aria-expanded="${open&&!collapsed}" title="${esc(group.title)}">${ico(group.icon)}<span class="sidebar-text">${esc(group.title)}</span>${ico('chevron')}</button>
    <div class="sidebar-group-items" ${open&&!collapsed?'':'hidden'}>${group.items.map(([id,icon,label])=>navItem(id,icon,label)).join('')}</div>
   </div>`;
 }).join('');
 const mobileMenu=NAV_GROUPS.map(group=>`<div class="mobile-menu-category"><span>${esc(group.title)}</span>${group.items.map(([id,icon,label])=>navItem(id,icon,label,true)).join('')}</div>`).join('');
 return `<aside class="sidebar ${collapsed?'is-collapsed':''}" aria-label="Navegação">
  <div class="sidebar-brand-row">
   <div class="logo"><div class="logo-word">N<span>G</span></div><h2>NG Studio</h2><p>NG PrintSign Gráfica</p></div>
   <button type="button" class="sidebar-collapse" data-collapse-sidebar title="${collapsed?'Expandir menu':'Recolher menu'}" aria-label="${collapsed?'Expandir menu':'Recolher menu'}">${ico('panel')}</button>
  </div>
  <nav class="nav-list sidebar-navigation" aria-label="Menu principal">
   ${navItem('dashboard','home','Meu Dashboard')}
   <div class="sidebar-section-caption">ÁREA DE TRABALHO</div>
   ${sidebarGroups}
  </nav>
  <div class="sidebar-bottom">
   <button class="sidebar-create" data-new title="Nova Ordem de Serviço">${ico('plus')}<span>Nova Ordem de Serviço</span></button>
   <button class="sidebar-profile" data-switch-profile title="Trocar perfil"><span class="sidebar-profile-avatar">${esc((state.profile||'NG').slice(0,2).toUpperCase())}</span><span class="sidebar-profile-info"><b>${esc(state.profile||'Selecionar perfil')}</b><small>Trocar perfil</small></span>${ico('chevron')}</button>
  </div>
  <nav class="mobile-quick-nav" aria-label="Navegação rápida">
   ${navItem('dashboard','home','Início',true)}
   ${navItem('ordens','file','Ordens',true)}
   ${navItem('producao','layers','Produção',true)}
   ${navItem('financeiro','wallet','Financeiro',true)}
   <button type="button" class="mobile-more ${state.mobileMenuOpen?'active':''}" data-mobile-more aria-expanded="${state.mobileMenuOpen}">${ico('menu')}<span>Mais</span></button>
  </nav>
  <div class="mobile-menu-overlay ${state.mobileMenuOpen?'is-open':''}" ${state.mobileMenuOpen?'':'hidden'}>
   <div class="mobile-menu-heading"><div><b>NG Studio</b><small>Todas as páginas</small></div><button type="button" class="iconbutton" data-mobile-more aria-label="Fechar menu">${ico('close')}</button></div>
   <nav class="mobile-menu-links" aria-label="Todas as páginas">${navItem('dashboard','home','Meu Dashboard',true)}${mobileMenu}</nav>
   <button class="sidebar-create mobile-create" data-new>${ico('plus')} Nova Ordem de Serviço</button>
  </div>
 </aside>`;
}
function refreshSidebar(){
 const old=$('.sidebar'),shell=$('.shell');
 if(!old||!shell)return;
 old.outerHTML=nav();
 shell.classList.toggle('sidebar-collapsed',state.sidebarCollapsed);
}
function teamPage(){return `<div class="toolbar-line"><div><h2>Funcionários</h2><p>Todos têm acesso às mesmas funcionalidades. Os dashboards são individuais.</p></div></div><section class="panel panel-body"><h3>Cadastrar funcionário</h3><form id="team-form" class="team-form"><input class="input" name="name" placeholder="Nome do funcionário" maxlength="60" required/><button class="btn btn-primary" type="submit">${ico('plus')} Adicionar</button></form><div class="team-list">${team().map(n=>`<div class="team-member"><span class="profile-avatar">${esc(n.slice(0,2).toUpperCase())}</span><b>${esc(n)}</b><small>${profileOrdersFor(n).length} serviço(s)</small><button class="btn btn-sm" data-remove-profile="${esc(n)}" ${team().length<=1?'disabled':''}>Remover</button></div>`).join('')}</div><p class="caption">Remover um perfil não exclui suas ordens de serviço. Reatribua os serviços antes de remover o funcionário.</p></section>`;}
function profileOrdersFor(name){return state.orders.filter(o=>String(o.attendant||'').toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'));}
async function persistTeam(names){const updated={...state.settings,attendants:names.join(', ')};try{const saved=state.mode==='cloud'?await cloud.persistSettings(updated):updated;state.settings={...defaultSettings,...saved};if(state.mode==='demo')persistDemo();if(state.profile&&!team().includes(state.profile)){state.profile=null;localStorage.removeItem(PROFILE_KEY);profileScreen();}else render();return true;}catch(e){toast('Erro ao salvar equipe: '+e.message,true);return false;}}
async function addProfile(raw){const name=String(raw||'').trim().replace(/\\s+/g,' ');if(!name||name.includes(',')||name.length>60){toast('Digite um nome válido, sem vírgulas.',true);return;}if(team().some(n=>n.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){toast('Funcionário já cadastrado.',true);return;}if(await persistTeam([...team(),name]))toast('Funcionário adicionado.');}
async function removeProfile(name){if(team().length<=1)return;if(profileOrdersFor(name).length){toast('Reatribua os serviços deste funcionário antes de removê-lo.',true);return;}if(!window.confirm('Remover o perfil '+name+'?'))return;if(await persistTeam(team().filter(n=>n!==name)))toast('Perfil removido.');}
function pageTitle(){return {geral:['Dashboard Geral','Indicadores de toda a gráfica.'],equipe:['Equipe','Gerencie os perfis de funcionários.'],dashboard:['Meu Dashboard','Seus serviços e indicadores individuais.'],ordens:['Ordens de Serviço','Cadastre, consulte e organize os pedidos da sua gráfica.'],producao:['Produção','Mova os serviços entre as etapas arrastando os cartões.'],clientes:['Clientes','Contatos e histórico de serviços em um único lugar.'],financeiro:['Financeiro','Pagamentos recebidos e valores ainda pendentes.'],historico:['Histórico','Serviços entregues e últimas movimentações.'],configuracoes:['Configurações','Personalize os dados que aparecem nos documentos da NG.']}[state.page];}
function header(){const [title,subtitle]=pageTitle();return `<div class="topbar"><div class="heading"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="tools"><label class="search">${ico('search')}<input id="global-search" aria-label="Buscar OS, cliente ou serviço" placeholder="Buscar OS, cliente ou serviço..." value="${esc(state.search)}"/><span class="shortcut">⌘ K</span></label>${state.mode==='cloud'?`<button class="iconbutton" title="Atualizar dados" data-refresh>${ico('refresh')}</button>`:''}<div class="userchip"><div class="avatar">NG</div><div><b>${esc(state.profile||'Selecionar perfil')}</b><small>${state.mode==='cloud'?'Equipe NG Studio':'Demonstração'}</small></div></div><button class="btn btn-sm" data-switch-profile>Trocar perfil</button>${state.mode==='cloud'?`<button class="iconbutton" title="Sair" data-logout>${ico('logout')}</button>`:''}</div></div>`;}
function render(){if(!state.profile){profileScreen();return;}const root=$('#app');root.innerHTML=`<div class="shell ${state.sidebarCollapsed?'sidebar-collapsed':''}">${nav()}<main class="main ${state.draft?'os-editor-page':''}">${header()}${state.mode==='demo'?`<div class="demo-banner">${ico('alert')} <span><b>MODO DEMONSTRAÇÃO:</b> os dados ficam somente neste navegador. Configure o Supabase antes de cadastrar serviços reais ou compartilhar entre computadores.</span></div>`:''}<div id="view">${state.draft?'':pageView()}</div></main></div>`;renderModal();}
function refreshView(){const view=$('#view');if(view)view.innerHTML=pageView();}
function pageView(){switch(state.page){case 'dashboard':return dashboard(true);case 'geral':return dashboard(false);case 'equipe':return teamPage();case 'ordens':return ordersPage();case 'producao':return kanbanPage();case 'clientes':return clientsPage();case 'financeiro':return financePage();case 'historico':return historyPage();case 'configuracoes':return settingsPage();return dashboard();}}
function kpi(label,value,icon,tone,desc){return `<div class="kpi"><div class="badge-icon ${tone}">${ico(icon)}</div><div class="kpi-label">${label}</div><strong>${esc(value)}</strong><small>${esc(desc)}</small></div>`;}
function recentOrderRows(orders){return orders.map(o=>`<tr data-open-order="${esc(o.id)}"><td class="table-link">${esc(o.number)}</td><td>${esc(o.client_name||'—')}</td><td>${esc(o.title)}</td><td><span class="status ${esc(o.stage)}">${esc(stageLabel(o.stage))}</span></td><td>${money(o.total)}</td><td class="text-green">${money(signalPaid(o))}</td><td class="${remaining(o)>0?'overdue':'text-green'}">${money(remaining(o))}</td><td>${fmtDate(o.created_at)}</td><td>${ico('more')}</td></tr>`).join('');}
function ordersTable(orders,cols='all'){return `<div class="table-scroll"><table class="data-table"><thead><tr><th>ID da OS</th><th>Cliente</th><th>Serviço</th><th>Status</th><th>Valor</th><th>Sinal</th><th>Restante</th><th>Data</th><th></th></tr></thead><tbody>${orders.length?recentOrderRows(orders):`<tr><td colspan="9" style="text-align:center;padding:45px;color:var(--muted)">Nenhuma ordem de serviço encontrada.</td></tr>`}</tbody></table></div>`;}
function filteredOrders(orders=state.orders){const q=state.search.trim().toLowerCase();return orders.filter(o=>!q||[o.number,o.title,o.client_name,o.client_phone,o.attendant].some(x=>String(x||'').toLowerCase().includes(q)));}
function ordered(){return [...filteredOrders()].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));}
function chartMarkup(source=state.orders){const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);days.push(d);}const bars=days.map(d=>{const next=new Date(d);next.setDate(next.getDate()+1);const count=source.filter(o=>new Date(o.created_at)>=d&&new Date(o.created_at)<next).length;const end=source.filter(o=>o.delivered_at&&new Date(o.delivered_at)>=d&&new Date(o.delivered_at)<next).length;return {label:d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),count,end};});const max=Math.max(5,...bars.flatMap(b=>[b.count,b.end]));return `<div class="bars">${bars.map(b=>`<div class="bar-group" title="${b.count} novas OS / ${b.end} entregues"><div class="bar" style="height:${Math.max(2,b.count/max*94)}%"></div><div class="bar gold" style="height:${Math.max(2,b.end/max*94)}%"></div><span class="bar-label">${esc(b.label)}</span></div>`).join('')}</div><div class="chart-legend"><span><i class="dot"></i>Entradas de OS</span><span><i class="dot gold"></i>Entregues</span></div>`;}
function donutMarkup(source=state.orders){const colors={'analise':'#ffcc30','andamento':'#2d7fe8','producao':'#9d57ee','pronto':'#24bf87','entregue':'#91accd'};const total=source.length||1;let start=0;const parts=STAGES.map(s=>{const n=source.filter(o=>o.stage===s.id).length;const from=start;start+=n/total*100;return {stage:s,n,from,to:start,color:colors[s.id]};});const gradient=parts.map(p=>`${p.color} ${p.from}% ${p.to}%`).join(',');return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${gradient||'#26354d 0% 100%'})"><div class="donut-inner"><small>Total</small><strong>${source.length}</strong><span>ordens de serviço</span></div></div><div class="legend">${parts.map(p=>`<div class="legend-row"><i class="dot" style="background:${p.color}"></i><span>${esc(p.stage.label)}</span><strong>${p.n}</strong><small style="color:var(--muted)">${Math.round(p.n/total*100)}%</small></div>`).join('')}</div></div>`;}
function dashboard(individual=false){const viewOrders=individual?profileOrders():state.orders;const s=stats(viewOrders);return `<div class="page-actions"><span class="caption">${individual?'Meu desempenho • '+esc(state.profile):'Visão geral'} • ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</span><div class="push"></div><button class="btn btn-primary" data-new>${ico('plus')} Nova OS</button></div><div class="kpis">${kpi('OS Ativas',s.active,'file','','Exceto serviços entregues')}${kpi('Em Produção',s.production,'settings','','Trabalhos em produção')}${kpi('Prontas para Retirada',s.ready,'check','green','Aguardando cliente')}${kpi('A Receber',money(s.receivable),'wallet','yellow','Saldo das ordens de serviço')}${kpi('Recebido no Mês',money(s.receivedMonth),'chart','purple','Pagamentos deste mês')}</div><section class="grid-main"><div class="panel"><div class="panel-head"><div class="panel-title"><span class="badge-icon yellow">${ico('chart')}</span><div><h3>Fluxo de Produção</h3><p>Entradas e entregas dos últimos 7 dias</p></div></div><span class="caption">Últimos 7 dias</span></div><div class="chart">${chartMarkup(viewOrders)}</div></div><div class="panel"><div class="panel-head"><div class="panel-title"><span class="badge-icon yellow">${ico('layers')}</span><div><h3>Status das OS</h3><p>Distribuição atual das ordens</p></div></div><button data-nav="producao" class="btn btn-sm">Ver detalhes ${ico('arrow')}</button></div>${donutMarkup(viewOrders)}</div></section><section class="panel table-panel"><div class="panel-head"><div class="panel-title"><span class="badge-icon yellow">${ico('file')}</span><div><h3>Serviços recentes</h3><p>Acompanhe as ordens de serviço mais recentes</p></div></div><button data-nav="ordens" class="btn btn-sm">Ver todas ${ico('arrow')}</button></div>${ordersTable([...viewOrders].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,8))}</section>`;}
function ordersPage(){let orders=ordered();if(state.filter!=='todos')orders=orders.filter(o=>o.stage===state.filter);return `<div class="toolbar-line"><div><h2>Todos os serviços</h2><p>${orders.length} ordem(ns) encontrada(s)</p></div><button class="btn btn-primary" data-new>${ico('plus')} Nova Ordem de Serviço</button></div><div class="page-actions"><div class="filter-pills"><button class="filter-pill ${state.filter==='todos'?'active':''}" data-filter="todos">Todos</button>${STAGES.map(s=>`<button class="filter-pill ${state.filter===s.id?'active':''}" data-filter="${s.id}">${esc(s.label)}</button>`).join('')}</div></div><section class="panel table-panel">${ordersTable(orders)}</section>`;}
function kanbanPage(){return `<div class="toolbar-line"><div><h2>Quadro de produção</h2><p>Arraste os cartões entre as etapas ou altere o status na OS.</p></div><button class="btn btn-primary" data-new>${ico('plus')} Nova OS</button></div><div class="kanban">${STAGES.map(s=>{const os=ordered().filter(o=>o.stage===s.id);return `<section class="kan-col" data-stage="${s.id}"><header class="kan-head"><span class="dot" style="background:${s.color}"></span>${esc(s.label)}<strong>${os.length}</strong></header>${os.map(o=>`<article class="kan-card" draggable="true" data-drag-order="${esc(o.id)}" data-open-order="${esc(o.id)}" style="border-left:3px solid ${s.color}"><div class="order-id"><span>${esc(o.number)}</span>${ico('grip')}</div><h4>${esc(o.title)}</h4><p>${esc(o.client_name||'Sem cliente')}</p><footer><span>${money(o.total)}</span><span class="${remaining(o)>0?'overdue':'text-green'}">${money(remaining(o))} resta</span></footer></article>`).join('')||'<div class="caption" style="padding:14px">Sem serviços nesta etapa</div>'}</section>`;}).join('')}</div>`;}
function clientsPage(){let clients=state.clients.filter(c=>!state.search||[c.name,c.phone].some(x=>String(x||'').toLowerCase().includes(state.search.toLowerCase())));return `<div class="toolbar-line"><div><h2>Carteira de clientes</h2><p>${clients.length} cliente(s) cadastrado(s)</p></div><button class="btn btn-primary" data-new-client>${ico('plus')} Novo Cliente</button></div>${clients.length?`<div class="client-grid">${clients.map(c=>{const os=state.orders.filter(o=>o.client_name?.toLowerCase()===c.name?.toLowerCase());return `<article class="client-card" data-client-id="${esc(c.id)}"><div class="client-avatar">${esc(c.name?.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase())}</div><h3>${esc(c.name)}</h3><p>${esc(c.phone||'Sem telefone')}</p><footer>${os.length} serviços • ${money(os.reduce((a,o)=>a+Number(o.total||0),0))} em pedidos</footer></article>`;}).join('')}</div>`:`<div class="list-empty">${ico('users')}<h3>Nenhum cliente encontrado</h3><p>Cadastre um cliente para começar.</p></div>`}`;}
function financePage(){const orders=filteredOrders();const all=orders.filter(o=>o.stage!=='cancelado');const pending=all.filter(o=>remaining(o)>0).sort((a,b)=>remaining(b)-remaining(a));const payments=all.flatMap(o=>(o.payments||[]).map(p=>({...p,order:o}))).sort((a,b)=>new Date(b.date)-new Date(a.date));const received=payments.reduce((x,p)=>x+Number(p.amount),0);return `<div class="toolbar-line"><div><h2>Visão financeira</h2><p>Valores calculados pelos pagamentos registrados nas ordens.</p></div><button class="btn btn-primary" data-new>${ico('plus')} Nova OS</button></div><div class="mini-stat-grid"><div class="mini-stat"><span>Valor total dos pedidos</span><strong>${money(all.reduce((a,o)=>a+Number(o.total),0))}</strong><small>Serviços registrados</small></div><div class="mini-stat"><span>Pagamentos recebidos</span><strong class="text-green">${money(received)}</strong><small>Todos os períodos</small></div><div class="mini-stat"><span>Saldo a receber</span><strong style="color:#ffd458">${money(pending.reduce((a,o)=>a+remaining(o),0))}</strong><small>${pending.length} ordem(ns) com saldo</small></div></div><section class="panel table-panel"><div class="panel-head"><div class="panel-title"><span class="badge-icon yellow">${ico('wallet')}</span><div><h3>Valores a receber</h3><p>Serviços com pagamento pendente, inclusive os entregues</p></div></div></div>${ordersTable(pending)}</section><section class="panel table-panel"><div class="panel-head"><div class="panel-title"><span class="badge-icon green">${ico('check')}</span><div><h3>Histórico de pagamentos</h3><p>Recebimentos registrados em todas as OS</p></div></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Data</th><th>OS</th><th>Cliente</th><th>Forma</th><th>Valor recebido</th></tr></thead><tbody>${payments.length?payments.map(p=>`<tr data-open-order="${esc(p.order.id)}"><td>${fmtDate(p.date)}</td><td>${esc(p.order.number)}</td><td>${esc(p.order.client_name)}</td><td>${esc(p.method||'—')}</td><td class="text-green">${money(p.amount)}</td></tr>`).join(''):'<tr><td colspan="5">Nenhum pagamento registrado.</td></tr>'}</tbody></table></div></section>`;}
function historyPage(){const delivered=ordered().filter(o=>o.stage==='entregue');const entries=filteredOrders().flatMap(o=>(o.history||[]).map(h=>({...h,order:o}))).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,40);return `<div class="toolbar-line"><div><h2>Serviços entregues</h2><p>As OS continuam acessíveis mesmo após a retirada.</p></div></div><section class="panel table-panel"><div class="panel-head"><div class="panel-title"><span class="badge-icon green">${ico('check')}</span><div><h3>Entregas concluídas</h3><p>${delivered.length} serviço(s) entregue(s)</p></div></div></div>${ordersTable(delivered)}</section><section class="panel table-panel"><div class="panel-head"><div class="panel-title"><span class="badge-icon yellow">${ico('clock')}</span><div><h3>Movimentações recentes</h3><p>Registro das operações nas ordens de serviço</p></div></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Data</th><th>OS</th><th>Cliente</th><th>Evento</th></tr></thead><tbody>${entries.map(h=>`<tr data-open-order="${esc(h.order.id)}"><td>${fmtDate(h.date)}</td><td>${esc(h.order.number)}</td><td>${esc(h.order.client_name)}</td><td>${esc(h.action)}</td></tr>`).join('')}</tbody></table></div></section>`;}
function settingsPage(){const s=state.settings;return `<div class="toolbar-line"><div><h2>Identidade da gráfica</h2><p>Estes dados aparecem na nota de serviço em PDF.</p></div></div><section class="panel panel-body"><form id="settings-form" class="settings-form"><div class="form-row"><div class="form-field"><label>Nome de exibição</label><input class="input" name="company" value="${esc(s.company)}" required/></div><div class="form-field"><label>Prefixo das ordens (ex.: FEL)</label><input class="input" name="prefix" value="${esc(s.prefix)}" maxlength="12" required/></div></div><div class="form-row"><div class="form-field"><label>Razão social</label><input class="input" name="legalName" value="${esc(s.legalName)}"/></div><div class="form-field"><label>CNPJ</label><input class="input" name="cnpj" value="${esc(s.cnpj)}"/></div></div><div class="form-row"><div class="form-field"><label>Telefone da loja</label><input class="input" name="phone" value="${esc(s.phone)}"/></div><div class="form-field"><label>Endereço</label><input class="input" name="address" value="${esc(s.address)}"/></div></div><div class="form-row"><div class="form-field"><label>Instagram</label><input class="input" name="instagram" value="${esc(s.instagram)}"/></div><div class="form-field"><label>Atendentes (separados por vírgula)</label><input class="input" name="attendants" value="${esc(s.attendants)}"/></div></div><div class="form-field"><label>Rodapé da nota</label><textarea class="textarea" name="footer">${esc(s.footer)}</textarea></div><div><button class="btn btn-primary" type="submit">${ico('check')} Salvar configurações</button></div></form></section><p class="caption" style="margin-top:12px">A identidade de interface segue o dashboard aprovado. Os documentos são gerados em fundo branco com cabeçalho azul e amarelo.</p>`;}
function renderLogin(message=''){const root=$('#app');root.innerHTML=`<div class="auth-screen"><section class="auth-left"><div class="logo-word">N<span>G</span> <span style="font-size:27px;color:#fff;letter-spacing:-1px">Studio</span></div><div><h1>Seu trabalho.<br><span>Sob controle.</span></h1><p>Ordens de serviço, produção, financeiro e PDFs profissionais, em um espaço criado para a NG PrintSign.</p></div><small style="color:#91a6bf">NG Studio © ${new Date().getFullYear()}</small></section><section class="auth-right"><div class="auth-card"><h2>Acesso da empresa</h2><p>Entre com a conta compartilhada da gráfica.</p><form id="login-form" autocomplete="on"><div class="form-field"><label>E-mail</label><input name="email" class="input" autocomplete="username" type="email" required placeholder="email@empresa.com"/></div><div class="form-field"><label>Senha</label><input name="password" class="input" autocomplete="current-password" type="password" required placeholder="Sua senha"/></div><label style="display:flex;align-items:center;gap:10px;margin:0 0 20px;color:#b6c4d8;font-size:14px;cursor:pointer"><input type="checkbox" name="remember" checked style="width:17px;height:17px;accent-color:#facc33"/> Manter conectado neste dispositivo</label>${message?`<div class="auth-error">${esc(message)}</div>`:''}<button class="btn btn-primary" type="submit">Entrar no NG Studio ${ico('arrow')}</button></form></div></section></div>`;$('#modal-root').innerHTML='';}
function profilePrefix(name){const letters=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z]/g,'').toUpperCase();return (letters.slice(0,3)||'NGS').padEnd(3,'X');}
function makeDraft(order){const prefix=profilePrefix(state.profile||team()[0]);return structuredClone(order||{id:uid(),number:nextNumber(state.orders,prefix),title:'',client_name:'',client_phone:'',attendant:state.profile||team()[0]||'FELIPE',stage:'analise',method:'PIX',total:0,created_at:new Date().toISOString(),due_date:'',delivered_at:null,notes:'',items:[{description:'',quantity:1,unit_price:0}],payments:[],attachments:[],history:[]});}
function openEditor(id){state.pendingFiles.clear();state.draft=makeDraft(id?state.orders.find(o=>o.id===id):null);state.editorPayment={signal:String(Number(signalPaid(state.draft).toFixed(2))),paid:state.draft.total>0&&remaining(state.draft)<=.001};state.clientDraft=null;render();window.scrollTo(0,0);if(state.draft)ensurePreviews(state.draft.attachments);}
function updateDraft(){if(!state.draft)return;const fields=$('#order-form');if(!fields)return;const data=new FormData(fields);for(const key of ['title','client_name','client_phone','attendant','stage','notes'])state.draft[key]=String(data.get(key)||'');state.draft.total=Math.max(0,Number(data.get('total')||0));state.draft.items=[{description:state.draft.title,quantity:1,unit_price:state.draft.total}];}
/** O sinal é o total recebido, exceto quitações automáticas feitas ao marcar "Pago". */
function signalPaid(order){return (order.payments||[]).filter(p=>p.note!=='Quitação automática').reduce((sum,p)=>sum+Number(p.amount||0),0);}
function reconcileSimplePayments(order,signal,isPaid){
 const now=new Date().toISOString();
 const entries=(order.payments||[]).filter(p=>p.note!=='Quitação automática').map(p=>({...p}));
 const before=entries.reduce((sum,p)=>sum+Number(p.amount||0),0);
 let difference=Math.round((signal-before)*100)/100;
 if(difference>0){
  entries.push({id:uid(),amount:difference,method:order.method||'PIX',date:now,note:'Sinal / pagamento recebido'});
 }else if(difference<0){
  let toRemove=-difference;
  for(let i=entries.length-1;i>=0&&toRemove>0;i--){
   const amount=Number(entries[i].amount||0);
   const removed=Math.min(amount,toRemove);
   entries[i].amount=Math.round((amount-removed)*100)/100;
   toRemove=Math.round((toRemove-removed)*100)/100;
   if(entries[i].amount<=0)entries.splice(i,1);
  }
 }
 const settlement=Math.round((Number(order.total||0)-signal)*100)/100;
 if(isPaid&&settlement>0)entries.push({id:uid(),amount:settlement,method:order.method||'PIX',date:now,note:'Quitação automática'});
 return entries;
}
function renderModal(){const root=$('#modal-root');if(state.clientDraft){renderClientModal();return;}if(!state.draft){root.innerHTML='';return;}const view=$('#view');if(!view)return;const oldScroll=window.scrollY;const hadEditor=Boolean($('#order-form'));if(hadEditor){updateDraft();state.editorPayment={signal:$('#initial-payment')?.value||'0',paid:$('[name=payment_state]:checked')?.value==='paid'};}const o=state.draft;const attendants=[...new Set([...team(),o.attendant].filter(Boolean))];const imageRows=(o.attachments||[]).map((a,i)=>`<div class="attach-item" draggable="true" data-img-drag="${esc(a.id)}"><img data-img-preview="${esc(a.id)}" src="${esc(a.dataUrl||state.signCache.get(a.storage_path)||'')}" alt="Referência ${i+1}"/><div class="attach-fields"><div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px">${esc(a.name||'Imagem do serviço')}</b><button type="button" class="iconbutton" data-remove-img="${esc(a.id)}" title="Remover imagem">${ico('trash')}</button></div><input class="input" style="padding:6px 8px;font-size:11px" data-img-caption="${esc(a.id)}" placeholder="Legenda opcional" value="${esc(a.caption||'')}"/><div class="attach-controls"><label class="checklabel"><input type="checkbox" data-img-enabled="${esc(a.id)}" ${a.include_pdf!==false?'checked':''}/> Incluir no PDF</label><select data-img-size="${esc(a.id)}" title="Tamanho no PDF"><option value="small" ${a.size==='small'?'selected':''}>Pequena</option><option value="medium" ${!a.size||a.size==='medium'?'selected':''}>Média</option><option value="large" ${a.size==='large'?'selected':''}>Grande</option></select><button type="button" data-img-rotate="${esc(a.id)}" title="Girar 90°">↻ Girar</button><button type="button" data-img-up="${esc(a.id)}" ${i===0?'disabled':''}>↑</button><button type="button" data-img-down="${esc(a.id)}" ${i===(o.attachments.length-1)?'disabled':''}>↓</button></div></div></div>`).join('');view.innerHTML=`<div class="ng-os-create"><div class="ng-os-page-head"><button type="button" class="ng-os-back" data-close title="Voltar">${ico('arrow')}</button><div class="ng-os-title"><h1>${state.orders.some(x=>x.id===o.id)?'Editar Ordem de Serviço':'Nova Ordem de Serviço'}</h1><p>Preencha os dados e confira o resumo antes de salvar.</p></div><div class="ng-os-number"><span>${ico('file')}</span><div><small>Nº da OS</small><strong>${esc(o.number)}</strong></div></div></div><div class="os-editor-main"><form id="order-form" class="drawer-body os-form"><section class="drawer-section ng-os-card"><div class="ng-os-section-title"><span class="ng-os-section-icon">${ico('users')}</span><div><h3>Cliente</h3><p>Selecione ou cadastre o cliente da ordem de serviço.</p></div><button type="button" class="btn btn-sm" data-new-client>${ico('plus')} Novo cliente</button></div><div class="form-row"><div class="form-field"><label>Cliente *</label><input name="client_name" class="input" list="client-suggestions" required value="${esc(o.client_name)}" placeholder="Nome do cliente"/><datalist id="client-suggestions">${state.clients.map(c=>`<option value="${esc(c.name)}"></option>`).join('')}</datalist></div><div class="form-field"><label>Telefone / WhatsApp</label><input name="client_phone" class="input" value="${esc(o.client_phone||'')}" placeholder="(21) 99999-9999"/></div></div><div class="ng-os-responsible"><div class="form-field"><label>Responsável pelo serviço</label><select name="attendant" class="select">${attendants.map(a=>`<option ${o.attendant===a?'selected':''} value="${esc(a)}">${esc(a)}</option>`).join('')}</select></div></div></section><section class="drawer-section ng-os-card"><div class="ng-os-section-title"><span class="ng-os-section-icon">${ico('layers')}</span><div><h3>Serviço</h3><p>Informe o serviço e os detalhes da produção.</p></div></div><div class="ng-os-service-fields"><div class="form-field"><label>Nome do serviço *</label><input name="title" class="input" required value="${esc(o.title)}" placeholder="Ex.: 20 camisas sublimadas"/></div><div class="form-field"><label>Data de criação da OS</label><input class="input" type="text" value="${fmtDate(o.created_at)}" readonly aria-label="Data de criação da ordem de serviço" title="Preenchida automaticamente ao criar a OS"/></div></div><div class="form-field"><label>Observações / especificações</label><textarea class="textarea" name="notes" placeholder="Tamanho, material, cor, quantidade, detalhes para produção...">${esc(o.notes||'')}</textarea></div><div class="ng-os-stage-select"><div class="form-field"><label>Status</label><select name="stage" class="select">${STAGES.map(s=>`<option value="${s.id}" ${o.stage===s.id?'selected':''}>${esc(s.label)}</option>`).join('')}</select></div></div></section><section class="drawer-section ng-os-card"><div class="ng-os-section-title"><span class="ng-os-section-icon payment">${ico('dollar')}</span><div><h3>Pagamento</h3><p>Defina os valores e a situação do pagamento.</p></div></div><div class="payment-simple-grid"><div class="form-field"><label for="order-total">Valor total (R$)</label><input id="order-total" name="total" type="number" min="0" step="0.01" class="input" value="${Number(o.total||0)}"/></div><div class="form-field"><label for="initial-payment">Sinal (R$)</label><input id="initial-payment" type="number" min="0" step="0.01" class="input" value="${esc(state.editorPayment?.signal??Number(signalPaid(o).toFixed(2)))}" placeholder="0,00"/></div><div class="form-field"><label>Restante (automático)</label><div class="payment-remaining" id="remaining-live" aria-live="polite">${money(remaining(o))}</div></div></div><div class="payment-status-group"><span class="payment-status-title">Situação do pagamento</span><div class="payment-choices"><label class="payment-choice"><input type="radio" name="payment_state" value="pending" ${!(state.editorPayment?.paid??(o.total>0&&remaining(o)<=.001))?'checked':''}/><span>Falta pagar</span></label><label class="payment-choice"><input type="radio" name="payment_state" value="paid" ${(state.editorPayment?.paid??(o.total>0&&remaining(o)<=.001))?'checked':''}/><span>Pago</span></label></div></div></section><section class="drawer-section ng-os-card"><div class="ng-os-section-title"><span class="ng-os-section-icon attachment">${ico('image')}</span><div><h3>Imagens e prints do serviço</h3><p>Adicione fotos e referências da produção.</p></div></div><input id="image-picker" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden"/><button type="button" class="dropzone" data-pick-images>${ico('upload')}<b>Selecionar imagens ou colar print</b><p style="font-size:11px;margin-bottom:0">⌘V / Ctrl+V para colar · Arraste as imagens para reorganizar</p></button><div id="attachments-list" style="display:grid;gap:8px">${imageRows||'<span class="caption">Nenhuma imagem anexada.</span>'}</div></section></form><aside class="ng-os-summary"><div class="ng-os-summary-header"><span class="ng-os-summary-emblem">${ico('file')}</span><div><h2>Resumo da OS</h2><p>Confira as informações antes de salvar.</p></div></div><div class="ng-os-summary-pills"><div><small>Nº da OS</small><strong>${esc(o.number)}</strong></div><div><small>Data de criação</small><strong>${fmtDate(o.created_at)}</strong></div></div><div class="ng-os-summary-info"><div><span>Cliente</span><strong id="os-summary-client">Não informado</strong></div><div><span>Telefone / WhatsApp</span><strong id="os-summary-phone">Não informado</strong></div><div><span>Serviço</span><strong id="os-summary-service">Não informado</strong></div><div><span>Responsável</span><strong id="os-summary-attendant">Não informado</strong></div><div><span>Status da produção</span><strong id="os-summary-stage">Análise</strong></div></div><div class="ng-os-summary-finance"><h3>${ico('chart')} Resumo financeiro</h3><div><span>Valor total</span><b id="os-summary-total">R$ 0,00</b></div><div><span>Sinal</span><b id="os-summary-signal">R$ 0,00</b></div><div class="ng-os-summary-balance"><span>Restante</span><b id="os-summary-remaining">R$ 0,00</b></div></div><div class="ng-os-mini-preview"><div class="ng-os-mini-title"><span>${ico('file')} Pré-visualização da OS</span><button type="button" class="btn btn-sm" data-preview-expand>Ver maior ${ico('arrow')}</button></div><div class="ng-os-mini-canvas"><div class="os-preview-viewport" id="os-preview-viewport"><iframe id="os-preview-frame" title="Prévia do documento" sandbox="" referrerpolicy="no-referrer"></iframe></div></div></div><div class="ng-os-side-actions"><button type="button" class="btn btn-primary ng-os-save" data-save-order ${state.busy?'disabled':''}>${ico('check')} ${state.busy?'Salvando...':'Salvar OS'}</button><div class="ng-os-export"><button type="button" class="btn" data-export-pdf="${esc(o.id)}" ${state.orders.some(x=>x.id===o.id)?'':'disabled title="Salve a OS antes de baixar"'}>${ico('download')} Baixar PDF</button><button type="button" class="btn" data-print="${esc(o.id)}" ${state.orders.some(x=>x.id===o.id)?'':'disabled title="Salve a OS antes de imprimir"'}>${ico('printer')} Imprimir</button></div>${state.orders.some(x=>x.id===o.id)?`<button type="button" class="btn btn-danger ng-os-delete" data-delete-order="${esc(o.id)}">${ico('trash')} Excluir OS</button>`:''}<button type="button" class="ng-os-cancel" data-close>Cancelar e voltar</button></div></aside></div></div>`;root.innerHTML='';renderOrderPreview();if(hadEditor)window.scrollTo(0,oldScroll);}
function rerenderPaymentParts(){if(!state.draft)return;const total=Number($('[name=total]')?.value||0);const signal=Number($('#initial-payment')?.value||0);const isPaid=$('[name=payment_state]:checked')?.value==='paid';const remainingAmount=Math.max(0,total-(isPaid?total:signal));const r=$('#remaining-live');if(r)r.textContent=money(remainingAmount);state.editorPayment={signal:$('#initial-payment')?.value||'0',paid:isPaid};scheduleOrderPreview();}
function updateOrderPreviewScale(){
 const viewport=$('#os-preview-viewport');
 if(!viewport)return;
 const available=viewport.clientWidth||viewport.parentElement?.clientWidth||700;
 const scale=Math.min(1,Math.max(.32,available/794));
 viewport.style.setProperty('--os-preview-scale',String(scale));
 viewport.style.height=`${Math.ceil(1120*scale)}px`;
}
function renderOrderPreview(){
 if(!state.draft)return;
 const frame=$('#os-preview-frame');
 if(!frame)return;
 updateDraft();
 const order=structuredClone(state.draft);
 const signal=Number($('#initial-payment')?.value||0);
 const paidNow=$('[name=payment_state]:checked')?.value==='paid';
 const total=Math.max(0,Number(order.total||0));
 order.payments=reconcileSimplePayments(order,Math.max(0,Math.min(total,Number.isFinite(signal)?signal:0)),paidNow);
 const images=(order.attachments||[]).map(a=>({id:a.id,src:a.dataUrl||state.signCache.get(a.storage_path)||''}));
 const previewFields={
  'os-summary-client':order.client_name||'Não informado',
  'os-summary-phone':order.client_phone||'Não informado',
  'os-summary-service':order.title||'Não informado',
  'os-summary-attendant':order.attendant||'Não informado',
  'os-summary-stage':stageLabel(order.stage),
  'os-summary-total':money(total),
  'os-summary-signal':money(Math.min(total,Number.isFinite(signal)?Math.max(0,signal):0)),
  'os-summary-remaining':money(remaining(order))
 };
 for(const [id,value] of Object.entries(previewFields)){const el=document.getElementById(id);if(el)el.textContent=value;}
 const html=buildPrintHtml(order,state.settings,images);
 frame.srcdoc=html.replace('</style>','body{background:#fff!important}.printbar{display:none!important}main{margin:0!important;box-shadow:none!important;min-height:0!important}</style>');
 updateOrderPreviewScale();
}
function scheduleOrderPreview(){
 clearTimeout(state.orderPreviewTimer);
 state.orderPreviewTimer=setTimeout(renderOrderPreview,150);
}
window.addEventListener('resize',updateOrderPreviewScale);
function renderClientModal(){const c=state.clientDraft;if(!c)return;$('#modal-root').innerHTML=`<div class="overlay" id="drawer-overlay"><div class="drawer" role="dialog" aria-modal="true" aria-label="Cadastro de cliente"><div class="drawer-head"><div><h2>${state.clients.some(x=>x.id===c.id)?'Editar cliente':'Novo cliente'}</h2><p>Dados para vincular às ordens de serviço</p></div><button class="iconbutton" data-close>${ico('close')}</button></div><form class="drawer-body" id="client-form"><div class="form-field"><label>Nome *</label><input class="input" name="name" required value="${esc(c.name||'')}"/></div><div class="form-field"><label>WhatsApp / telefone</label><input class="input" name="phone" value="${esc(c.phone||'')}"/></div><button type="submit" class="btn btn-primary">${ico('check')} Salvar cliente</button></form></div></div>`;}
async function ensurePreviews(attachments){for(const a of attachments||[]){if(a.storage_path&&!state.signCache.has(a.storage_path)){try{const signed=await cloud.signImage(a.storage_path);state.signCache.set(a.storage_path,signed);}catch{}const img=document.querySelector(`[data-img-preview="${CSS.escape(a.id)}"]`);if(img)img.src=state.signCache.get(a.storage_path)||'';scheduleOrderPreview();}}}
function closeModal(){clearTimeout(state.orderPreviewTimer);state.editorPayment=null;state.draft=null;state.clientDraft=null;state.pendingFiles.clear();$('#modal-root').innerHTML='';}
async function resizedDataUrl(file,max=1100,quality=.82){return new Promise((resolve,reject)=>{const image=new Image();const tmp=URL.createObjectURL(file);image.onload=()=>{const ratio=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(tmp);resolve(canvas.toDataURL('image/jpeg',quality));};image.onerror=()=>{URL.revokeObjectURL(tmp);reject(Error('Imagem inválida.'));};image.src=tmp;});}
async function addImages(files){if(!state.draft)return;updateDraft();for(const file of Array.from(files||[])){if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('Use PNG, JPG ou WEBP.',true);continue;}if(file.size>12*1024*1024){toast('Imagem acima de 12 MB. Reduza o arquivo.',true);continue;}try{const dataUrl=await resizedDataUrl(file,state.mode==='demo'?900:1100);const id=uid();state.pendingFiles.set(id,file);state.draft.attachments.push({id,name:file.name||'Print do serviço',dataUrl,caption:'',include_pdf:true,size:'medium',rotation:0,storage_path:null});}catch(e){toast(e.message,true);}}renderModal();}
async function deleteOrder(id){
 if(state.busy)return;
 const order=state.orders.find(o=>o.id===id);
 if(!order)return;
 const label=`${order.number} — ${order.title}`;
 if(!confirm(`Excluir permanentemente a ordem de serviço ${label}?\n\nOs pagamentos, o histórico e os anexos vinculados serão removidos. Esta ação não pode ser desfeita. O número da OS não será reutilizado.`))return;
 state.busy=true;
 const button=document.querySelector('[data-delete-order]');
 if(button)button.disabled=true;
 try{
  if(state.mode==='cloud'){
   await cloud.deleteOrder(id);
  }
  state.orders=state.orders.filter(o=>o.id!==id);
  if(state.mode==='demo')persistDemo();
  closeModal();
  render();
  toast(`OS ${order.number} excluída com sucesso.`);
  if(state.mode==='cloud'){
   try{await cloud.deleteOrderAttachments(order);}
   catch(error){toast('OS excluída, mas alguns anexos podem continuar no armazenamento: '+error.message,true);}
  }
 }catch(error){
  toast('Não foi possível excluir a OS: '+error.message,true);
  if(state.mode==='cloud')await loadCloud();
 }finally{state.busy=false;}
}
async function saveOrder(){if(!state.draft||state.busy)return;updateDraft();let o=state.draft;const exists=state.orders.some(x=>x.id===o.id);if(!o.title.trim()||!o.client_name.trim()){toast('Preencha o nome do serviço e o cliente.',true);return;}if(!Number.isFinite(o.total)||o.total<0){toast('Valor inválido.',true);return;}const signal=Number($('#initial-payment')?.value||0);const isPaid=$('[name=payment_state]:checked')?.value==='paid';if(!Number.isFinite(signal)||signal<0||signal>o.total+.001){toast('O sinal precisa estar entre zero e o valor total.',true);return;}if(!isPaid&&o.total>0&&signal>=o.total-.001){toast('O valor está totalmente recebido. Marque Pago ou reduza o sinal.',true);return;}const previousPayments=JSON.stringify(o.payments||[]);o.payments=reconcileSimplePayments(o,signal,isPaid);if(paid(o)>o.total+.001){toast('Os pagamentos não podem ultrapassar o valor total.',true);return;}state.busy=true;const saveButton=$('[data-save-order]');if(saveButton)saveButton.disabled=true;try{if(!exists){o.history=[...(o.history||[]),{action:'Ordem de serviço criada',date:new Date().toISOString()}];}else{const old=state.orders.find(x=>x.id===o.id);if(old.stage!==o.stage){o.history=[...(o.history||[]),{action:`Status alterado: ${stageLabel(old.stage)} → ${stageLabel(o.stage)}`,date:new Date().toISOString()}];if(o.stage==='entregue')o.delivered_at=new Date().toISOString();if(old.stage==='entregue'&&o.stage!=='entregue')o.delivered_at=null;}if(JSON.stringify(old.payments||[])!==JSON.stringify(o.payments||[]))o.history=[...(o.history||[]),{action:'Pagamentos atualizados',date:new Date().toISOString()}];}
 if(state.mode==='cloud'){
  if(!exists) o.number=await cloud.issueNumber(profilePrefix(state.profile||o.attendant));
  const clean={...o,attachments:o.attachments.map(a=>{const {dataUrl,...rest}=a;return rest;})};
  // Cria primeiro a OS; imagens serão enviadas ao bucket privado na sequência.
  let saved=await cloud.persistOrder(clean,exists);
  const pending=o.attachments.filter(a=>state.pendingFiles.has(a.id));
  if(pending.length){for(const a of pending){const path=await cloud.uploadImage(o.id,state.pendingFiles.get(a.id));a.storage_path=path;}saved=await cloud.persistOrder({...o,attachments:o.attachments.map(a=>{const {dataUrl,...rest}=a;return rest;})},true);}
  o=saved;
 }else{const clean=structuredClone(o);state.orders=exists?state.orders.map(x=>x.id===o.id?clean:x):[clean,...state.orders];persistDemo();}
 if(state.mode==='cloud')state.orders=exists?state.orders.map(x=>x.id===o.id?o:x):[o,...state.orders];
 if(!state.clients.some(c=>c.name.toLowerCase()===o.client_name.toLowerCase())){const c={id:uid(),name:o.client_name,phone:o.client_phone||'',created_at:new Date().toISOString()};if(state.mode==='cloud'){try{const saved=await cloud.persistClient(c,false);state.clients.push(saved);}catch(e){toast('OS salva, mas não foi possível cadastrar o cliente: '+e.message,true);}}else{state.clients.push(c);persistDemo();}}
 closeModal();render();toast('Ordem de serviço salva com sucesso.');
 }catch(e){toast('Não foi possível salvar: '+e.message,true);if(state.mode==='cloud')await loadCloud();}finally{state.busy=false;}}
async function changeStage(orderId,stage){const o=state.orders.find(x=>x.id===orderId);if(!o||o.stage===stage)return;const copy=structuredClone(o);const before=stageLabel(copy.stage);copy.stage=stage;copy.delivered_at=stage==='entregue'?new Date().toISOString():null;copy.history=[...(copy.history||[]),{action:`Status alterado: ${before} → ${stageLabel(stage)}`,date:new Date().toISOString()}];try{const saved=state.mode==='cloud'?await cloud.persistOrder(copy,true):copy;state.orders=state.orders.map(x=>x.id===orderId?saved:x);if(state.mode==='demo')persistDemo();refreshView();toast(`${o.number}: movido para ${stageLabel(stage)}.`);}catch(e){toast('Falha ao mover OS: '+e.message,true);}}
async function printOrder(id,button){
 const order=state.orders.find(o=>o.id===id);
 if(!order||button?.disabled)return;
 const old=button?.innerHTML;
 if(button){button.disabled=true;button.textContent='Preparando impressão...';}
 try{
  const images=await orderImageSources(order);
  await printOrderDocument(order,state.settings,images);
 }catch(e){toast('Não foi possível imprimir: '+e.message,true);}
 finally{if(button?.isConnected){button.disabled=false;button.innerHTML=old;}}
}
async function orderImageSources(order){
 const images=[];
 for(const a of order.attachments||[]){
  if(a.include_pdf===false)continue;
  let src=a.dataUrl||state.signCache.get(a.storage_path)||'';
  if(!src&&a.storage_path){
   src=await cloud.signImage(a.storage_path);
   state.signCache.set(a.storage_path,src);
  }
  images.push({id:a.id,src});
 }
 return images;
}
async function exportOrderPdf(id,button){
 const order=state.orders.find(o=>o.id===id);
 if(!order)return;
 if(button?.disabled)return;
 const label=button?.innerHTML;
 if(button){button.disabled=true;button.textContent='Gerando PDF...';}
 try{
  const images=await orderImageSources(order);
  await downloadOrderPdf(order,state.settings,images);
  toast('PDF da OS '+order.number+' gerado.');
 }catch(error){toast('Não foi possível exportar o PDF: '+error.message,true);}
 finally{if(button?.isConnected){button.disabled=false;button.innerHTML=label;}}
}
function switchPage(page){state.page=page;state.filter='todos';state.search='';state.mobileMenuOpen=false;const group=NAV_GROUPS.find(g=>g.items.some(([id])=>id===page));if(group)state.sidebarGroups[group.id]=true;persistSidebar();closeModal();render();window.scrollTo({top:0,behavior:'instant'});}
async function saveSettings(form){const data=Object.fromEntries(new FormData(form).entries());const s={...state.settings,...data,prefix:String(data.prefix||'FEL').replace(/[^A-Za-z0-9_-]/g,'').slice(0,12).toUpperCase()};try{state.settings=state.mode==='cloud'?{...defaultSettings,...await cloud.persistSettings(s)}:s;if(state.mode==='demo')persistDemo();refreshView();toast('Configurações salvas.');}catch(e){toast('Falha ao salvar configurações: '+e.message,true);}}
async function saveClient(form){const c=state.clientDraft,fields=Object.fromEntries(new FormData(form).entries());if(!fields.name?.trim()){toast('Informe o nome do cliente.',true);return;}const exists=state.clients.some(x=>x.id===c.id);const object={...c,name:fields.name.trim(),phone:fields.phone?.trim()||''};try{const saved=state.mode==='cloud'?await cloud.persistClient(object,exists):object;state.clients=exists?state.clients.map(x=>x.id===c.id?saved:x):[saved,...state.clients];if(state.mode==='demo')persistDemo();if(state.draft){updateDraft();const clientField=$('#order-form [name=client_name]');const phoneField=$('#order-form [name=client_phone]');if(clientField)clientField.value=saved.name;if(phoneField)phoneField.value=saved.phone||'';state.draft.client_name=saved.name;state.draft.client_phone=saved.phone||'';state.clientDraft=null;$('#modal-root').innerHTML='';renderModal();}else{closeModal();refreshView();}toast('Cliente salvo.');}catch(e){toast(e.message,true);}}
function moveImage(id,direction){if(!state.draft)return;updateDraft();const a=state.draft.attachments,i=a.findIndex(x=>x.id===id),j=i+direction;if(i<0||j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];renderModal();}
function updateAttachment(id,key,value){if(!state.draft)return;const a=state.draft.attachments.find(x=>x.id===id);if(a)a[key]=value;}
// Interações por delegação: os cartões e menus são renderizados novamente sem perder handlers.
document.addEventListener('click',async e=>{
 const target=e.target.closest('button,[data-open-order],[data-client-id]');if(!target)return;
 if(target.matches('[data-choose-profile]')){chooseProfile(target.dataset.chooseProfile);return;}
 if(target.matches('[data-switch-profile]')){state.profile=null;localStorage.removeItem(PROFILE_KEY);profileScreen();return;}
 if(target.matches('[data-remove-profile]')){await removeProfile(target.dataset.removeProfile);return;}
 if(target.matches('[data-toggle-group]')){const group=target.dataset.toggleGroup;if(!Object.hasOwn(state.sidebarGroups,group))return;if(state.sidebarCollapsed){state.sidebarCollapsed=false;state.sidebarGroups[group]=true;}else{state.sidebarGroups[group]=!state.sidebarGroups[group];}persistSidebar();refreshSidebar();return;}
 if(target.matches('[data-collapse-sidebar]')){state.sidebarCollapsed=!state.sidebarCollapsed;persistSidebar();refreshSidebar();return;}
 if(target.matches('[data-mobile-more]')){state.mobileMenuOpen=!state.mobileMenuOpen;refreshSidebar();return;}
 if(target.matches('[data-nav]')){switchPage(target.dataset.nav);return;}
 if(target.matches('[data-new]')){state.mobileMenuOpen=false;openEditor();return;}
 if(target.matches('[data-open-order]')){openEditor(target.dataset.openOrder);return;}
 if(target.matches('[data-client-id]')){state.clientDraft=structuredClone(state.clients.find(c=>c.id===target.dataset.clientId));state.draft=null;renderModal();return;}
 if(target.matches('[data-new-client]')){state.clientDraft={id:uid(),name:'',phone:'',created_at:new Date().toISOString()};renderModal();return;}
 if(target.matches('[data-filter]')){state.filter=target.dataset.filter;refreshView();return;}
 if(target.matches('[data-close]')){if(state.clientDraft&&state.draft){state.clientDraft=null;$('#modal-root').innerHTML='';return;}closeModal();render();return;}
 if(target.matches('[data-preview-expand]')){document.querySelector('.ng-os-mini-preview')?.classList.toggle('is-expanded');updateOrderPreviewScale();return;}
  if(target.matches('[data-delete-order]')){await deleteOrder(target.dataset.deleteOrder);return;}
 if(target.matches('[data-save-order]')){await saveOrder();return;}
 if(target.matches('[data-pick-images]')){$('#image-picker')?.click();return;}
 if(target.matches('[data-export-pdf]')){await exportOrderPdf(target.dataset.exportPdf,target);return;}
 if(target.matches('[data-print]')){await printOrder(target.dataset.print,target);return;}
 if(target.matches('[data-remove-img]')){updateDraft();state.draft.attachments=state.draft.attachments.filter(a=>a.id!==target.dataset.removeImg);renderModal();return;}
 if(target.matches('[data-img-up]')){moveImage(target.dataset.imgUp,-1);return;}
 if(target.matches('[data-img-down]')){moveImage(target.dataset.imgDown,1);return;}
 if(target.matches('[data-img-rotate]')){updateDraft();const id=target.dataset.imgRotate;const a=state.draft.attachments.find(x=>x.id===id);a.rotation=(Number(a.rotation||0)+90)%360;renderModal();return;}
 if(target.matches('[data-refresh]')){await loadCloud();toast('Dados atualizados.');return;}
 if(target.matches('[data-logout]')){await cloud.signout();renderLogin();return;}
});
document.addEventListener('change',async e=>{const target=e.target;
 if(target.id==='image-picker'){await addImages(target.files);target.value='';return;}
 if(target.matches('[data-img-enabled]')){updateAttachment(target.dataset.imgEnabled,'include_pdf',target.checked);scheduleOrderPreview();return;}
 if(target.matches('[data-img-size]')){updateAttachment(target.dataset.imgSize,'size',target.value);scheduleOrderPreview();return;}
 if(target.matches('[name=payment_state]')&&state.draft){rerenderPaymentParts();return;}
 if(state.draft&&target.closest('#order-form'))scheduleOrderPreview();
 if(target.matches('[name=client_name]')&&state.draft){const client=state.clients.find(c=>c.name.toLowerCase()===target.value.trim().toLowerCase());if(client){const phone=$('[name=client_phone]');if(phone&&!phone.value)phone.value=client.phone||'';}scheduleOrderPreview();}
});
document.addEventListener('input',e=>{const target=e.target;if(target.id==='global-search'){state.search=target.value;refreshView();return;}
 if(state.draft&&target.closest('#order-form')){if(target.matches('[name=total]')){state.draft.total=Math.max(0,Number(target.value||0));rerenderPaymentParts();}if(target.id==='initial-payment')rerenderPaymentParts();if(target.matches('[data-img-caption]'))updateAttachment(target.dataset.imgCaption,'caption',target.value);scheduleOrderPreview();}
});
document.addEventListener('submit',async e=>{if(e.target.id==='team-form'){e.preventDefault();await addProfile(new FormData(e.target).get('name'));return;}if(e.target.id==='login-form'){e.preventDefault();const data=new FormData(e.target);const btn=e.target.querySelector('button');btn.disabled=true;try{await cloud.signin(String(data.get('email')),String(data.get('password')),data.has('remember'));await loadCloud();}catch(error){renderLogin('Falha no login: '+error.message);}return;}
 if(e.target.id==='settings-form'){e.preventDefault();await saveSettings(e.target);return;}
 if(e.target.id==='client-form'){e.preventDefault();await saveClient(e.target);return;}
 if(e.target.id==='order-form'){e.preventDefault();await saveOrder();return;}
});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#global-search')?.focus();}if(e.key==='Escape'&&(state.draft||state.clientDraft)){closeModal();}});
document.addEventListener('paste',async e=>{if(!state.draft)return;const files=Array.from(e.clipboardData?.files||[]).filter(x=>x.type.startsWith('image/'));if(files.length){e.preventDefault();await addImages(files);toast(`${files.length} imagem(ns) adicionada(s).`);}});
document.addEventListener('dragstart',e=>{const order=e.target.closest('[data-drag-order]');if(order){e.dataTransfer.setData('text/ng-order',order.dataset.dragOrder);e.dataTransfer.effectAllowed='move';return;}const img=e.target.closest('[data-img-drag]');if(img){e.dataTransfer.setData('text/ng-image',img.dataset.imgDrag);e.dataTransfer.effectAllowed='move';}});
document.addEventListener('dragover',e=>{const col=e.target.closest('[data-stage]');if(col){e.preventDefault();col.classList.add('dragging-over');return;}if(e.target.closest('[data-img-drag]'))e.preventDefault();});
document.addEventListener('dragleave',e=>{const col=e.target.closest('[data-stage]');if(col&&!col.contains(e.relatedTarget))col.classList.remove('dragging-over');});
document.addEventListener('drop',async e=>{const col=e.target.closest('[data-stage]');if(col){e.preventDefault();col.classList.remove('dragging-over');const id=e.dataTransfer.getData('text/ng-order');if(id)await changeStage(id,col.dataset.stage);return;}const img=e.target.closest('[data-img-drag]');if(img&&state.draft){e.preventDefault();updateDraft();const drag=e.dataTransfer.getData('text/ng-image');const a=state.draft.attachments,from=a.findIndex(x=>x.id===drag),to=a.findIndex(x=>x.id===img.dataset.imgDrag);if(from>=0&&to>=0&&from!==to){a.splice(to,0,a.splice(from,1)[0]);renderModal();}}});
// Atualização periódica para outros computadores, sem sobrescrever uma OS em edição.
if(state.mode==='cloud')setInterval(()=>{if(document.visibilityState==='visible'&&!state.draft&&!state.clientDraft&&cloud.getSession())loadCloud().catch(()=>{});},30000);
boot();