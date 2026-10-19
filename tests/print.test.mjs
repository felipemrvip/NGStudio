import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPrintHtml} from '../assets/print.js';
import {defaultSettings} from '../assets/logic.mjs';
const os={number:'FEL-1473',title:'Estampa + ADS',client_name:'Wallacy',client_phone:'21999999999',attendant:'FELIPE',stage:'andamento',method:'PIX',created_at:'2026-09-29T12:00:00',due_date:'2026-10-20',total:800,payments:[{amount:400,method:'PIX',date:'2026-09-29'}],attachments:[{id:'a',name:'print.png',dataUrl:'data:image/png;base64,iVBORw0KGgo=',include_pdf:true,size:'large',caption:'Frente da camiseta'},{id:'b',name:'interna.png',dataUrl:'data:image/png;base64,iVBORw0KGgo=',include_pdf:false}],items:[{description:'Estampa + ADS',quantity:1,unit_price:800}]};
test('PDF contém cliente, número e valores calculados',()=>{const html=buildPrintHtml(os,defaultSettings);assert.match(html,/FEL-1473/);assert.match(html,/Wallacy/);assert.match(html,/R\$&nbsp;400,00|R\$ 400,00/);assert.match(html,/Salvar PDF/);});
test('PDF inclui apenas imagens permitidas',()=>{const html=buildPrintHtml(os,defaultSettings);assert.match(html,/Frente da camiseta/);assert.equal((html.match(/<figure/g)||[]).length,1);});
test('PDF escapa conteúdo não confiável',()=>{const html=buildPrintHtml({...os,client_name:'<script>alert(1)</script>'},defaultSettings);assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);assert.match(html,/&lt;script&gt;/);});
