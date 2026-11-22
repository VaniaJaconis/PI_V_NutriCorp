import { useEffect, useState } from 'react';
import CadastroColaborador from './pages/CadastroColaborador';
import CadastroOrganizacao from './pages/CadastroOrganizacao';
import Login from './pages/Login';
import InicioOrganizacao from './pages/InicioOrganizacao';
import ControleAcesso from './pages/ControleAcesso';
import CadastroCardapio from './pages/CadastroCardapio';
import { limparCardapioOrganizacaoSimulado } from './services/cardapiosOrganizacao';
import InicioColaborador from './pages/InicioColaborador';
import RegistroRefeicoes from './pages/RegistroRefeicoes';
import { limparRegistrosSimulados } from './services/registrosRefeicoes';
import TelaPendente from './pages/TelaPendente';
import PreferenciasColaborador from './pages/PreferenciasColaborador';
import CardapiosColaborador from './pages/CardapiosColaborador';
import CardapiosOrganizacao from './pages/CardapiosOrganizacao';
import CompatibilidadeRefeicao from './pages/CompatibilidadeRefeicao';
import { limparSelecoesSimuladas } from './services/alternativas';
import { limparPreferenciasSimuladas } from './services/preferencias';
import { limparAcessosSimulados } from './services/controleAcesso';
import Indicadores from './pages/Indicadores';

function rotaAtual() {
  return window.location.hash.slice(1) || '/login';
}

export default function App() {
  const [rota, setRota] = useState(rotaAtual);
  const caminho = rota.split('?')[0];
  const refeicaoId =
    new URLSearchParams(rota.split('?')[1]).get('refeicao') ||
    'terca-vegetariano';
  // Obter o nome e o perfil da sessão retornada pelo backend.
  const [nome, setNome] = useState('');
  const [nomeOrganizacao, setNomeOrganizacao] = useState('');

  useEffect(() => {
    const atualizar = () => setRota(rotaAtual());
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, []);

  useEffect(() => {
    const titulos: Record<string, string> = {
      '/': 'Login',
      '/login': 'Login',
      '/organizacao': 'Área da organização',
      '/organizacao/acessos': 'Controle de Acesso',
      '/organizacao/cardapios': 'Cardápios e Refeições',
      '/organizacao/cardapios/cadastro': 'Cadastro de cardápio',
      '/organizacao/indicadores': 'Indicadores',
      '/cadastro': 'Cadastro do colaborador',
      '/organizacao/cadastro': 'Cadastro da organização',
      '/colaborador': 'Início do colaborador',
      '/colaborador/preferencias': 'Preferência e Restrições',
      '/colaborador/cardapios': 'Cardápios',
      '/colaborador/compatibilidade': 'Compatibilidade das refeições',
      '/colaborador/refeicoes': 'Registro de refeições',
    };
    document.title = `${titulos[caminho] ?? 'Página não encontrada'} | NutriCorp`;
    document.querySelector<HTMLElement>('h1')?.focus();
  }, [rota, caminho]);

  if (caminho === '/login' || caminho === '/')
    return (
      <Login
        onEntrar={(resultado) => {
          limparRegistrosSimulados();
          limparCardapioOrganizacaoSimulado();
          limparPreferenciasSimuladas();
          limparSelecoesSimuladas();
          limparAcessosSimulados();
          setNome('');
          setNomeOrganizacao('');
          if (resultado.perfil === 'colaborador') {
            setNome(resultado.nome);
            window.location.hash = '/colaborador';
          } else {
            setNomeOrganizacao(resultado.nome);
            window.location.hash = '/organizacao';
          }
        }}
      />
    );
  if (caminho === '/organizacao')
    return <InicioOrganizacao nome={nomeOrganizacao} />;
  if (caminho === '/organizacao/acessos')
    return <ControleAcesso nome={nomeOrganizacao} />;
  if (caminho === '/organizacao/cardapios')
    return <CardapiosOrganizacao />;
  if (caminho === '/organizacao/cardapios/cadastro')
    return <CadastroCardapio nomeOrganizacao={nomeOrganizacao} />;
  if (caminho === '/organizacao/indicadores')
    return <Indicadores />;
  if (caminho === '/organizacao/cadastro')
    return (
      <CadastroOrganizacao
        onCadastroConcluido={(nomeFantasia) => {
          limparRegistrosSimulados();
          limparCardapioOrganizacaoSimulado();
          limparPreferenciasSimuladas();
          limparSelecoesSimuladas();
          setNome('');
          setNomeOrganizacao(nomeFantasia);
          window.location.hash = '/organizacao';
        }}
      />
    );
  if (caminho === '/cadastro')
    return (
      <CadastroColaborador
        onCadastroConcluido={(nomeCompleto) => {
          limparRegistrosSimulados();
          limparCardapioOrganizacaoSimulado();
          limparPreferenciasSimuladas();
          limparSelecoesSimuladas();
          setNome(nomeCompleto);
          window.location.hash = '/colaborador';
        }}
      />
    );
  if (caminho === '/colaborador') return <InicioColaborador nome={nome} />;
  if (caminho === '/colaborador/preferencias')
    return <PreferenciasColaborador />;
  if (caminho === '/colaborador/cardapios') return <CardapiosColaborador />;
  if (caminho === '/colaborador/refeicoes')
    return (
      <RegistroRefeicoes
        key={rota}
        opcaoInicial={
          new URLSearchParams(rota.split('?')[1]).get('opcao') ?? ''
        }
      />
    );
  if (caminho === '/colaborador/compatibilidade')
    return <CompatibilidadeRefeicao key={refeicaoId} refeicaoId={refeicaoId} />;
  return (
    <TelaPendente
      titulo="Página não encontrada"
      mensagem="Não encontramos a página solicitada."
    />
  );
}
