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
