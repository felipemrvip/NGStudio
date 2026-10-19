/** Supabase REST/Auth sem SDK: nenhum token de serviço é incluído no navegador. */
const config=globalThis.NG_CONFIG||{};
export const isConfigured=Boolean(config.supabaseUrl&&config.supabaseAnonKey);
const base=String(config.supabaseUrl||'').replace(/\/$/,'');
const anon=String(config.supabaseAnonKey||'');
const sessionKey='ngstudio_session_v1';
let session=null;
let rememberSession=true;
export function getSession(){return session;}
export function authUserId(){if(!session?.access_token)return null;try{return JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub;}catch{return null;}}
function saveSession(value){session=value;localStorage.removeItem(sessionKey);sessionStorage.removeItem(sessionKey);if(value)(rememberSession?localStorage:sessionStorage).setItem(sessionKey,JSON.stringify(value));}
function parseSession(value){if(!value)return null;const saved={...value};if(saved.expires_in&&!saved.expires_at)saved.expires_at=Math.floor(Date.now()/1000)+Number(saved.expires_in);return saved;}
async function request(endpoint,{method='GET',body,token,headers={}}={}){
 const res=await fetch(base+endpoint,{method,headers:{apikey:anon,Authorization:`Bearer ${token||session?.access_token||anon}`,...headers},body:body===undefined?undefined:headers['Content-Type']==='application/json'?JSON.stringify(body):body});
 const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
 if(!res.ok){const msg=data?.msg||data?.message||data?.error_description||data?.error||`HTTP ${res.status}`;throw Error(String(msg));}
 return data;
}
export async function restoreSession(){if(!isConfigured)return null;let stored;try{stored=parseSession(JSON.parse(localStorage.getItem(sessionKey)||sessionStorage.getItem(sessionKey)||'null'));}catch{return null;}if(!stored)return null;rememberSession=Boolean(localStorage.getItem(sessionKey));session=stored;try{await ensureToken();return session;}catch{saveSession(null);return null;}}
export async function signin(email,password,remember=true){rememberSession=Boolean(remember);const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},token:anon,headers:{'Content-Type':'application/json'}});saveSession(parseSession(result));return session;}
export async function signout(){try{if(session)await request('/auth/v1/logout',{method:'POST'});}catch{}saveSession(null);}
async function ensureToken(){if(!session)throw Error('Sessão expirada. Faça login novamente.');if(session.expires_at&&session.expires_at>Date.now()/1000+90)return; if(!session.refresh_token)throw Error('Sessão expirada.');const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},token:anon,headers:{'Content-Type':'application/json'}});saveSession(parseSession(next));}
async function rest(table,params='',method='GET',body){await ensureToken();return request(`/rest/v1/${table}${params}`,{method,body,headers:{'Content-Type':'application/json',Prefer:method==='POST'?'return=representation,resolution=merge-duplicates':'return=representation'}});}
/** Pagina a leitura do Supabase para não truncar silenciosamente a lista em 2.000 registros. */
async function fetchAllRows(table){
 const pageSize=1000,all=[];
 for(let offset=0;;offset+=pageSize){
  const rows=await rest(table,`?select=*&order=created_at.desc,id.desc&limit=${pageSize}&offset=${offset}`);
  all.push(...rows);
  if(rows.length<pageSize)break;
 }
 return all;
}
export async function loadAll(){
 const [orders,clients,settings]=await Promise.all([
  fetchAllRows('ng_orders'),fetchAllRows('ng_clients'),rest('ng_settings','?select=*&limit=1')
 ]);
 return {orders,clients,settings:settings[0]||null};
}
/** Soma os metadados dos arquivos realmente armazenados no bucket privado ng-anexos.
 * Usa somente a sessão autenticada; inclui arquivos órfãos que ainda estejam no bucket.
 */
export async function storageUsage(){
 await ensureToken();
 const userId=authUserId();
 if(!userId)throw Error('Usuário não autenticado');
 const queue=[userId];
 const limit=1000;
 let bytes=0,files=0,unknownSize=0,folders=0;
 while(queue.length){
  const prefix=queue.shift();
  folders++;
  for(let offset=0;;offset+=limit){
   const entries=await request('/storage/v1/object/list/ng-anexos',{
    method:'POST',
    body:{prefix,limit,offset,sortBy:{column:'name',order:'asc'}},
    headers:{'Content-Type':'application/json'}
   });
   if(!Array.isArray(entries))throw Error('Resposta inesperada ao consultar os anexos.');
   for(const item of entries){
    if(!item?.name)continue;
    // O Storage API lista diretórios virtuais com id/metadata nulos.
    if(item.id==null&&item.metadata==null){
     queue.push(prefix+'/'+item.name);
     continue;
    }
    files++;
    const size=Number(item.metadata?.size);
    if(Number.isFinite(size)&&size>=0)bytes+=size;
    else unknownSize++;
   }
   if(entries.length<limit)break;
  }
 }
 return {bytes,files,unknownSize,folders,updatedAt:new Date().toISOString()};
}

