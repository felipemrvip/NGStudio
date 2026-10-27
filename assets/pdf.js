import {buildPrintHtml} from './print.js';

// O download usa exatamente o mesmo HTML/CSS da prévia e da impressão.
// As bibliotecas rodam na página principal (não dentro do iframe), para
// evitar que navegadores bloqueiem downloads iniciados de frames ocultos.
const LIBS={
 html2canvas:'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
 jspdf:'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
};
const loading=new Map();
function loadScript(name){
 const available=()=>name==='jspdf'?globalThis.jspdf?.jsPDF:globalThis.html2canvas;
 if(available())return Promise.resolve(available());
 if(!loading.has(name)){
  loading.set(name,new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=LIBS[name];
   script.async=true;
   script.onload=()=>available()?resolve(available()):reject(Error('O gerador de PDF não foi carregado.'));
   script.onerror=()=>reject(Error('Não foi possível carregar o gerador de PDF. Confira sua conexão.'));
   document.head.appendChild(script);
  }).catch(e=>{loading.delete(name);throw e;}));
 }
 return loading.get(name);
}
// A captura HTML->PDF nem sempre desenha SVGs externos em iframes.
// Converte a logo oficial em PNG e embute no documento antes da captura.
let embeddedBrandPromise;
async function embeddedBrandPng(){
 if(!embeddedBrandPromise){
  embeddedBrandPromise=(async()=>{
   const response=await fetch(new URL('./brand.svg',import.meta.url));
   if(!response.ok)throw Error('Arquivo da logo indisponível (HTTP '+response.status+').');
   const svg=await response.text();
   const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
   try{
    const image=new Image();
    image.src=url;
    await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=600;
    canvas.height=600;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('Não foi possível preparar a imagem.');
    ctx.drawImage(image,0,0,600,600);
    return canvas.toDataURL('image/png');
   }finally{URL.revokeObjectURL(url);}
  })().catch(error=>{embeddedBrandPromise=null;throw Error('Falha ao preparar a logo NG PrintSign: '+error.message);});
 }
 return embeddedBrandPromise;
}
export function orderFilename(number){
 return 'OS-'+String(number||'SEM-NUMERO').replace(/[^A-Za-z0-9_-]/g,'-').slice(0,70)+'.pdf';
}
function waitForImages(doc){
 return Promise.all(Array.from(doc.querySelectorAll('main img')).map(img=>{
  if(img.complete)return img.naturalWidth?Promise.resolve():Promise.reject(Error('Imagem anexada indisponível.'));
  return new Promise((resolve,reject)=>{
   img.addEventListener('load',resolve,{once:true});
   img.addEventListener('error',()=>reject(Error('Uma imagem da OS não pôde ser carregada.')),{once:true});
  });
 }));
}
export async function prepareOrderDocument(order,settings,images=[]){
 const frame=document.createElement('iframe');
 frame.setAttribute('aria-hidden','true');
 frame.tabIndex=-1;
 // Fora da área visível, porém renderizável para captura e impressão.
 frame.style.cssText='position:fixed;left:-12000px;top:0;width:794px;height:1123px;border:0;pointer-events:none;';
 document.body.appendChild(frame);
 try{
  const ready=new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('A nota demorou muito para carregar.')),20000);
   frame.onload=()=>{clearTimeout(timeout);resolve();};
   frame.onerror=()=>{clearTimeout(timeout);reject(Error('Não foi possível preparar a nota.'));};
  });
  frame.srcdoc=buildPrintHtml(order,settings,images);
  await ready;
  const doc=frame.contentDocument;
  if(!doc)throw Error('Não foi possível acessar o documento da OS.');
  const main=doc.querySelector('main');
  if(!main)throw Error('Modelo da OS não encontrado.');
  const style=doc.createElement('style');
  style.textContent='body{background:#fff!important}.printbar{display:none!important}main{margin:0!important;box-shadow:none!important;min-height:0!important}';
  doc.head.appendChild(style);
  // PNG embutido: não depende da URL relativa nem do suporte a SVG do html2canvas.
  const logo=doc.querySelector('header .print-logo');
  if(!logo)throw Error('Logo não encontrada no modelo da OS.');
  logo.src=await embeddedBrandPng();
  await logo.decode();
  await waitForImages(doc);
  return {frame,doc,main};
 }catch(e){frame.remove();throw e;}
}
export async function downloadOrderPdf(order,settings,images=[]){
 // Carrega no documento principal, onde o clique de download é permitido.
 const [html2canvas,JsPDF]=await Promise.all([loadScript('html2canvas'),loadScript('jspdf')]);
 const rendered=await prepareOrderDocument(order,settings,images);
 try{
  const canvas=await html2canvas(rendered.main,{
   backgroundColor:'#ffffff',scale:1.6,useCORS:true,allowTaint:false,
   scrollX:0,scrollY:0,windowWidth:794,logging:false
  });
  if(!canvas.width||!canvas.height)throw Error('Não foi possível desenhar a nota.');
  const pdf=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const pageWidth=210,pageHeight=297;
  const pagePixelHeight=Math.floor(canvas.width*(pageHeight/pageWidth));
  // Fatiamento por página: não deforma a imagem da nota.
  for(let offset=0,page=0;offset<canvas.height;offset+=pagePixelHeight,page++){
   const sliceHeight=Math.min(pagePixelHeight,canvas.height-offset);
   const slice=document.createElement('canvas');
   slice.width=canvas.width;slice.height=sliceHeight;
   slice.getContext('2d').drawImage(canvas,0,offset,canvas.width,sliceHeight,0,0,canvas.width,sliceHeight);
   if(page)pdf.addPage();
   const imageHeight=sliceHeight/canvas.width*pageWidth;
   pdf.addImage(slice.toDataURL('image/jpeg',.94),'JPEG',0,0,pageWidth,imageHeight,undefined,'FAST');
   slice.width=0;slice.height=0;
  }
  canvas.width=0;canvas.height=0;
  const url=URL.createObjectURL(pdf.output('blob'));
  const link=document.createElement('a');
  link.href=url;link.download=orderFilename(order.number);
  document.body.appendChild(link);
  try{link.click();}finally{
   link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
 }finally{rendered.frame.remove();}
}
export async function printOrderDocument(order,settings,images=[]){
 const rendered=await prepareOrderDocument(order,settings,images);
 const win=rendered.frame.contentWindow;
 if(!win){rendered.frame.remove();throw Error('Não foi possível abrir a impressão.');}
 let cleaned=false;
 function cleanup(){
  if(cleaned)return;
  cleaned=true;
  win.removeEventListener('afterprint',cleanup);
  rendered.frame.remove();
 }
 win.addEventListener('afterprint',cleanup,{once:true});
 // Alguns navegadores não disparam afterprint para um iframe oculto.
 setTimeout(cleanup,120000);
 win.focus();
 win.print();
}


/**
 * Relatório gerencial vetorial: ano completo + resumo do mês escolhido.
 * Usa as mesmas métricas do painel (calculadas em logic.mjs), sem refazer somas.
 * Pagamentos são contabilizados na data de recebimento.
 */
export async function downloadMonthlyResultsPdf({settings,year,month,months,detail}){
 const JsPDF=await loadScript('jspdf');
 const brand=await embeddedBrandPng();
 const pdf=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const W=210,H=297,L=16,R=194;
 const navy=[9,22,83],gold=[255,202,48],ink=[31,45,69],muted=[104,118,140],pale=[244,247,251];
 const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 const selected=monthNames[month];
 const currency=value=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const integer=value=>Number(value||0).toLocaleString('pt-BR');
 const generated=new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
 const totals=months.reduce((a,m)=>({
  orders:a.orders+m.orders,
  billed:a.billed+m.billed,
  received:a.received+m.received,
  outstanding:a.outstanding+m.outstanding
 }),{orders:0,billed:0,received:0,outstanding:0});
 let y=45;
 const color=(rgb)=>pdf.setTextColor(...rgb);
 function line(text,x,baseline,{fontSize=9,bold=false,rgb=ink,align='left',maxWidth}={}){
  pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(fontSize);color(rgb);
  let value=String(text??'');
  if(maxWidth&&pdf.getTextWidth(value)>maxWidth){
   while(value.length&&pdf.getTextWidth(value+'…')>maxWidth)value=value.slice(0,-1);
   value=value+'…';
  }
  pdf.text(value,x,baseline,{align});
 }
 function pageHeader(){
  pdf.setFillColor(...navy);pdf.rect(0,0,W,36,'F');
  pdf.setFillColor(...gold);pdf.rect(0,36,W,2,'F');
  pdf.addImage(brand,'PNG',L,5,26,26);
  line(settings.company||'NG PrintSign Gráfica',47,14,{fontSize:14,bold:true,rgb:[255,255,255],maxWidth:145});
  line('RELATÓRIO DE RESULTADOS',47,23,{fontSize:9,bold:true,rgb:gold});
  line(year+' • Destaque: '+selected,47,30,{fontSize:9,rgb:[222,232,248]});
  y=46;
 }
 function nextPage(){pdf.addPage();pageHeader();}
 function space(height){if(y+height>270)nextPage();}
 function section(text){
  space(15);
  pdf.setFillColor(...gold);pdf.roundedRect(L,y-4,2,7,1,1,'F');
  line(text,L+6,y+1,{fontSize:12,bold:true,rgb:navy});
  y+=12;
 }
 function note(text){
  pdf.setFont('helvetica','normal');pdf.setFontSize(8.2);color(muted);
  const lines=pdf.splitTextToSize(text,R-L);
  space(lines.length*4.2+4);
  pdf.text(lines,L,y);y+=lines.length*4.2+5;
 }
 function metric(x,top,w,title,value){
  pdf.setFillColor(...pale);pdf.roundedRect(x,top,w,24,2.5,2.5,'F');
  line(title,x+4,top+7.5,{fontSize:8,rgb:muted,maxWidth:w-8});
  line(value,x+4,top+17.5,{fontSize:11,bold:true,rgb:navy,maxWidth:w-8});
 }
 function tableHeader(columns){
  space(10);pdf.setFillColor(...navy);pdf.roundedRect(L,y,R-L,9,1.4,1.4,'F');
  for(const item of columns)line(item.title,item.x,y+6,{fontSize:7.4,bold:true,rgb:[255,255,255],align:item.align||'left'});
  y+=10;
 }
 function tableRow(entries,{height=8,highlight=false,index=0}={}){
  space(height+1);
  if(highlight||index%2===0){pdf.setFillColor(...pale);pdf.rect(L,y,R-L,height,'F');}
  for(const entry of entries)line(entry.value,entry.x,y+height/2+2.2,{fontSize:entry.size||8,bold:Boolean(entry.bold),align:entry.align||'left',maxWidth:entry.maxWidth});
  y+=height;
 }
 // Página 1: consolidado do ano.
 pageHeader();
 section('Panorama anual • '+year);
 const cw=(R-L-9)/4;
 metric(L,y,cw,'Ordens criadas',integer(totals.orders));
 metric(L+cw+3,y,cw,'Serviços lançados',currency(totals.billed));
 metric(L+2*(cw+3),y,cw,'Recebido no ano',currency(totals.received));
 metric(L+3*(cw+3),y,cw,'Saldo pendente',currency(totals.outstanding));
 y+=31;
 section('Evolução dos 12 meses');
 const annualColumns=[
  {title:'MÊS',x:L+3},{title:'OS',x:68,align:'right'},
  {title:'SERVIÇOS',x:109,align:'right'},
  {title:'RECEBIDO',x:151,align:'right'},
  {title:'A RECEBER',x:R-3,align:'right'}
 ];
 tableHeader(annualColumns);
 months.forEach((m,i)=>tableRow([
  {value:monthNames[m.month],x:L+3,bold:m.month===month,maxWidth:38},
  {value:integer(m.orders),x:68,align:'right'},
  {value:currency(m.billed),x:109,align:'right'},
  {value:currency(m.received),x:151,align:'right'},
  {value:currency(m.outstanding),x:R-3,align:'right'}
 ],{index:i,highlight:m.month===month,height:9.2}));
 y+=2;
 tableRow([
  {value:'TOTAL',x:L+3,bold:true},
  {value:integer(totals.orders),x:68,align:'right',bold:true},
  {value:currency(totals.billed),x:109,align:'right',bold:true},
  {value:currency(totals.received),x:151,align:'right',bold:true},
  {value:currency(totals.outstanding),x:R-3,align:'right',bold:true}
 ],{height:10,highlight:true});
 y+=6;
 note('Serviços lançados: valor das OS pela data de criação. Recebido: pagamentos registrados em cada mês, inclusive de OS anteriores. A receber: saldo ainda pendente das OS criadas no período (posição atual). OS canceladas não entram no relatório.');
 // Página 2 em diante: recorte mensal com detalhes das OS.
 nextPage();
 section('Resumo mensal • '+selected+' de '+year);
 const half=(R-L-5)/3;
 metric(L,y,half,'OS criadas',integer(detail.orders));
 metric(L+half+2.5,y,half,'OS entregues',integer(detail.delivered));
 metric(L+2*(half+2.5),y,half,'Pagamentos',integer(detail.payments));
 y+=29;
 metric(L,y,half,'Valor dos serviços',currency(detail.billed));
 metric(L+half+2.5,y,half,'Valor recebido',currency(detail.received));
 metric(L+2*(half+2.5),y,half,'Saldo pendente',currency(detail.outstanding));
 y+=33;
 section('Situação atual das OS criadas no mês');
 const stages=[
  ['Em andamento',detail.stages?.andamento||0],
  ['Em produção',detail.stages?.producao||0],
  ['Prontas',detail.stages?.pronto||0],
  ['Entregues',detail.stages?.entregue||0]
 ];
 const stageW=(R-L-6)/4;
 stages.forEach(([name,count],i)=>metric(L+i*(stageW+2),y,stageW,name,integer(count)));
 y+=30;
 note('Os status representam a situação atual das OS abertas neste mês. As entregas e os recebimentos consideram suas respectivas datas de registro, mesmo quando a OS foi criada em outro mês.');
 section('Ordens de serviço criadas no mês ('+integer(detail.orders)+')');
 const list=detail.ordersCreated||[];
 const orderColumns=[
  {title:'OS',x:L+3},{title:'CLIENTE / SERVIÇO',x:43},
  {title:'SITUAÇÃO',x:145},{title:'VALOR',x:R-3,align:'right'}
 ];
 tableHeader(orderColumns);
 if(!list.length){
  tableRow([{value:'Nenhuma OS cadastrada no mês selecionado.',x:L+3}],{height:13});
 }else{
  list.forEach((order,i)=>{
   if(y+12>267){nextPage();section('Ordens de serviço • '+selected+' ('+(i+1)+'–'+list.length+')');tableHeader(orderColumns);}
   tableRow([
    {value:order.number||'—',x:L+3,maxWidth:23,bold:true},
    {value:(order.client_name||'Cliente não informado')+' • '+(order.title||'Serviço'),x:43,maxWidth:95},
    {value:order.stage_label||order.stage||'—',x:145,maxWidth:26},
    {value:currency(order.total),x:R-3,align:'right',maxWidth:24}
   ],{index:i,height:10});
  });
 }
 const count=pdf.getNumberOfPages();
 for(let page=1;page<=count;page++){
  pdf.setPage(page);
  pdf.setDrawColor(224,230,240);pdf.line(L,280,R,280);
  line('NG Studio • Relatório gerencial • Gerado em '+generated,L,285,{fontSize:7.3,rgb:muted,maxWidth:150});
  line(page+' / '+count,R,285,{fontSize:7.3,rgb:muted,align:'right'});
 }
 // Download direto sem abrir uma nova aba, igual às OS.
 const url=URL.createObjectURL(pdf.output('blob'));
 const link=document.createElement('a');
 link.href=url;link.download='NGStudio-Resultados-'+year+'-'+String(month+1).padStart(2,'0')+'.pdf';
 document.body.appendChild(link);
 try{link.click();}finally{
  link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
}
