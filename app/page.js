'use client';
import {useEffect,useState} from 'react';

const SUPABASE_URL='https://lyagstynyfupldvbzgpb.supabase.co';
const SUPABASE_KEY='sb_publishable_g3yKs7jTypCIgmXmaJAeUg_PGSkZAhy';

const cargos=[
 {id:'depFederal',label:'DEPUTADA OU DEPUTADO FEDERAL',office:'DEPUTADO FEDERAL',digits:4,uf:'PB'},
 {id:'depEstadual',label:'DEPUTADA OU DEPUTADO ESTADUAL',office:'DEPUTADO ESTADUAL',digits:5,uf:'PB'},
 {id:'senador1',label:'SENADORA OU SENADOR — 1ª VAGA',office:'SENADOR',digits:3,uf:'PB'},
 {id:'senador2',label:'SENADORA OU SENADOR — 2ª VAGA',office:'SENADOR',digits:3,uf:'PB'},
 {id:'governador',label:'GOVERNADORA OU GOVERNADOR',office:'GOVERNADOR',digits:2,uf:'PB'},
 {id:'presidente',label:'PRESIDENTA OU PRESIDENTE',office:'PRESIDENTE',digits:2,uf:'BR'},
];

async function buscar(c,numero){
 const qs=new URLSearchParams({select:'ballot_name,party_abbreviation,candidate_number,photo_url,tse_candidate_id',election_year:'eq.2026',uf:`eq.${c.uf}`,office:`eq.${c.office}`,candidate_number:`eq.${numero}`});
 const r=await fetch(`${SUPABASE_URL}/rest/v1/candidates?${qs}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
 if(!r.ok) throw new Error('Falha ao consultar');
 return r.json();
}

function Campo({c,value,onChange}){
 const [state,setState]=useState({status:'idle',items:[]});
 useEffect(()=>{let active=true;if(value.length!==c.digits){setState({status:'idle',items:[]});return}
  setState({status:'loading',items:[]});
  const t=setTimeout(()=>buscar(c,value).then(items=>active&&setState({status:items.length?'ok':'none',items})).catch(()=>active&&setState({status:'error',items:[]})),250);
  return()=>{active=false;clearTimeout(t)}
 },[value,c.digits,c.office,c.uf]);
 const item=state.items.length===1?state.items[0]:null;
 return <div className="cargo">
  <label htmlFor={c.id}>{c.label}</label>
  <input id={c.id} aria-label={c.label} inputMode="numeric" maxLength={c.digits} value={value} onChange={e=>onChange(e.target.value.replace(/\D/g,'').slice(0,c.digits))} placeholder={'0'.repeat(c.digits)}/>
  {state.status==='loading'&&<p className="status">Consultando…</p>}
  {state.status==='none'&&<p className="status erro">Candidatura não encontrada. Confira o número.</p>}
  {state.status==='error'&&<p className="status erro">Não foi possível consultar agora.</p>}
  {state.items.length>1&&<p className="status aviso">Há mais de um registro para este número na base atual do TSE. Confira antes de continuar.</p>}
  {item&&<div className="candidate">
   {item.photo_url?<img src={item.photo_url} alt="" crossOrigin="anonymous"/>:<div className="noPhoto">SEM FOTO</div>}
   <div><strong>{item.ballot_name}</strong><span>{item.party_abbreviation}</span><small>Nº {item.candidate_number}</small></div>
  </div>}
 </div>
}

export default function Home(){
 const [vals,setVals]=useState({});
 function limpar(){setVals({})}
 function gerar(){
  const cards=cargos.map(c=>({c,value:vals[c.id]||''})).filter(x=>x.value);
  if(!cards.length){alert('Digite pelo menos um número para gerar sua cola.');return}
  const w=1080,h=1350,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const x=canvas.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#0c5360';x.fillRect(0,0,w,230);x.textAlign='center';x.fillStyle='#fff';x.font='700 38px Arial';x.fillText('ELEIÇÕES 2026 • PARAÍBA',w/2,65);x.font='800 70px Arial';x.fillText('LEVE A SUA COLA!',w/2,155);
  let y=300;x.textAlign='left';
  for(const {c,value} of cards){x.fillStyle='#0c5360';x.font='700 29px Arial';x.fillText(c.label,90,y);x.font='800 55px Arial';x.fillText(value,90,y+65);y+=150}
  x.fillStyle='#607477';x.font='24px Arial';x.fillText('Confira os números antes de votar.',90,1290);
  const a=document.createElement('a');a.download='minha-cola-eleitoral-2026.png';a.href=canvas.toDataURL('image/png');a.click();
 }
 return <main><header><div className="eyebrow">ELEIÇÕES 2026 • PARAÍBA</div><h1>NO DIA 04/10,<br/><b>LEVE A COLA!</b></h1><p>Digite os números que você já escolheu. A ferramenta apenas identifica as candidaturas.</p></header>
 <section>{cargos.map(c=><Campo key={c.id} c={c} value={vals[c.id]||''} onChange={v=>setVals(s=>({...s,[c.id]:v}))}/>)}
 <div className="actions"><button onClick={gerar}>GERAR MINHA COLA</button><button className="secondary" onClick={limpar}>LIMPAR</button></div>
 <p className="nota">Confira os números antes de votar. Suas escolhas não são gravadas pelo site.</p></section></main>
}