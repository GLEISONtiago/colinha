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
if (!candidatesZip) throw new Error("Informe --candidates=/caminho/consulta_cand_2026.zip");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY somente no ambiente local.");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const wanted = new Set(["DEPUTADO FEDERAL","DEPUTADO ESTADUAL","SENADOR","GOVERNADOR","PRESIDENTE"]);
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

const byId = [...new Map(rows.map(r => [r.tse_candidate_id, r])).values()];
console.log("Registros nacionais preparados:", byId.length);
for (let i=0;i<byId.length;i+=100) {
  const batch=byId.slice(i,i+100);
  const { error } = await supabase.from("candidates").upsert(batch,{onConflict:"election_year,tse_candidate_id"});
  if(error) throw error;
  console.log(`Importados ${Math.min(i+batch.length,byId.length)}/${byId.length}`);
}
console.log("Importação concluída.");