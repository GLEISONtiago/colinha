import './style.css';
import Pwa from './components/Pwa';
export const metadata={
 title:{default:'Colinha 2026',template:'%s • Colinha 2026'},
 description:'Ferramenta neutra para identificar candidaturas pelos números informados, simular a sequência de votação e gerar uma cola eleitoral.',
 applicationName:'Colinha 2026',
 manifest:'/manifest.webmanifest',
 robots:{index:true,follow:true},
 icons:{icon:'/app-icon.svg',apple:'/app-icon.svg'},
 openGraph:{title:'Colinha 2026',description:'Digite os números que você já escolheu e gere sua cola eleitoral.',type:'website',locale:'pt_BR'}
};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0c5360'};
export default function Layout({children}){return <html lang="pt-BR"><body><Pwa/>{children}</body></html>}