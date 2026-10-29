const {app, BrowserWindow, session, shell, dialog} = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const PORT = 49185;
const ORIGIN = `http://127.0.0.1:${PORT}`;
let server;

if (!app.requestSingleInstanceLock()) app.quit();
else app.on('second-instance', () => { const win=BrowserWindow.getAllWindows()[0]; if(win){if(win.isMinimized())win.restore();win.focus()} });

function startServer(){return new Promise((resolve,reject)=>{
  server=http.createServer((req,res)=>{
    if(req.method!=='GET' && req.method!=='HEAD'){res.writeHead(405);return res.end()}
    const files={'/': ['index.html','text/html; charset=utf-8'], '/index.html':['index.html','text/html; charset=utf-8'], '/app.js':['app.js','text/javascript; charset=utf-8'], '/audio-engine.mjs':['audio-engine.mjs','text/javascript; charset=utf-8']};
    const pathname=new URL(req.url,ORIGIN).pathname;
    const assets={'/vendor/vision_bundle.mjs':['vendor/vision_bundle.mjs','text/javascript; charset=utf-8'],'/vendor/hand_landmarker.task':['vendor/hand_landmarker.task','application/octet-stream'],'/vendor/wasm/vision_wasm_internal.js':['vendor/wasm/vision_wasm_internal.js','text/javascript; charset=utf-8'],'/vendor/wasm/vision_wasm_internal.wasm':['vendor/wasm/vision_wasm_internal.wasm','application/wasm'],'/vendor/wasm/vision_wasm_nosimd_internal.js':['vendor/wasm/vision_wasm_nosimd_internal.js','text/javascript; charset=utf-8'],'/vendor/wasm/vision_wasm_nosimd_internal.wasm':['vendor/wasm/vision_wasm_nosimd_internal.wasm','application/wasm']};
    const item=files[pathname]||assets[pathname];
    if(!item){res.writeHead(404);return res.end('Not found')}
    const file=path.join(__dirname,'web',item[0]);
    res.writeHead(200,{'Content-Type':item[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(file).on('error',()=>res.end()).pipe(res);
  });
  server.once('error',reject);server.listen(PORT,'127.0.0.1',resolve);
})}

app.whenReady().then(async()=>{
  try{await startServer()}catch(err){dialog.showErrorBox('Finger Loop Studio',`アプリを起動できませんでした。ポート ${PORT} が使用されていないか確認してください。\n\n${err.message}`);app.quit();return}
  const ses=session.defaultSession;
  ses.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(details,callback)=>{
    callback({cancel:new URL(details.url).origin!==ORIGIN});
  });
  ses.setPermissionCheckHandler((webContents,permission,origin,details)=>permission==='media' && origin===ORIGIN && details.mediaType!=='audio');
  ses.setPermissionRequestHandler((webContents,permission,callback,details)=>{
    const origin=details.requestingUrl ? new URL(details.requestingUrl).origin : '';
    const types=details.mediaTypes || [];
    callback(permission==='media' && origin===ORIGIN && types.includes('video') && !types.includes('audio'));
  });
  const win=new BrowserWindow({width:1440,height:960,minWidth:740,minHeight:620,backgroundColor:'#111312',title:'Finger Loop Studio',icon:path.join(__dirname,'build',process.platform==='darwin'?'icon.png':'icon.ico'),autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'}});
  win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==ORIGIN)event.preventDefault()});
  await win.loadURL(ORIGIN);
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{if(server)server.close()});
