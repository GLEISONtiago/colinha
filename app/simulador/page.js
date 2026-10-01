'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import Footer from '../components/Footer';
import {states,getStateName,flagUrl,isValidUf} from '../lib/states';

const URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://lyagstynyfupldvbzgpb.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_g3yKs7jTypCIgmXmaJAeUg_PGSkZAhy';
const baseOffices=[
 {id:'depFederal',label:'Deputada ou Deputado Federal',office:'DEPUTADO FEDERAL',digits:4},
 {id:'depEstadual',label:'Deputada ou Deputado Estadual',office:'DEPUTADO ESTADUAL',digits:5},
 {id:'senador1',label:'Senadora ou Senador — 1ª vaga',office:'SENADOR',digits:3},
 {id:'senador2',label:'Senadora ou Senador — 2ª vaga',office:'SENADOR',digits:3},
 {id:'governador',label:'Governadora ou Governador',office:'GOVERNADOR',digits:2},
 {id:'presidente',label:'Presidenta ou Presidente',office:'PRESIDENTE',digits:2}
];
async function lookupParty(c,n){const q=new URLSearchParams({select:'party_abbreviation,party_number',election_year:'eq.2026',uf:`eq.${c.uf}`,office:`eq.${c.office}`,party_number:`eq.${Number(n.slice(0,2))}`,inserted_in_urn:'eq.true',is_substituted:'eq.false',limit:'1'});const r=await fetch(`${URL}/rest/v1/candidates?${q}`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw Error();const a=await r.json();return a[0]||null}
async function lookup(c,n){const q=new URLSearchParams({select:'ballot_name,party_abbreviation,candidate_number,photo_url,tse_candidate_id',election_year:'eq.2026',uf:`eq.${c.uf}`,office:`eq.${c.office}`,candidate_number:`eq.${n}`,inserted_in_urn:'eq.true',is_substituted:'eq.false'});const r=await fetch(`${URL}/rest/v1/candidates?${q}`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw Error();return r.json()}
function tone(kind){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=new A(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=kind==='confirm'?880:kind==='correct'?360:620;g.gain.setValueAtTime(.055,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.11);o.start();o.stop(a.currentTime+.11)}catch{}}

export default function Simulator(){
 const [uf,setUf]=useState(null);
 const [step,setStep]=useState(0),[number,setNumber]=useState(''),[candidate,setCandidate]=useState(null),[party,setParty]=useState(null),[status,setStatus]=useState('idle'),[votes,setVotes]=useState({}),[sound,setSound]=useState(true),[done,setDone]=useState(false);
 useEffect(()=>{const q=new URLSearchParams(window.location.search);const v=(q.get('uf')||'').toUpperCase();if(isValidUf(v))setUf(v)},[]);
 const offices=baseOffices.map(o=>o.id==='depEstadual'&&uf==='DF'?{...o,label:'Deputada ou Deputado Distrital',office:'DEPUTADO DISTRITAL',uf}:{...o,uf:o.office==='PRESIDENTE'?'BR':uf});
 const c=offices[step];
 const stateName=getStateName(uf);
 const proportional=c?.office==='DEPUTADO FEDERAL'||c?.office==='DEPUTADO ESTADUAL';
 const duplicateSenator=c?.id==='senador2'&&candidate&&votes.senador1?.tse_candidate_id===candidate.tse_candidate_id;
 const legendVote=proportional&&!!party&&!candidate&&number.length>=2;
 const nullVote=number.length===c?.digits&&status==='none'&&!party;
 const canConfirm=!!candidate||legendVote||nullVote;

 useEffect(()=>{
  let live=true;setCandidate(null);setParty(null);
  if(done||!c||!c.uf){setStatus('idle');return}
  const prop=c.office==='DEPUTADO FEDERAL'||c.office==='DEPUTADO ESTADUAL';
  if(prop&&number.length>=2){
   setStatus('loading');
   const t=setTimeout(async()=>{try{const p=await lookupParty(c,number);if(!live)return;setParty(p);if(number.length===c.digits){const a=await lookup(c,number);if(!live)return;if(a.length===1){setCandidate(a[0]);setStatus('ok')}else setStatus('none')}else setStatus(p?'legend':'idle')}catch{if(live)setStatus('error')}},140);
   return()=>{live=false;clearTimeout(t)};
  }
  if(number.length!==c.digits){setStatus('idle');return}
  setStatus('loading');
  const t=setTimeout(()=>lookup(c,number).then(a=>{if(!live)return;if(a.length===1){setCandidate(a[0]);setStatus('ok')}else setStatus('none')}).catch(()=>live&&setStatus('error')),140);
  return()=>{live=false;clearTimeout(t)};
 },[number,step,done,uf]);

 function chooseState(code){setUf(code);setStep(0);setNumber('');setVotes({});setDone(false);history.replaceState(null,'','/simulador?uf='+code)}
 function press(n){if(done||number.length>=c.digits)return;if(sound)tone('key');setNumber(v=>v+n)}
 function correct(){if(sound)tone('correct');setNumber('');setCandidate(null);setParty(null);setStatus('idle')}
 function confirm(blank=false){if(!blank&&!canConfirm)return;if(sound)tone('confirm');const vote=blank?{kind:'blank'}:legendVote?{kind:'legend',candidate_number:number,party_abbreviation:party.party_abbreviation,party_number:party.party_number}:duplicateSenator||nullVote?{kind:'null',candidate_number:number,reason:duplicateSenator?'duplicate-senator':'unknown-number'}:{kind:'candidate',...candidate};const next={...votes,[c.id]:vote};setVotes(next);setNumber('');setCandidate(null);setParty(null);if(step===offices.length-1){playFinal();setDone(true)}else setStep(s=>s+1)}
 function playFinal(){if(!sound)return;try{const a=new Audio('/confirma-urna.mp3');a.volume=.9;a.play().catch(()=>{})}catch{}}
 function restart(){setStep(0);setNumber('');setCandidate(null);setParty(null);setVotes({});setDone(false);setStatus('idle')}
 function useInCola(){const h=new URLSearchParams();offices.forEach(o=>{if(votes[o.id]?.kind==='candidate')h.set(o.id,votes[o.id].candidate_number)});window.location.href='/?uf='+uf+(h.toString()?'#'+h.toString():'')}

 if(!uf)return <main className="simShell"><nav className="topnav"><b>COLINHA 2026</b><div><Link href="/">MONTAR COLA</Link><Link className="active" href="/simulador">SIMULADOR</Link></div></nav><section className="statePicker"><div className="simBadge">SIMULADOR EDUCATIVO</div><h1>Escolha seu estado</h1><p>O simulador usa as candidaturas da UF escolhida. Presidente permanece nacional.</p><div className="stateGrid">{states.map(([code,name])=><button key={code} onClick={()=>chooseState(code)}><img src={flagUrl(code)} alt={`Bandeira de ${name}`} loading="lazy"/><span className="stateText"><strong>{name}</strong><small>{code}</small></span><b>›</b></button>)}</div></section><Footer/></main>;

 if(done)return <main className="simShell"><nav className="topnav"><b>COLINHA 2026</b><div><Link href={'/?uf='+uf}>MONTAR COLA</Link><Link className="active" href={'/simulador?uf='+uf}>SIMULADOR</Link></div></nav><section className="simDone"><div className="simBadge">SIMULADOR EDUCATIVO • {uf}</div><h1>Simulação concluída</h1><p>Esta experiência serve apenas para treinar a sequência dos cargos. Nenhuma escolha é registrada como voto.</p><div className="simSummary">{offices.map(o=><div key={o.id}><span>{o.label}</span><strong>{votes[o.id]?.kind==='candidate'?`${votes[o.id].candidate_number} · ${votes[o.id].ballot_name}`:votes[o.id]?.kind==='legend'?`LEGENDA · ${votes[o.id].party_number} · ${votes[o.id].party_abbreviation}`:votes[o.id]?.kind==='null'?`NULO · ${votes[o.id].candidate_number}`:'BRANCO'}</strong></div>)}</div><button className="simPrimary" onClick={useInCola}>USAR NÚMEROS NA MINHA COLA</button><button className="simSecondary" onClick={restart}>RECOMEÇAR SIMULAÇÃO</button><button className="simSecondary" onClick={()=>{setUf(null);restart();history.replaceState(null,'','/simulador')}}>TROCAR ESTADO</button></section><Footer/></main>;

 return <main className="simShell"><nav className="topnav"><b>COLINHA 2026</b><div><Link href={'/?uf='+uf}>MONTAR COLA</Link><Link className="active" href={'/simulador?uf='+uf}>SIMULADOR</Link></div></nav><div className="stateBar"><span><img src={flagUrl(uf)} alt=""/> <strong>{stateName} ({uf})</strong></span><button onClick={()=>{setUf(null);restart();history.replaceState(null,'','/simulador')}}>TROCAR ESTADO</button></div><section className="simWrap"><div className="simIntro"><div><span className="simBadge">SIMULADOR EDUCATIVO • {uf}</span><h1>Treine a sequência de votação</h1><p>Não é uma urna oficial. Digite apenas números de candidaturas que você já escolheu.</p></div><button className="sound" onClick={()=>setSound(v=>!v)} aria-label={sound?'Desativar sons':'Ativar sons'}>{sound?'SOM ✓':'SOM —'}</button></div><div className="progress">{offices.map((_,i)=><i key={i} className={i<=step?'on':''}/>)}</div><div className="simScreen"><small>{step+1} DE {offices.length}</small><h2>{c.label}</h2><div className="simDigits">{Array.from({length:c.digits},(_,i)=><b key={i}>{number[i]||''}</b>)}</div>{status==='idle'&&<p>Digite {c.digits} dígitos.</p>}{status==='loading'&&<p>Consultando candidatura…</p>}{legendVote&&<div className="legendWarning"><strong>VOTO DE LEGENDA — {party.party_abbreviation}</strong><p>Se confirmar, este voto será registrado para a legenda {party.party_number} nesta simulação.</p></div>}{status==='none'&&!party&&<div className="nullWarning"><strong>VOTO NULO</strong><p>Este número não corresponde a uma candidatura identificada. Se confirmar, este voto será registrado como nulo nesta simulação.</p></div>}{status==='error'&&<p className="simError">Não foi possível consultar agora.</p>}{duplicateSenator&&<div className="nullWarning"><strong>SEGUNDO VOTO NULO</strong><p>Esta candidatura já foi confirmada na 1ª vaga para o Senado. Se confirmar novamente, o segundo voto será considerado nulo.</p></div>}{candidate&&!duplicateSenator&&<div className="simCandidate">{candidate.photo_url?<img src={candidate.photo_url} alt=""/>:<div className="noPhoto">SEM FOTO</div>}<div><strong>{candidate.ballot_name}</strong><span>{candidate.party_abbreviation}</span></div></div>}</div><div className="keypad">{[1,2,3,4,5,6,7,8,9].map(n=><button key={n} onClick={()=>press(String(n))}>{n}</button>)}<button className="blank" onClick={()=>confirm(true)}>BRANCO</button><button onClick={()=>press('0')}>0</button><button className="correct" onClick={correct}>CORRIGE</button><button className="confirm" disabled={!canConfirm} onClick={()=>confirm(false)}>CONFIRMA</button></div><p className="simPrivacy">A simulação acontece no navegador e não registra seus votos.</p></section><Footer/></main>
}