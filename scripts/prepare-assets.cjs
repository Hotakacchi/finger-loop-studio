const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const root=path.resolve(__dirname,'..');
const vendor=path.join(root,'web','vendor');
const pkg=path.join(root,'node_modules','@mediapipe','tasks-vision');
const model=path.join(vendor,'hand_landmarker.task');
const expected='fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1';
const url='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
function valid(){return fs.existsSync(model)&&crypto.createHash('sha256').update(fs.readFileSync(model)).digest('hex')===expected}
async function main(){
  fs.mkdirSync(path.join(vendor,'wasm'),{recursive:true});
  fs.copyFileSync(path.join(pkg,'vision_bundle.mjs'),path.join(vendor,'vision_bundle.mjs'));
  for(const name of ['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm'])fs.copyFileSync(path.join(pkg,'wasm',name),path.join(vendor,'wasm',name));
  if(!valid()){
    const response=await fetch(url,{signal:AbortSignal.timeout(120000)});
    if(!response.ok||!response.body)throw new Error(`Model download failed: HTTP ${response.status}`);
    const temp=model+'.download';
    try{await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(temp));const hash=crypto.createHash('sha256').update(fs.readFileSync(temp)).digest('hex');if(hash!==expected)throw new Error('Unexpected hand model checksum');fs.renameSync(temp,model)}finally{fs.rmSync(temp,{force:true})}
  }
  console.log('Offline hand tracking assets ready.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
