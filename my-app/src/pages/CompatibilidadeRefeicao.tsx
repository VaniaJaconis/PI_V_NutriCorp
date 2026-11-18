import { useEffect, useRef, useState } from 'react';
import { consultarAlternativas, selecionarAlternativa } from '../services/alternativas';
import { consultarPreferencias } from '../services/preferencias';
import { avaliarCompatibilidade } from '../validation/compatibilidade';
import type { PreferenciasColaborador } from '../types/preferencias';
import '../styles/compatibilidade.css';

type Detalhes = Awaited<ReturnType<typeof consultarAlternativas>>;
const nomes = { sem_preferencia: 'sem preferência', vegetariana: 'vegetariana', vegana: 'vegana', pescetariana: 'pescetariana',
  lactose: 'lactose', gluten: 'glúten', amendoim: 'amendoim', castanhas: 'castanhas', ovo: 'ovo', soja: 'soja' };

export default function CompatibilidadeRefeicao({ refeicaoId }: { refeicaoId: string }) {
  const [dados, setDados] = useState<Detalhes | null>(null);
  const [perfil, setPerfil] = useState<PreferenciasColaborador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroSelecao, setErroSelecao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const bloqueio = useRef(false);
  useEffect(() => {
    let ativo = true;
    setCarregando(true); setErro(''); setMensagem(''); setErroSelecao('');
    Promise.all([consultarAlternativas(refeicaoId), consultarPreferencias()])
      .then(([resultado, preferencias]) => { if (ativo) { setDados(resultado); setPerfil(preferencias); } })
      .catch(() => { if (ativo) setErro('Não foi possível carregar esta refeição e seu perfil. Verifique a refeição ou tente novamente.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [refeicaoId, tentativa]);

  const linhas = dados && perfil ? dados.refeicao.pratos.map(prato => ({ prato, ...avaliarCompatibilidade(prato, perfil) })) : [];
  const alertas = linhas.flatMap(linha => linha.alertas.map(alerta => `${linha.prato.nome}: ${alerta}`));
  const incompleto = linhas.some(linha => linha.incompleto);
  const analiseAlternativa = dados?.alternativa && perfil ? avaliarCompatibilidade(dados.alternativa, perfil) : null;
  const alternativaCompativel = Boolean(analiseAlternativa && !analiseAlternativa.incompleto && !analiseAlternativa.alertas.length);
  const selecionada = Boolean(dados?.alternativa && dados.alternativaSelecionada === dados.alternativa.id);
  const voltar = `#/colaborador/cardapios?refeicao=${encodeURIComponent(refeicaoId)}`;

  async function selecionar() {
    if (!dados?.alternativa || !alternativaCompativel || selecionada || bloqueio.current) return;
    bloqueio.current = true; setSalvando(true); setErroSelecao(''); setMensagem('');
    try {
      await selecionarAlternativa(refeicaoId, dados.alternativa.id);
      setDados(anterior => anterior ? { ...anterior, alternativaSelecionada: anterior.alternativa?.id ?? null } : anterior);
      setMensagem('Alternativa selecionada nesta demonstração. Isso não registra uma refeição consumida.');
    } catch { setErroSelecao('Não foi possível selecionar a alternativa. Confira seu perfil e tente novamente.'); }
    finally { bloqueio.current = false; setSalvando(false); }
  }

  return (
    <main className="pagina-compatibilidade">
      <a className="compatibilidade-voltar" href={voltar} aria-label="Voltar aos cardápios">←</a>
      <header className="marca" aria-label="NutriCorp">NutriCorp</header>
      <h1 tabIndex={-1}>Compatibilidade das refeições</h1>
      {carregando ? <p role="status">Analisando refeição e perfil…</p> : erro ? <div>
        <p role="alert">{erro}</p><button className="compatibilidade-repetir" onClick={() => setTentativa(valor => valor + 1)}>Tentar novamente</button>
      </div> : dados && perfil && <>
        <p className="compatibilidade-subtitulo">{dados.data && `${new Date(`${dados.data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} · `}{dados.refeicao.titulo} · Compare os ingredientes com seu perfil.</p>
        {alertas.length > 0 ? <div className="compatibilidade-aviso" role="status">
          <h2>Atenção: esta refeição apresenta incompatibilidades</h2>
          {alertas.map(alerta => <p key={alerta}>{alerta}</p>)}
        </div> : incompleto ? <div className="compatibilidade-aviso" role="status">
          <h2>Informações insuficientes para avaliar toda a refeição</h2><p>Confirme ingredientes e possíveis traços com o serviço de alimentação.</p>
        </div> : null}
        <div className="compatibilidade-paineis">
          <section className="compatibilidade-painel" aria-labelledby="titulo-preparacoes">
            <h2 id="titulo-preparacoes">{dados.refeicao.titulo}</h2>
            {linhas.length ? <table className="compatibilidade-tabela">
              <thead><tr><th scope="col">Preparação</th><th scope="col">Compatibilidade com seu perfil</th></tr></thead>
              <tbody>{linhas.map(({ prato, alertas: avisos, incompleto: parcial }) => <tr key={prato.id}>
                <th scope="row">{prato.nome}</th>
                <td className={avisos.length || parcial ? 'compatibilidade-texto-alerta' : 'compatibilidade-texto-verde'}>
                  {avisos.length ? `Incompatível · ${avisos.join(' ')}` : parcial ? 'Informações incompletas' : 'Compatível*'}
                  {avisos.length > 0 && parcial && ' Informações também incompletas.'}
                </td>
              </tr>)}</tbody>
            </table> : <p>Nenhuma preparação cadastrada para esta refeição.</p>}
          </section>
          <section className="compatibilidade-painel compatibilidade-alternativa" aria-labelledby="titulo-alternativa">
            <h2 id="titulo-alternativa" className={alternativaCompativel ? 'compatibilidade-texto-verde' : ''}>{alternativaCompativel ? 'Alternativa compatível*' : 'Alternativa disponível'}</h2>
            {dados.alternativa ? <>
              <h3>{dados.alternativa.nome}</h3>
              <p>{dados.alternativa.ingredientes.join(', ')}.</p>
              {dados.alternativa.nutricional && <p>Porção de {dados.alternativa.nutricional.porcaoGramas} g{dados.alternativa.nutricional.nutrientes.map(item => ` · ${item.quantidade.toLocaleString('pt-BR')} ${item.unidade}${item.nome === 'Proteínas' ? ' de proteínas' : ''}`).join('')}</p>}
              {!alternativaCompativel && <p className="compatibilidade-texto-alerta">Esta alternativa não atende ao perfil ou possui dados insuficientes. {analiseAlternativa?.alertas.join(' ')}</p>}
              <button type="button" disabled={salvando || selecionada || !alternativaCompativel} onClick={selecionar}>
                {salvando ? 'Selecionando…' : selecionada ? 'Alternativa selecionada' : 'Selecionar alternativa'}
              </button>
              {selecionada && !alternativaCompativel && <p>Seu perfil mudou. Revise a seleção anterior.</p>}
              {selecionada && <a className="registro-link" href={`#/colaborador/refeicoes?opcao=${encodeURIComponent(dados.alternativa.id)}`}>Registrar consumo desta alternativa</a>}
            </> : <p>Nenhuma alternativa disponível para esta refeição.</p>}
          </section>
        </div>
        <footer className="compatibilidade-rodape">
          <div><p><strong>Perfil considerado: {nomes[perfil.perfil]} · {perfil.restricoes.length ? `restrições: ${perfil.restricoes.map(item => nomes[item]).join(', ')}` : 'nenhuma restrição marcada'}</strong></p>
            <p>* Compatibilidade limitada aos dados cadastrados. Confirme possíveis traços com a equipe. Alimentos a evitar e orientações em texto livre não são analisados automaticamente.</p>
            <p>Dados demonstrativos. A seleção é apagada ao recarregar a página.</p>
          </div>
          <a href="#/colaborador/preferencias" className="compatibilidade-revisar">Revisar meu perfil</a>
        </footer>
        <p role="status" className="compatibilidade-feedback">{mensagem}</p>
        {erroSelecao && <p role="alert" className="compatibilidade-texto-alerta">{erroSelecao}</p>}
      </>}
    </main>
  );
}
