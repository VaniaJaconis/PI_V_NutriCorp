import { useEffect, useState } from 'react';
import CadastroColaborador from './pages/CadastroColaborador';
import CadastroOrganizacao from './pages/CadastroOrganizacao';
import Login from './pages/Login';
import InicioOrganizacao from './pages/InicioOrganizacao';
import ControleAcesso from './pages/ControleAcesso';
import CadastroCardapio from './pages/CadastroCardapio';
import InicioColaborador from './pages/InicioColaborador';
import RegistroRefeicoes from './pages/RegistroRefeicoes';
import TelaPendente from './pages/TelaPendente';
import PreferenciasColaborador from './pages/PreferenciasColaborador';
import CardapiosColaborador from './pages/CardapiosColaborador';
import CardapiosOrganizacao from './pages/CardapiosOrganizacao';
import CompatibilidadeRefeicao from './pages/CompatibilidadeRefeicao';
import Indicadores from './pages/Indicadores';
import AlterarSenha from './pages/AlterarSenha';
import { ErroApi } from './services/api';
import { consultarSessao } from './services/autenticacao';
import { encerrarSessao, eventoSessaoEncerrada, guardarSessao, lerSessao } from './services/sessao';
import type { ResultadoLogin } from './types/autenticacao';

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
  '/colaborador/senha': 'Alterar senha',
  '/organizacao/senha': 'Alterar senha',
};

function rotaAtual() {
  return window.location.hash.slice(1) || '/login';
}

export default function App() {
  const [rota, setRota] = useState(rotaAtual);
  const [sessao, setSessao] = useState<ResultadoLogin | null>(null);
  const [validandoSessao, setValidandoSessao] = useState(() => Boolean(lerSessao()));
  const [erroSessao, setErroSessao] = useState('');
  const [mensagemLogin, setMensagemLogin] = useState('');
  const [tentativaSessao, setTentativaSessao] = useState(0);
  const [caminho, consulta] = rota.split('?');
  const parametros = new URLSearchParams(consulta);

  useEffect(() => {
    const atualizar = () => setRota(rotaAtual());
    const limpar = (evento: Event) => {
      setSessao(null);
      setErroSessao('');
      setValidandoSessao(false);
      setMensagemLogin((evento as CustomEvent<string>).detail);
      window.location.hash = '/login';
      setRota('/login');
    };
    window.addEventListener('hashchange', atualizar);
    window.addEventListener(eventoSessaoEncerrada, limpar);
    return () => {
      window.removeEventListener('hashchange', atualizar);
      window.removeEventListener(eventoSessaoEncerrada, limpar);
    };
  }, []);

  useEffect(() => {
    const anterior = lerSessao();
    if (!anterior) {
      setValidandoSessao(false);
      return;
    }
    const controller = new AbortController();
    consultarSessao(controller.signal)
      .then((usuario) => {
        if (controller.signal.aborted || lerSessao()?.token !== anterior.token) return;
        const confirmada = { ...anterior, ...usuario };
        guardarSessao(confirmada);
        setSessao(confirmada);
      })
      .catch((erro: unknown) => {
        if (controller.signal.aborted) return;
        if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) {
          if (lerSessao()) encerrarSessao(erro.message);
          return;
        }
        setErroSessao('Não foi possível verificar sua sessão. Tente novamente.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setValidandoSessao(false);
      });
    return () => controller.abort();
  }, [tentativaSessao]);

  const login = caminho === '/' || caminho === '/login';
  const cadastroPublico = caminho === '/cadastro' || caminho === '/organizacao/cadastro';
  const perfilDaRota =
    caminho === '/colaborador' || caminho.startsWith('/colaborador/')
      ? 'colaborador'
      : !cadastroPublico && (caminho === '/organizacao' || caminho.startsWith('/organizacao/'))
        ? 'organizacao'
        : null;
  let redirecionar = '';
  if (!validandoSessao && !erroSessao) {
    if (sessao && (login || cadastroPublico || (perfilDaRota && perfilDaRota !== sessao.perfil))) {
      redirecionar = '/' + sessao.perfil;
    } else if (!sessao && perfilDaRota) {
      redirecionar = '/login';
    }
  }

  useEffect(() => {
    if (redirecionar && rotaAtual() === rota) {
      window.location.replace('#' + redirecionar);
      setRota(redirecionar);
    }
  }, [redirecionar, rota]);

  useEffect(() => {
    document.title = (titulos[caminho] ?? 'Página não encontrada') + ' | NutriCorp';
    document.querySelector<HTMLElement>('h1')?.focus();
  }, [rota, caminho, validandoSessao]);

  function iniciarSessao(resultado: ResultadoLogin) {
    guardarSessao(resultado);
    setSessao(resultado);
    setMensagemLogin('');
    const destino = '/' + resultado.perfil;
    window.location.hash = destino;
    setRota(destino);
  }

  if (validandoSessao) return <main className="pagina-login"><p role="status">Verificando sessão…</p></main>;
  if (erroSessao)
    return (
      <main className="pagina-login">
        <p role="alert">{erroSessao}</p>
        <button type="button" onClick={() => {
          setErroSessao('');
          setValidandoSessao(true);
          setTentativaSessao((valor) => valor + 1);
        }}>Tentar novamente</button>
        <button type="button" onClick={() => encerrarSessao()}>Voltar ao login</button>
      </main>
    );
  if (redirecionar) return null;
  if (login) return <Login onEntrar={iniciarSessao} mensagemSessao={mensagemLogin} />;
  if (caminho === '/organizacao/cadastro')
    return <CadastroOrganizacao onCadastroConcluido={iniciarSessao} />;
  if (caminho === '/cadastro')
    return <CadastroColaborador />;
  if (sessao) {
    if (caminho === '/organizacao/senha' || caminho === '/colaborador/senha')
      return <AlterarSenha voltar={'/' + sessao.perfil} />;
    if (caminho === '/organizacao')
      return <InicioOrganizacao nome={sessao.nome} onSair={() => encerrarSessao()} />;
    if (caminho === '/organizacao/acessos')
      return <ControleAcesso nome={sessao.nome} />;
    if (caminho === '/organizacao/cardapios')
      return <CardapiosOrganizacao />;
    if (caminho === '/organizacao/cardapios/cadastro') {
      const cardapioId = parametros.get('id') ?? '';
      return <CadastroCardapio key={cardapioId} cardapioId={cardapioId} nomeOrganizacao={sessao.organizacao.nome} />;
    }
    if (caminho === '/organizacao/indicadores')
      return <Indicadores />;
    if (caminho === '/colaborador')
      return <InicioColaborador nome={sessao.nome} onSair={() => encerrarSessao()} />;
    if (caminho === '/colaborador/preferencias')
      return <PreferenciasColaborador />;
    if (caminho === '/colaborador/cardapios') return <CardapiosColaborador />;
    if (caminho === '/colaborador/refeicoes')
      return <RegistroRefeicoes key={rota} opcaoInicial={parametros.get('opcao') ?? ''} dataInicial={parametros.get('data') ?? ''} />;
    if (caminho === '/colaborador/compatibilidade') {
      const refeicaoId = parametros.get('refeicao');
      return refeicaoId
        ? <CompatibilidadeRefeicao key={refeicaoId} refeicaoId={refeicaoId} />
        : <TelaPendente titulo="Selecione uma refeição" mensagem="Abra um cardápio para verificar a compatibilidade." />;
    }
  }
  return (
    <TelaPendente titulo="Página não encontrada" mensagem="Não encontramos a página solicitada." />
  );
}