export async function persistOrder(order,exists){
 const fields={...order};
 delete fields._temporary;
 delete fields._preview;
 fields.due_date=fields.due_date||null;
 const owner=authUserId();
 if(!owner)throw Error('Usuário não autenticado. Entre novamente no NG Studio.');
 // O dono de uma OS existente nunca deve ser modificado pelo cliente.
 if(exists)delete fields.owner_id;
 else fields.owner_id=owner;
 const data=exists
  ?await rest('ng_orders',`?id=eq.${encodeURIComponent(order.id)}&owner_id=eq.${encodeURIComponent(owner)}`,'PATCH',fields)
  :await rest('ng_orders','','POST',fields);
 if(!Array.isArray(data)||data.length!==1)throw Error('OS não encontrada na conta atual. Atualize a página e entre novamente.');
 return data[0];
}
/** Exclui apenas uma OS pertencente ao usuário autenticado (RLS reforça a restrição). */
export async function deleteOrder(orderId){
 const owner=authUserId();
 if(!owner)throw Error('Usuário não autenticado');
 const deleted=await rest('ng_orders',`?id=eq.${encodeURIComponent(orderId)}&owner_id=eq.${encodeURIComponent(owner)}`,'DELETE');
 if(!Array.isArray(deleted)||deleted.length!==1)throw Error('Ordem não encontrada ou já excluída. Atualize a lista.');
 return deleted[0];
}
/** Remove os anexos privados referenciados pela OS após sua exclusão. */
export async function deleteOrderAttachments(order){
 await ensureToken();
 const owner=authUserId();
 if(!owner)throw Error('Usuário não autenticado');
 const prefix=`${owner}/${order.id}/`;
 const paths=[...new Set((order.attachments||[])
   .map(a=>a.storage_path)
   .filter(path=>typeof path==='string'&&path.startsWith(prefix)&&path.length>prefix.length))];
 if(!paths.length)return;
 await request('/storage/v1/object/ng-anexos',{
   method:'DELETE',body:{prefixes:paths},headers:{'Content-Type':'application/json'}
 });
}
export async function persistClient(client,exists){const fields={...client,owner_id:authUserId()};const data=exists?await rest('ng_clients',`?id=eq.${encodeURIComponent(client.id)}`,'PATCH',fields):await rest('ng_clients','','POST',fields);return data[0];}
export async function persistSettings(settings){const data=await rest('ng_settings','?on_conflict=owner_id','POST',{...settings,owner_id:authUserId()});return data[0];}
export async function uploadImage(orderId,file){
 await ensureToken();
 const userId=authUserId();
 if(!userId)throw Error('Sessão sem identificação de usuário. Entre novamente.');
 const ext=(file.name?.split('.').pop()||'png').replace(/[^a-z0-9]/gi,'').toLowerCase()||'png';
 const path=`${userId}/${orderId}/${crypto.randomUUID()}.${ext}`;
 try{
  await request(`/storage/v1/object/ng-anexos/${path}`,{
   method:'POST',
   body:file,
   headers:{'Content-Type':file.type||'image/png'}
  });
 }catch(e){
  const detail=/row-level security policy/i.test(e.message)
   ?'O Supabase recusou a gravação no bucket ng-anexos (política RLS).'
   :e.message;
  throw Error(detail);
 }
 return path;
}
export async function signImage(path){await ensureToken();const data=await request(`/storage/v1/object/sign/ng-anexos/${path}`,{method:'POST',body:{expiresIn:3600},headers:{'Content-Type':'application/json'}});const signed=data?.signedURL||data?.signedUrl;if(!signed)throw Error('URL de imagem indisponível');return signed.startsWith('http')?signed:`${base}/storage/v1${signed.startsWith('/')?'':'/'}${signed}`;}

export async function issueNumber(prefix){await ensureToken();return request('/rest/v1/rpc/ng_next_number',{method:'POST',body:{p_prefix:prefix},headers:{'Content-Type':'application/json'}});}
