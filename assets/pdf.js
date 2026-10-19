import {buildPrintHtml} from './print.js';

// Exporta o MESMO modelo HTML usado pela prévia e pela impressão.
// html2pdf gera o arquivo no navegador, sem pop-up ou diálogo de impressão.
const LIB_URL='https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
function filename(number){
 return 'OS-'+String(number||'SEM-NUMERO').replace(/[^A-Za-z0-9_-]/g,'-').slice(0,70)+'.pdf';
}
function waitForFrame(frame,html){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('A prévia demorou muito para carregar.')),20000);
  frame.onload=()=>{clearTimeout(timer);resolve();};
  frame.onerror=()=>{clearTimeout(timer);reject(Error('Não foi possível preparar o documento.'));};
  frame.srcdoc=html;
 });
}
function waitForImages(doc){
 return Promise.all(Array.from(doc.images).map(img=>{
  if(img.complete)return img.naturalWidth?Promise.resolve():Promise.reject(Error('Uma imagem da OS não pôde ser carregada.'));
  return new Promise((resolve,reject)=>{
   img.addEventListener('load',resolve,{once:true});
   img.addEventListener('error',()=>reject(Error('Uma imagem da OS não pôde ser carregada.')),{once:true});
  });
 }));
}
function loadPdfLibrary(doc){
 return new Promise((resolve,reject)=>{
  if(doc.defaultView.html2pdf){resolve();return;}
  const script=doc.createElement('script');
  script.src=LIB_URL;
  script.onload=()=>doc.defaultView.html2pdf?resolve():reject(Error('Biblioteca de PDF indisponível.'));
  script.onerror=()=>reject(Error('Não foi possível carregar o gerador de PDF. Verifique sua conexão.'));
  doc.head.appendChild(script);
 });
}
export async function downloadOrderPdf(order,settings,images=[]){
 const frame=document.createElement('iframe');
 frame.setAttribute('aria-hidden','true');
 frame.tabIndex=-1;
 frame.style.cssText='position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;opacity:0;pointer-events:none;';
 document.body.appendChild(frame);
 try{
  await waitForFrame(frame,buildPrintHtml(order,settings,images));
  const doc=frame.contentDocument;
  if(!doc)throw Error('Não foi possível acessar o documento para exportação.');
  // O arquivo e a prévia compartilham a mesma marcação e estilos.
  const main=doc.querySelector('main');
  if(!main)throw Error('Modelo da OS não encontrado.');
  const style=doc.createElement('style');
  style.textContent='body{background:white!important}main{margin:0!important;box-shadow:none!important;min-height:0!important}.printbar{display:none!important}';
  doc.head.appendChild(style);
  await waitForImages(doc);
  await loadPdfLibrary(doc);
  await doc.defaultView.html2pdf().set({
   margin:0,
   filename:filename(order.number),
   image:{type:'jpeg',quality:.96},
   html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0,windowWidth:794},
   jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},
   pagebreak:{mode:['css','legacy']}
  }).from(main).save();
 }finally{
  frame.remove();
 }
}
