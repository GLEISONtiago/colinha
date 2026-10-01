import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { createClient } from "@supabase/supabase-js";

function arg(name) {
  const eq=process.argv.find(a=>a.startsWith(`--${name}=`));
  if(eq) return eq.slice(name.length+3);
  const i=process.argv.indexOf(`--${name}`);
  return i>=0 ? process.argv[i+1] : undefined;
}
const photosZip=arg("photos")||process.env.TSE_PHOTOS_ZIP;
const uf=(arg("uf")||process.env.TSE_PHOTOS_UF||"PB").toUpperCase();
if(!/^(?:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO|BR)$/.test(uf)) throw new Error("UF inválida.");
if(!photosZip) throw new Error("Informe --photos=\"C:\\caminho\\foto_cand2026_PB_div.zip\"");
if(!fs.existsSync(photosZip)) throw new Error(`Arquivo não encontrado: ${photosZip}`);

const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente local.");
const supabase=createClient(url,key,{auth:{persistSession:false}});
const bucket="candidate-photos";
const zip=new AdmZip(photosZip);
const entries=zip.getEntries().filter(e=>!e.isDirectory && /\.(jpe?g|png|webp)$/i.test(e.entryName));
if(!entries.length) throw new Error("Nenhuma imagem encontrada no ZIP.");

async function retry(fn,label,attempts=5){let last;for(let i=1;i<=attempts;i++){try{return await fn()}catch(e){last=e;console.warn(`${label}: tentativa ${i}/${attempts} falhou: ${e?.message||e}`);if(i<attempts)await new Promise(r=>setTimeout(r,Math.min(15000,750*2**(i-1))))}}throw last}
let matched=0,uploaded=0,missing=0;
const rows=[];
for(let from=0;;from+=1000){
  const page=await retry(async()=>{const r=await supabase.from("candidates").select("tse_candidate_id").eq("election_year",2026).eq("uf",uf).range(from,from+999);if(r.error)throw r.error;return r.data||[]},"lista de candidatos da UF");
  rows.push(...page);
  if(page.length<1000)break;
}
const candidateIds=new Set(rows.map(r=>String(r.tse_candidate_id)));
console.log(`Candidatos carregados para ${uf}: ${candidateIds.size}`);

const tasks=[];
for(const [index,e] of entries.entries()){
  const base=path.basename(e.entryName);
  const m=base.match(/(\d{10,})/);
  if(!m){missing++;continue}
  const tseId=m[1];
  if(!candidateIds.has(tseId)){missing++;continue}
  matched++;
  tasks.push({index,e,base,tseId});
}
const concurrency=Number(process.env.PHOTO_IMPORT_CONCURRENCY||8);
let cursor=0;
async function worker(){
  while(true){
    const i=cursor++;
    if(i>=tasks.length)return;
    const {index,e,base,tseId}=tasks[i];
    const ext=(base.split(".").pop()||"jpg").toLowerCase().replace("jpeg","jpg");
    const objectPath=`2026/${uf}/${tseId}.${ext}`;
    const contentType=ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg";
    await retry(async()=>{const {error}=await supabase.storage.from(bucket).upload(objectPath,e.getData(),{contentType,upsert:true,cacheControl:"86400"});if(error)throw error},`upload ${tseId}`);
    const {data:pub}=supabase.storage.from(bucket).getPublicUrl(objectPath);
    await retry(async()=>{const {error}=await supabase.from("candidates").update({photo_url:pub.publicUrl}).eq("election_year",2026).eq("tse_candidate_id",tseId);if(error)throw error},`update ${tseId}`);
    uploaded++;
    if(uploaded%100===0) console.log(`Vinculadas ${uploaded}/${tasks.length}`);
  }
}
await Promise.all(Array.from({length:Math.min(concurrency,tasks.length||1)},()=>worker()));
console.log(`Fotos no ZIP: ${entries.length}`);
console.log(`Correspondências no banco: ${matched}`);
console.log(`Fotos enviadas/vinculadas: ${uploaded}`);
console.log(`Sem correspondência: ${missing}`);
console.log(`Importação de fotos ${uf} concluída.`);
