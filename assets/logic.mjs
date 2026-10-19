export const STAGES = [
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
export function stageLabel(id){return STAGES.find(s=>s.id===(id==='analise'?'andamento':id))?.label||id;}
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

/** Resumo anual: faturado = valor total das OS criadas no mês;
 * recebido = pagamentos efetivamente registrados no mês, mesmo de OS antigas.
 * Saldo de origem = total ainda a receber das OS criadas naquele mês (fotografia atual).
 */
export function monthlyRevenue(orders,year){
 const selectedYear=Number(year);
 const months=Array.from({length:12},(_,month)=>({
  month,year:selectedYear,orders:0,billed:0,received:0,outstanding:0
 }));
 const valid=orders.filter(order=>order&&order.stage!=='cancelado');
 const getDate=value=>{
  if(!value)return null;
  const raw=String(value);
  const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+'T12:00:00':raw);
  return Number.isNaN(date.getTime())?null:date;
 };
 for(const order of valid){
  const created=getDate(order.created_at);
  if(created&&created.getFullYear()===selectedYear){
   const row=months[created.getMonth()];
   row.orders++;
   row.billed+=Number(order.total)||0;
   row.outstanding+=remaining(order);
  }
  for(const payment of order.payments||[]){
   const date=getDate(payment.date);
   if(date&&date.getFullYear()===selectedYear)months[date.getMonth()].received+=Number(payment.amount)||0;
  }
 }
 for(const month of months){
  month.billed=Math.round(month.billed*100)/100;
  month.received=Math.round(month.received*100)/100;
  month.outstanding=Math.round(month.outstanding*100)/100;
 }
 return months;
}
export function revenueYears(orders,currentYear=new Date().getFullYear()){
 const years=new Set([Number(currentYear)]);
 for(const order of orders){
  for(const date of [order.created_at,...(order.payments||[]).map(p=>p.date)]){
   if(!date)continue;
   const value=new Date(String(date).length===10?date+'T12:00:00':date);
   if(!Number.isNaN(value.getTime()))years.add(value.getFullYear());
  }
 }
 return [...years].sort((a,b)=>b-a);
}

/** Recorte mensal da operação. Datas de criação e entrega medem eventos no
 * período; estágios mostram a SITUAÇÃO ATUAL das OS criadas naquele mês.
 * Pagamentos entram no mês em que foram registrados, inclusive de OS antigas.
 */
export function monthlyPerformance(orders,year,month){
 const selectedYear=Number(year),selectedMonth=Number(month);
 if(!Number.isInteger(selectedYear)||!Number.isInteger(selectedMonth)||selectedMonth<0||selectedMonth>11)throw Error('Período inválido');
 const isMonth=value=>{
  if(!value)return false;
  const str=String(value);
  const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(str)?str+'T12:00:00':str);
  return !Number.isNaN(date.getTime())&&date.getFullYear()===selectedYear&&date.getMonth()===selectedMonth;
 };
 const valid=(orders||[]).filter(o=>o&&o.stage!=='cancelado');
 const created=valid.filter(o=>isMonth(o.created_at));
 const delivered=valid.filter(o=>isMonth(o.delivered_at));
 const stageCounts=Object.fromEntries(STAGES.map(stage=>[stage.id,0]));
 for(const order of created)if(Object.hasOwn(stageCounts,order.stage))stageCounts[order.stage]++;
 const billed=created.reduce((sum,order)=>sum+(Number(order.total)||0),0);
 const outstanding=created.reduce((sum,order)=>sum+remaining(order),0);
 let received=0,paymentCount=0;
 for(const order of valid)for(const payment of order.payments||[]){
  if(isMonth(payment.date)){
   received+=Number(payment.amount)||0;
   paymentCount++;
  }
 }
 const round=num=>Math.round((num+Number.EPSILON)*100)/100;
 return {
  year:selectedYear,month:selectedMonth,
  orders:created.length,
  billed:round(billed),
  received:round(received),
  outstanding:round(outstanding),
  payments:paymentCount,
  delivered:delivered.length,
  // Apenas as OS que começaram neste mês, com situação ATUAL.
  stages:stageCounts,
  active:created.length-(stageCounts.entregue||0),
  averageTicket:created.length?round(billed/created.length):0,
  ordersCreated:[...created].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)),
  ordersDelivered:[...delivered].sort((a,b)=>new Date(b.delivered_at)-new Date(a.delivered_at))
 };
}
