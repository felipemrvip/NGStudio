import {money,fmtDate,paid,remaining,paymentStatus,stageLabel} from './logic.mjs';

// PDF vetorial gerado no navegador: sem pop-up e sem janela de impressão.
const JSPDF_URL='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
let jspdfLoading=null;
function loadJsPDF(){
 if(globalThis.jspdf?.jsPDF)return Promise.resolve(globalThis.jspdf.jsPDF);
 if(!jspdfLoading){
  jspdfLoading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=JSPDF_URL;
   script.async=true;
   script.onload=()=>globalThis.jspdf?.jsPDF?resolve(globalThis.jspdf.jsPDF):reject(Error('A biblioteca de PDF não carregou.'));
   script.onerror=()=>reject(Error('Não foi possível carregar o gerador de PDF. Verifique sua conexão.'));
   document.head.appendChild(script);
  }).catch(error=>{jspdfLoading=null;throw error;});
 }
 return jspdfLoading;
}
const palette={navy:[27,46,80],navy2:[16,34,59],yellow:[255,202,48],ink:[27,43,66],muted:[102,118,139],line:[220,229,240],paper:[243,246,251],green:[19,143,105]};
function fill(doc,color){doc.setFillColor(...color);}
function stroke(doc,color){doc.setDrawColor(...color);}
function color(doc,value){doc.setTextColor(...value);}
function text(doc,value,x,y,size=10,bold=false,tint=palette.ink,opts={}){
 doc.setFont('helvetica',bold?'bold':'normal');
 doc.setFontSize(size);color(doc,tint);
 doc.text(String(value??''),x,y,opts);
}
function cleanFilename(value){return String(value||'SEM-NUMERO').replace(/[^A-Za-z0-9_-]/g,'-').slice(0,70);}
function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Não foi possível ler a imagem.'));reader.readAsDataURL(blob);});}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Uma imagem anexada não pôde ser aberta.'));img.src=src;});}
async function prepareImage(src,rotation=0){
 let source=src;
 if(/^https:\/\//i.test(src)){
  const response=await fetch(src,{mode:'cors'});
  if(!response.ok)throw Error('Não foi possível acessar uma imagem anexada.');
  source=await blobToDataUrl(await response.blob());
 }
 if(!/^data:image\//i.test(source))throw Error('Formato de imagem não suportado no PDF.');
 const img=await loadImage(source);
 const angle=((Number(rotation)||0)%360+360)%360;
 const quarter=angle===90||angle===270;
 const naturalWidth=img.naturalWidth||img.width;
 const naturalHeight=img.naturalHeight||img.height;
 const maxEdge=1600;
 const ratio=Math.min(1,maxEdge/Math.max(naturalWidth,naturalHeight));
 const w=Math.max(1,Math.round(naturalWidth*ratio));
 const h=Math.max(1,Math.round(naturalHeight*ratio));
 const canvas=document.createElement('canvas');
 canvas.width=quarter?h:w;
 canvas.height=quarter?w:h;
 const ctx=canvas.getContext('2d');
 fillCanvas(ctx,canvas.width,canvas.height);
 ctx.translate(canvas.width/2,canvas.height/2);
 ctx.rotate(angle*Math.PI/180);
 ctx.drawImage(img,-w/2,-h/2,w,h);
 return {data:canvas.toDataURL('image/jpeg',.88),width:canvas.width,height:canvas.height};
}
function fillCanvas(ctx,width,height){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);}
export async function downloadOrderPdf(order,settings,images=[]){
 const JsPDF=await loadJsPDF();
 const doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const W=210,H=297,M=16,usable=W-2*M;
 let y=0;
 function header(continued=false){
  fill(doc,palette.navy);doc.rect(0,0,W,36,'F');
  fill(doc,palette.yellow);doc.rect(0,36,W,2.2,'F');
  text(doc,'NG',M,20,24,true,[255,255,255]);
  text(doc,'PrintSign',M+24,20,15,true,palette.yellow);
  text(doc,String(settings.company||'NG PrintSign Gráfica'),M,28,8,false,[210,222,238]);
  text(doc,continued?'CONTINUAÇÃO DA ORDEM DE SERVIÇO':'ORDEM DE SERVIÇO',W-M,17,10,true,[255,255,255],{align:'right'});
  text(doc,String(order.number||'—'),W-M,27,12,true,palette.yellow,{align:'right'});
  y=47;
 }
 function nextPage(){
  doc.addPage();header(true);
 }
 function space(height){
  if(y+height>H-22)nextPage();
 }
 function section(label){
  space(16);
  fill(doc,palette.yellow);doc.rect(M,y-3,3,5,'F');
  text(doc,label.toUpperCase(),M+7,y+1,10,true,palette.navy);
  y+=11;
 }
 function lines(value,x,width,fontSize=10,bold=false,tint=palette.ink,lineHeight=5.2){
  doc.setFont('helvetica',bold?'bold':'normal');
  doc.setFontSize(fontSize);
  const parts=doc.splitTextToSize(String(value||'—'),width);
  for(const part of parts){
   space(lineHeight+2);
   text(doc,part,x,y,fontSize,bold,tint);
   y+=lineHeight;
  }
 }
 function field(label,value,x,width){
  text(doc,label.toUpperCase(),x,y,7.5,true,palette.muted);
  y+=6;
  lines(value,x,width,10,true);
 }
 function divider(){
  stroke(doc,palette.line);doc.setLineWidth(.25);doc.line(M,y,W-M,y);
  y+=8;
 }
 header();
 section('Dados do pedido');
 const clientY=y;
 field('Cliente',order.client_name||'—',M,83);
 const leftEnd=y;
 y=clientY;
 field('Telefone / WhatsApp',order.client_phone||'—',M+93,85);
 y=Math.max(y,leftEnd)+5;
 const dateY=y;
 field('Data de criação',fmtDate(order.created_at),M,83);
 const dateEnd=y;
 y=dateY;
 field('Responsável',order.attendant||'—',M+93,85);
 y=Math.max(y,dateEnd)+3;
 divider();
 section('Serviço solicitado');
 lines(order.title||'—',M,usable,13,true,palette.ink,7);
 y+=4;
 if(order.notes?.trim()){
  text(doc,'ESPECIFICAÇÕES / OBSERVAÇÕES',M,y,7.5,true,palette.muted);y+=7;
  for(const line of String(order.notes).split(/\r?\n/)){
   if(line.trim())lines(line,M,usable,9,false,palette.ink,4.8);
   else {space(4);y+=4;}
  }
  y+=5;
 }
 section('Resumo financeiro');
 space(44);
 const panelY=y-4;
 fill(doc,palette.paper);stroke(doc,palette.line);doc.roundedRect(M,panelY,usable,41,3,3,'FD');
 text(doc,'Valor total',M+8,panelY+11,9,false,palette.muted);
 text(doc,money(order.total),W-M-8,panelY+11,10,true,palette.ink,{align:'right'});
 text(doc,'Valor recebido ('+paymentStatus(order)+')',M+8,panelY+22,9,false,palette.muted);
 text(doc,money(paid(order)),W-M-8,panelY+22,10,true,palette.green,{align:'right'});
 stroke(doc,palette.line);doc.line(M+8,panelY+27,W-M-8,panelY+27);
 text(doc,'SALDO RESTANTE',M+8,panelY+36,10,true,palette.navy);
 text(doc,money(remaining(order)),W-M-8,panelY+36,12,true,palette.navy,{align:'right'});
 y=panelY+49;
 space(13);
 text(doc,'Situação do serviço: '+stageLabel(order.stage),M,y,9,true,palette.navy);y+=7;
 if((order.attachments||[]).some(a=>a.include_pdf!==false)){
  y+=4;section('Imagens e referências');
  for(let i=0;i<order.attachments.length;i++){
   const attachment=order.attachments[i];
   if(attachment.include_pdf===false)continue;
   const src=images.find(item=>item.id===attachment.id)?.src||attachment.dataUrl||'';
   if(!src)throw Error('A imagem "'+(attachment.name||String(i+1))+'" ainda não está disponível. Tente novamente.');
   const prepared=await prepareImage(src,attachment.rotation);
   const maxWidth=attachment.size==='small'?95:attachment.size==='large'?usable:145;
   const maxHeight=attachment.size==='small'?75:attachment.size==='large'?195:130;
   const scale=Math.min(maxWidth/prepared.width,maxHeight/prepared.height);
   const width=prepared.width*scale;
   const height=prepared.height*scale;
   const caption=attachment.caption||attachment.name||'Imagem '+(i+1);
   doc.setFont('helvetica','normal');doc.setFontSize(8);
   const captionLines=doc.splitTextToSize(String(caption),usable);
   const required=height+captionLines.length*4.5+11;
   if(y+required>H-22)nextPage();
   const x=M+(usable-width)/2;
   stroke(doc,palette.line);doc.setLineWidth(.2);doc.rect(x-.5,y-.5,width+1,height+1);
   doc.addImage(prepared.data,'JPEG',x,y,width,height,undefined,'FAST');
   y+=height+6;
   for(const line of captionLines){space(5);text(doc,line,M,y,8,false,palette.muted);y+=4.5;}
   y+=7;
  }
 }
 const pages=doc.internal.getNumberOfPages();
 for(let page=1;page<=pages;page++){
  doc.setPage(page);
  stroke(doc,palette.line);doc.setLineWidth(.25);doc.line(M,H-18,W-M,H-18);
  text(doc,String(settings.legalName||settings.company||'NG PrintSign')+'  •  CNPJ '+String(settings.cnpj||'—'),M,H-13,7,false,palette.muted);
  text(doc,String(settings.footer||'Documento de controle de serviço. Não substitui nota fiscal.'),M,H-8,7,false,palette.muted);
  text(doc,page+' / '+pages,W-M,H-8,7,true,palette.muted,{align:'right'});
 }
 doc.save('OS-'+cleanFilename(order.number)+'.pdf');
}
