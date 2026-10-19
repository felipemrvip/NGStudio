export const STAGES = [
 {id:'analise',label:'Análise',color:'#9da8b9'},
 {id:'andamento',label:'Em andamento',color:'#f2ba38'},
 {id:'producao',label:'Produção',color:'#ab6bdf'},
 {id:'pronto',label:'Pronto',color:'#22bb91'},
 {id:'entregue',label:'Entregue',color:'#4e9cff'}
];
export const defaultSettings={company:'NG PrintSign Gráfica',legalName:'NG COMUNICAÇÃO VISUAL LTDA - ME',cnpj:'14.616.988/0001-22',phone:'21 96543-3873',address:'Via Apia Nº 6',instagram:'@grafica_ng_oficial',prefix:'FEL',attendants:'FELIPE',footer:'Documento de controle de serviço. Não substitui nota fiscal.'};
export function money(value){return Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
export function paid(order){return (order.payments||[]).reduce((sum,p)=>sum+Number(p.amount||0),0);}
export function remaining(order){return Math.max(0,Number(order.total||0)-paid(order));}
export function paymentStatus(order){const n=paid(order),total=Number(order.total||0);return total===0?'Sem cobrança':n>=total?'Pago':n>0?'Sinal':'Pendente';}
export function stageLabel(id){return STAGES.find(s=>s.id===id)?.label||id;}
export function fmtDate(value){if(!value)return '—';const d=new Date(value.length===10?value+'T12:00:00':value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');}
export function currentMonth(value){const a=new Date(value),b=new Date();return a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();}
export function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function uid(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'id-'+Math.random().toString(36).slice(2)+Date.now();}
export function nextNumber(orders,prefix='FEL') {
 const safe=String(prefix).replace(/[^A-Za-z]/g,'').toUpperCase()||'FEL';
 const pattern=new RegExp('^'+safe+'-(\\d+)$');
 const max=orders.reduce((m,o)=>{const found=String(o.number||'').match(pattern);return found?Math.max(m,Number(found[1])):m;},0);
 return safe+'-'+String(max+1).padStart(2,'0');
}
export function stats(orders){const valid=orders.filter(o=>o.stage!=='cancelado');return {active:valid.filter(o=>o.stage!=='entregue').length,production:valid.filter(o=>o.stage==='producao').length,ready:valid.filter(o=>o.stage==='pronto').length,receivable:valid.reduce((s,o)=>s+remaining(o),0),receivedMonth:valid.reduce((s,o)=>s+(o.payments||[]).filter(p=>currentMonth(p.date)).reduce((a,p)=>a+Number(p.amount),0),0)};}
