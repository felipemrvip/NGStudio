const now=new Date();
const ago=(days)=>{const d=new Date();d.setDate(d.getDate()-days);return d.toISOString();};
export function seedDemo(){
 const entries=[
 ['FEL-1473','ESTAMPA + ADS','Agência Moderna','21998573018','andamento',800,400,2],
 ['FEL-1474','20 CAMISAS SUBLIMAÇÃO','Jorge Eventos','21983371002','producao',700,600,1],
 ['FEL-1475','10 BLOCOS 10×14','Mercado Bom Preço','21981112222','andamento',230,115,3],
 ['FEL-1476','PLACA + CARTÃO + ADS + LOGO','Gabi Studio','21997737116','producao',1090,400,5],
 ['FEL-1477','ADESIVO RECORTE — 2 UNID.','Letícia','21965832183','pronto',120,120,4],
 ['FEL-1478','3 CAMISAS PRETAS','Academia Fit','21983319604','entregue',165,165,6],
 ['FEL-1479','CARTÃO — MELKIN','Honey','21966875007','producao',110,110,1],
 ['FEL-1480','ADESIVO UV','Loja Estilo','21969994546','pronto',50,20,2],
 ['FEL-1481','UNICESSUMAR','Unicesumar','21965555555','andamento',0,0,5],
 ['FEL-1482','100 COPOS LONGDRINK','Restaurante Sabor','21960183661','andamento',460,260,6],
 ['FEL-1483','DTF — FLAMENGO','Clínica Vida','21975441108','entregue',252,252,7],
 ['FEL-1484','5 CAMISAS PERSONALIZADAS','Studio Pixel','21979661896','producao',365,200,0]
 ];
 const orders=entries.map(([number,title,client_name,client_phone,stage,total,sinal,days],i)=>({id:`demo-${i+1}`,number,title,client_name,client_phone,stage,total,attendant:'FELIPE',method:i%4===0?'DINHEIRO':'PIX',created_at:ago(days),due_date:ago(Math.max(0,days-2)).slice(0,10),delivered_at:stage==='entregue'?ago(days-1):null,notes:'',items:[{description:title,quantity:1,unit_price:total}],payments:sinal?[{id:`pm-${i}`,amount:sinal,method:i%4===0?'Dinheiro':'PIX',date:ago(days),note:'Pagamento inicial'}]:[],attachments:[],history:[{action:'Ordem de serviço criada',date:ago(days)}]}));
 const clients=[...new Map(orders.map(o=>[o.client_name.toLowerCase(),{id:`cli-${o.id}`,name:o.client_name,phone:o.client_phone,created_at:o.created_at}])).values()];
 return {orders,clients};
}
