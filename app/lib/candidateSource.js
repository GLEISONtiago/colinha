const URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
const FORCE_DEMO=process.env.NEXT_PUBLIC_DEMO_MODE==='true';

export const DEMO_NUMBERS={
  'DEPUTADO FEDERAL':'1234',
  'DEPUTADO ESTADUAL':'12345',
  'DEPUTADO DISTRITAL':'12345',
  'SENADOR':['123','124'],
  'GOVERNADOR':'12',
  'PRESIDENTE':'13'
};

export const isDemoConfigured=()=>FORCE_DEMO||!URL||!KEY;

function demoCandidate(c,n){
  const expected=DEMO_NUMBERS[c.office];
  const match=Array.isArray(expected)?expected.includes(n):expected===n;
  if(!match)return [];
  const suffix=c.office==='SENADOR'&&n==='124'?' B':'';
  return [{
    ballot_name:`CANDIDATURA DEMO${suffix}`,
    full_name:`Candidatura demonstrativa ${c.office}${suffix}`,
    party_abbreviation:'DEMO',
    party_number:Number(n.slice(0,2))||12,
    candidate_number:n,
    photo_url:null,
    tse_candidate_id:`demo-${c.uf}-${c.office}-${n}`,
    source_generated_at:null
  }];
}

export function demoParty(c,n){
  const prefix=n.slice(0,2);
  if(prefix==='12'||prefix==='13')return {party_abbreviation:'DEMO',party_number:Number(prefix)};
  return null;
}

async function supabaseRows(c,n,select){
  const q=new URLSearchParams({
    select,
    election_year:'eq.2026',
    uf:`eq.${c.uf}`,
    office:`eq.${c.office}`,
    candidate_number:`eq.${n}`,
    inserted_in_urn:'eq.true',
    is_substituted:'eq.false'
  });
  const r=await fetch(`${URL}/rest/v1/candidates?${q}`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
  if(!r.ok)throw new Error(`Supabase HTTP ${r.status}`);
  return r.json();
}

export async function fetchCandidates(c,n){
  if(isDemoConfigured())return {items:demoCandidate(c,n),demo:true};
  try{
    const items=await supabaseRows(c,n,'ballot_name,party_abbreviation,candidate_number,photo_url,tse_candidate_id,source_generated_at');
    return {items,demo:false};
  }catch{
    return {items:demoCandidate(c,n),demo:true};
  }
}

export async function fetchSimulatorCandidates(c,n){
  if(isDemoConfigured())return {items:demoCandidate(c,n),demo:true};
  try{
    const items=await supabaseRows(c,n,'ballot_name,party_abbreviation,candidate_number,photo_url,tse_candidate_id');
    return {items,demo:false};
  }catch{
    return {items:demoCandidate(c,n),demo:true};
  }
}

export async function fetchParty(c,n){
  if(isDemoConfigured())return {item:demoParty(c,n),demo:true};
  try{
    const q=new URLSearchParams({
      select:'party_abbreviation,party_number',
      election_year:'eq.2026',
      uf:`eq.${c.uf}`,
      office:`eq.${c.office}`,
      party_number:`eq.${Number(n.slice(0,2))}`,
      inserted_in_urn:'eq.true',
      is_substituted:'eq.false',
      limit:'1'
    });
    const r=await fetch(`${URL}/rest/v1/candidates?${q}`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
    if(!r.ok)throw new Error(`Supabase HTTP ${r.status}`);
    const rows=await r.json();
    return {item:rows[0]||null,demo:false};
  }catch{
    return {item:demoParty(c,n),demo:true};
  }
}
