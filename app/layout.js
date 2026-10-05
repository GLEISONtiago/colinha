import './style.css';
import Pwa from './components/Pwa';
export const metadata={
 title:{default:'Colinha 2026',template:'%s • Colinha 2026'},
 description:'Projeto open source demonstrativo de uma cola eleitoral digital, com simulador, geração de imagem e integração opcional com Dados Abertos do TSE via Supabase.',
 applicationName:'Colinha 2026',
 manifest:'/manifest.webmanifest',
 robots:{index:true,follow:true},
 icons:{icon:'/app-icon.svg',apple:'/app-icon.svg'},
 openGraph:{title:'Colinha 2026',description:'Projeto open source demonstrativo desenvolvido pela Infofast.',type:'website',locale:'pt_BR'}
};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0c5360'};
export default function Layout({children}){return <html lang="pt-BR"><body><Pwa/>{children}</body></html>}