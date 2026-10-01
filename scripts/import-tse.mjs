import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import AdmZip from "adm-zip";
import { createClient } from "@supabase/supabase-js";

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, "").split("=");
  return [k, v.join("=")];
}));
const candidatesZip = args.candidates || process.env.TSE_CANDIDATES_ZIP;
const complementaryZip = args.complementary || process.env.TSE_COMPLEMENTARY_ZIP;
if (!candidatesZip) throw new Error("Informe --candidates=/caminho/consulta_cand_2026.zip");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY somente no ambiente local.");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const wanted = new Set(["DEPUTADO FEDERAL","DEPUTADO ESTADUAL","DEPUTADO DISTRITAL","SENADOR","GOVERNADOR","PRESIDENTE"]);
const zip = new AdmZip(candidatesZip);
const entries = zip.getEntries().filter(e => /consulta_cand_2026_(?:[A-Z]{2}|BRASIL)\.csv$/i.test(e.entryName) && !/BRASIL\.csv$/i.test(e.entryName));
if (!entries.length) throw new Error("Nenhum CSV por UF encontrado no ZIP.");

const rows = [];
for (const entry of entries) {
  const csv = entry.getData().toString("latin1");
  const data = parse(csv, { columns: true, delimiter: ";", skip_empty_lines: true, relax_quotes: true });
  for (const r of data) {
    const office = r.DS_CARGO;
    if (!wanted.has(office)) continue;
    if (office === "PRESIDENTE" ? r.SG_UF !== "BR" : r.SG_UF === "BR") continue;
    rows.push({
      election_year: Number(r.ANO_ELEICAO),
      uf: r.SG_UF,
      office,
      candidate_number: String(r.NR_CANDIDATO),
      ballot_name: r.NM_URNA_CANDIDATO,
      full_name: r.NM_CANDIDATO,
      party_abbreviation: r.SG_PARTIDO,
      party_number: Number(r.NR_PARTIDO) || null,
      tse_candidate_id: String(r.SQ_CANDIDATO),
      registration_status: r.DS_SITUACAO_CANDIDATURA || null
    });
  }
}

function yesNo(v){
  const n=String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
  if(n==="S"||n==="SIM") return true;
  if(n==="N"||n==="NAO") return false;
  return null;
}
function generatedAt(date,time){
  const m=String(date||"").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m||!time)return null;
  const iso=`${m[3]}-${m[2]}-${m[1]}T${time}-03:00`;
  const d=new Date(iso);
  return Number.isNaN(d.getTime())?null:d.toISOString();
}
const byId = [...new Map(rows.map(r => [r.tse_candidate_id, r])).values()];

if(complementaryZip){
  if(!fs.existsSync(complementaryZip)) throw new Error(`Arquivo complementar não encontrado: ${complementaryZip}`);
  const compZip=new AdmZip(complementaryZip);
  const compEntries=compZip.getEntries().filter(e=>/consulta_cand_complementar_2026_(?:[A-Z]{2}|BR)\.csv$/i.test(e.entryName));
  const compById=new Map();
  for(const entry of compEntries){
    const csv=entry.getData().toString("latin1");
    const data=parse(csv,{columns:true,delimiter:";",skip_empty_lines:true,relax_quotes:true});
    for(const r of data){
      const id=String(r.SQ_CANDIDATO||"");
      if(!id)continue;
      compById.set(id,{
        candidate_election_status:r.DS_SITUACAO_CANDIDATO_PLEITO||null,
        candidate_urn_status:r.DS_SITUACAO_CANDIDATO_URNA||null,
        inserted_in_urn:yesNo(r.ST_CANDIDATO_INSERIDO_URNA),
        vote_destination:r.NM_TIPO_DESTINACAO_VOTOS||null,
        is_substituted:yesNo(r.ST_SUBSTITUIDO),
        substituted_candidate_id:r.SQ_SUBSTITUIDO&&String(r.SQ_SUBSTITUIDO)!=="-1"?String(r.SQ_SUBSTITUIDO):null,
        judgement_status:r.DS_SITUACAO_JULGAMENTO||null,
        complementary_generated_at:generatedAt(r.DT_GERACAO,r.HH_GERACAO)
      });
    }
  }
  let merged=0;
  for(const row of byId){const extra=compById.get(row.tse_candidate_id);if(extra){Object.assign(row,extra);merged++;}}
  console.log("Registros com situação complementar:",merged);
}else{
  console.warn("ZIP complementar não informado; situação de urna/substituição não será atualizada.");
}
console.log("Registros nacionais preparados:", byId.length);
for (let i=0;i<byId.length;i+=100) {
  const batch=byId.slice(i,i+100);
  const { error } = await supabase.from("candidates").upsert(batch,{onConflict:"election_year,tse_candidate_id"});
  if(error) throw error;
  console.log(`Importados ${Math.min(i+batch.length,byId.length)}/${byId.length}`);
}
console.log("Importação concluída.");