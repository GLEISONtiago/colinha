'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://lyagstynyfupldvbzgpb.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_g3yKs7jTypCIgmXmaJAeUg_PGSkZAhy';
const states=[['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']];
const baseCargos=[
{id:'depFederal',label:'DEPUTADA OU DEPUTADO FEDERAL',office:'DEPUTADO FEDERAL',digits:4},
{id:'depEstadual',label:'DEPUTADA OU DEPUTADO ESTADUAL',office:'DEPUTADO ESTADUAL',digits:5},
{id:'senador1',label:'SENADORA OU SENADOR — 1ª VAGA',office:'SENADOR',digits:3},
{id:'senador2',label:'SENADORA OU SENADOR — 2ª VAGA',office:'SENADOR',digits:3},
{id:'governador',label:'GOVERNADORA OU GOVERNADOR',office:'GOVERNADOR',digits:2},
{id:'presidente',label:'PRESIDENTA OU PRESIDENTE',office:'PRESIDENTE',digits:2}];
async function buscar(c,n){const q=new URLSearchParams({select:'ballot_name,party_abbreviation,candidate_number,photo_url,tse_candidate_id,source_generated_at',election_year:'eq.2026',uf:`eq.${c.uf}`,office:`eq.${c.office}`,candidate_number:`eq.${n}`});const r=await fetch(`${URL}/rest/v1/candidates?${q}`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw Error();return r.json()}
function Campo({c,value,onChange,onResolved,duplicate}){const [s,setS]=useState({status:'idle',items:[]});const refs=useRef([]);
 useEffect(()=>{let live=true;if(value.length!==c.digits){setS({status:'idle',items:[]});onResolved(c.id,null);return}setS({status:'loading',items:[]});const t=setTimeout(()=>buscar(c,value).then(items=>{if(!live)return;setS({status:items.length?'ok':'none',items});onResolved(c.id,items.length===1?items[0]:null)}).catch(()=>live&&setS({status:'error',items:[]})),180);return()=>{live=false;clearTimeout(t)}},[value]);
 function digit(i,v){const d=v.replace(/\D/g,'').slice(-1);const a=Array.from({length:c.digits},(_,j)=>value[j]||'');a[i]=d;onChange(a.join(''));if(d&&i<c.digits-1)refs.current[i+1]?.focus()}
 function paste(e){const d=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,c.digits);if(!d)return;e.preventDefault();onChange(d);refs.current[Math.min(d.length,c.digits)-1]?.focus()}
 const item=s.items.length===1?s.items[0]:null;
 return <div className="cargo"><label>{c.label}</label><div className="digits">{Array.from({length:c.digits},(_,i)=><input key={i} ref={e=>refs.current[i]=e} aria-label={`${c.label}, dígito ${i+1}`} inputMode="numeric" maxLength="1" value={value[i]||''} onChange={e=>digit(i,e.target.value)} onPaste={paste} onKeyDown={e=>{if(e.key==='Backspace'&&!value[i]&&i>0){e.preventDefault();const nv=value.slice(0,i-1)+value.slice(i);onChange(nv);refs.current[i-1]?.focus()}}}/>)}</div>
 {duplicate&&<p className="status erro">Repita não: escolha uma candidatura diferente para a outra vaga de Senador.</p>}{s.status==='loading'&&<p className="status">Consultando…</p>}{s.status==='none'&&<p className="status erro">Candidatura não encontrada. Confira o número.</p>}{s.status==='error'&&<p className="status erro">Não foi possível consultar agora.</p>}{s.items.length>1&&<p className="status aviso">Há mais de um registro para este número na base atual. Confira antes de continuar.</p>}
 {item&&<div className="candidate">{item.photo_url?<img src={item.photo_url} alt=""/>:<div className="noPhoto">SEM FOTO</div>}<div><strong>{item.ballot_name}</strong><span>{item.party_abbreviation}</span><small>Nº {item.candidate_number}</small></div><b className="check">✓</b></div>}</div>}
