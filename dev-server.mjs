import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const port=Number(process.env.PORT||3000);
http.createServer(async(req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/') pathname='/index.html';
  const file=path.resolve(root, '.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  try {const info=await stat(file); if(!info.isFile())throw Error('not a file'); const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,()=>console.log(`NG Studio em http://localhost:${port}`));
