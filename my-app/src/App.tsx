import { useEffect, useState } from 'react';
import CadastroColaborador from './pages/CadastroColaborador';
import InicioColaborador from './pages/InicioColaborador';
import TelaPendente from './pages/TelaPendente';
import './styles/colaborador.css';

function rotaAtual() {
  return window.location.hash.slice(1) || '/cadastro';
}

export default function App() {
  const [rota, setRota] = useState(rotaAtual);
  // Apenas nome de exibição em memória para o protótipo. Não representa autenticação.
  // INTEGRAÇÃO: obter a identidade da sessão validada pela API quando disponível.
  const [nome, setNome] = useState('');

  useEffect(() => {
    const atualizar = () => setRota(rotaAtual());
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, []);

  useEffect(() => {
    const titulos: Record<string, string> = {
      '/cadastro': 'Cadastro do colaborador',
      '/colaborador': 'Início do colaborador',
      '/colaborador/preferencias': 'Preferência e Restrições',
      '/colaborador/cardapios': 'Cardápios',
    };
    document.title = `${titulos[rota] ?? 'Página não encontrada'} | NutriCorp`;
    document.querySelector<HTMLElement>('h1')?.focus();
  }, [rota]);

  if (rota === '/cadastro') return (
    <CadastroColaborador onCadastroConcluido={(nomeCompleto) => {
      setNome(nomeCompleto);
      window.location.hash = '/colaborador';
    }} />
  );
  if (rota === '/colaborador') return <InicioColaborador nome={nome} />;
  if (rota === '/colaborador/preferencias') return <TelaPendente titulo="Preferência e Restrições" />;
  if (rota === '/colaborador/cardapios') return <TelaPendente titulo="Cardápios" />;
  return <TelaPendente titulo="Página não encontrada" mensagem="Não encontramos a página solicitada." />;
}
