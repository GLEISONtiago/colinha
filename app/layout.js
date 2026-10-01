import './style.css';
export const metadata={
 title:'Colinha 2026 — Paraíba',
 description:'Ferramenta neutra para identificar candidaturas pelos números informados e gerar uma cola eleitoral.',
 applicationName:'Colinha 2026',
 manifest:'/manifest.webmanifest',
 themeColor:'#0c5360',
 viewport:'width=device-width, initial-scale=1, viewport-fit=cover',
 robots:{index:true,follow:true},
 openGraph:{title:'Colinha 2026 — Paraíba',description:'Digite os números que você já escolheu e gere sua cola eleitoral.',type:'website',locale:'pt_BR'}
};
export default function Layout({children}){return <html lang="pt-BR"><body>{children}</body></html>}