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

let matched=0,uploaded=0,missing=0;
for(const [index,e] of entries.entries()){
  const base=path.basename(e.entryName);
  const m=base.match(/(\d{10,})/);
  if(!m){missing++;continue}
  const tseId=m[1];
  const {data:candidates,error:qerr}=await supabase.from("candidates").select("id,tse_candidate_id").eq("election_year",2026).eq("tse_candidate_id",tseId);
  if(qerr) throw qerr;
  if(!candidates?.length){missing++;continue}
  matched++;
  const ext=(base.split(".").pop()||"jpg").toLowerCase().replace("jpeg","jpg");
  const objectPath=`2026/PB/${tseId}.${ext}`;
  const contentType=ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg";
  const {error:upErr}=await supabase.storage.from(bucket).upload(objectPath,e.getData(),{contentType,upsert:true,cacheControl:"86400"});
  if(upErr) throw upErr;
  const {data:pub}=supabase.storage.from(bucket).getPublicUrl(objectPath);
  const {error:uerr}=await supabase.from("candidates").update({photo_url:pub.publicUrl}).eq("election_year",2026).eq("tse_candidate_id",tseId);
  if(uerr) throw uerr;
  uploaded++;
  if((index+1)%50===0) console.log(`Processadas ${index+1}/${entries.length} | vinculadas ${uploaded}`);
}
console.log(`Fotos no ZIP: ${entries.length}`);
console.log(`Correspondências no banco: ${matched}`);
console.log(`Fotos enviadas/vinculadas: ${uploaded}`);
console.log(`Sem correspondência: ${missing}`);
console.log("Importação de fotos concluída.");