export default function Home(){const [uf,setUf]=useState(null);const [vals,setVals]=useState({});const cargos=baseCargos.map(c=>({...c,uf:c.office==='PRESIDENTE'?'BR':uf}));
 useEffect(()=>{const q=new URLSearchParams(window.location.search);const qUf=(q.get('uf')||'').toUpperCase();if(states.some(([s])=>s===qUf))setUf(qUf);const incoming={};baseCargos.forEach(c=>{const v=(q.get(c.id)||'').replace(/\D/g,'').slice(0,c.digits);if(v.length===c.digits)incoming[c.id]=v});if(Object.keys(incoming).length)setVals(incoming)},[]);
 useEffect(()=>{if(!uf)return;const q=new URLSearchParams(window.location.search);q.set('uf',uf);history.replaceState(null,'',window.location.pathname+'?'+q.toString())},[uf]);const [resolved,setResolved]=useState({});const [preview,setPreview]=useState(null);
 const duplicateSenator=!!(resolved.senador1&&resolved.senador2&&resolved.senador1.tse_candidate_id===resolved.senador2.tse_candidate_id);
 const validCount=cargos.filter(c=>resolved[c.id]).length;
 const updatedAt=Object.values(resolved).filter(Boolean).map(v=>v.source_generated_at).filter(Boolean).sort().at(-1);
 function resolve(id,item){setResolved(s=>s[id]===item?s:{...s,[id]:item})}
 function loadPhoto(url){return new Promise(resolve=>{if(!url)return resolve(null);const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url})}
 async function makeCanvas(){const chosen=cargos.filter(c=>resolved[c.id]);if(!chosen.length){alert('Identifique pelo menos uma candidatura antes de gerar a cola.');return null}
 const photos=await Promise.all(chosen.map(c=>loadPhoto(resolved[c.id].photo_url)));
 const cv=document.createElement('canvas');cv.width=1080;cv.height=1350;const x=cv.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,1080,1350);x.fillStyle='#0c5360';x.fillRect(0,0,1080,220);x.fillStyle='#55b99c';x.fillRect(0,220,1080,18);
 x.textAlign='center';x.fillStyle='#fff';x.font='700 34px Arial';x.fillText('ELEIÇÕES 2026 • ${stateName.toUpperCase()}',540,62);x.fillStyle='#ffd63d';x.font='800 70px Arial';x.fillText('LEVE A COLA!',540,150);
 const top=270,bottom=1260,available=bottom-top;const rowH=Math.min(158,Math.floor(available/chosen.length));let y=top;
 chosen.forEach((c,i)=>{const p=resolved[c.id],img=photos[i];const photoW=100,photoH=Math.min(122,rowH-30),px=90,py=y+24;
   x.textAlign='left';x.fillStyle='#123f48';x.font='700 22px Arial';x.fillText(c.label,90,y+18);
   if(img){const ir=img.width/img.height,rr=photoW/photoH;let sx=0,sy=0,sw=img.width,sh=img.height;if(ir>rr){sw=img.height*rr;sx=(img.width-sw)/2}else{sh=img.width/rr;sy=(img.height-sh)/2}x.save();x.beginPath();x.roundRect(px,py,photoW,photoH,8);x.clip();x.drawImage(img,sx,sy,sw,sh,px,py,photoW,photoH);x.restore()}
   else{x.fillStyle='#eef3f2';x.fillRect(px,py,photoW,photoH);x.fillStyle='#607477';x.textAlign='center';x.font='700 15px Arial';x.fillText('SEM FOTO',px+photoW/2,py+photoH/2+5)}
   x.textAlign='left';x.fillStyle='#123f48';x.font='800 43px Arial';x.fillText(p.candidate_number,215,y+68);x.font='700 27px Arial';x.fillText(p.ballot_name,380,y+62);x.font='22px Arial';x.fillText(p.party_abbreviation,380,y+94);
   x.strokeStyle='#d9e5e2';x.beginPath();x.moveTo(90,y+rowH-5);x.lineTo(990,y+rowH-5);x.stroke();y+=rowH;
 });
 x.textAlign='left';x.fillStyle='#607477';x.font='22px Arial';x.fillText('Confira os números antes de votar.',90,1300);return cv}
 async function gerar(){
  if(resolved.senador1&&resolved.senador2&&resolved.senador1.tse_candidate_id===resolved.senador2.tse_candidate_id){
    alert('Escolha candidaturas diferentes para a 1ª e a 2ª vaga de Senador.');
    return;
  }
  const cv=await makeCanvas();if(cv)setPreview(cv.toDataURL('image/png'))
}function baixar(){if(!preview)return;const a=document.createElement('a');a.download='minha-cola-eleitoral-2026.png';a.href=preview;a.click()}
 function imprimir(){if(!preview)return;const w=window.open('','_blank');if(!w)return;w.document.write(`<html><head><title>Minha cola eleitoral</title><style>body{margin:0;text-align:center}img{max-width:100%;height:auto}@media print{img{width:100%}}</style></head><body><img src="${preview}" onload="window.print();window.close()"></body></html>`);w.document.close()}
 if(!uf)return <main><nav className="topnav"><b>COLINHA 2026</b><div><Link className="active" href="/">MONTAR COLA</Link><Link href={'/simulador?uf='+uf}>SIMULADOR</Link></div></nav><section className="statePicker"><div className="simBadge">ELEIÇÕES 2026</div><h1>Escolha seu estado</h1><p>Selecione a UF para consultar as candidaturas estaduais. A escolha de Presidente é nacional.</p><div className="stateGrid">{states.map(([code,name])=><button key={code} onClick={()=>setUf(code)}><strong>{name}</strong><span>{code}</span></button>)}</div><p className="nota">Sem cadastro. Os números que você informar não são armazenados pelo site.</p></section></main>;
 const stateName=states.find(([s])=>s===uf)?.[1]||uf;
 return <main><nav className="topnav" aria-label="Navegação principal"><b>COLINHA 2026</b><div><Link className="active" href="/">MONTAR COLA</Link><Link href="/simulador">SIMULADOR</Link></div></nav><header><div className="eyebrow">ELEIÇÕES 2026 • PARAÍBA</div><h1>NO DIA 04/10,<br/><b>LEVE A COLA!</b></h1><p>Digite os números que você já escolheu. A ferramenta apenas identifica as candidaturas.</p></header><div className="stateBar"><span>Estado selecionado: <strong>{stateName} ({uf})</strong></span><button onClick={()=>{setUf(null);setVals({});setResolved({});history.replaceState(null,'',window.location.pathname)}}>TROCAR ESTADO</button></div><section>{cargos.map(c=><Campo key={c.id} c={c} value={vals[c.id]||''} onChange={v=>setVals(s=>({...s,[c.id]:v}))} onResolved={resolve} duplicate={(c.id==='senador1'||c.id==='senador2')&&duplicateSenator}/>)} 
 <div className="actions"><button onClick={gerar} disabled={!validCount||duplicateSenator}>GERAR MINHA COLA</button><button className="secondary" onClick={()=>{setVals({});setResolved({});setPreview(null)}}>LIMPAR</button></div><p className="nota">Somente candidaturas identificadas são incluídas. Suas escolhas não são gravadas pelo site.{updatedAt&&<> Dados consultados da base importada em {new Date(updatedAt).toLocaleDateString('pt-BR')}.</>}</p></section>
 {preview&&<div className="modal" onClick={()=>setPreview(null)}><div className="preview" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setPreview(null)}>×</button><h2>Prévia da sua cola</h2><img src={preview} alt="Prévia da cola eleitoral"/><div className="previewActions"><button onClick={baixar}>BAIXAR IMAGEM</button><button className="printBtn" onClick={imprimir}>IMPRIMIR</button></div></div></div>}</main>}