import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  atualizarRegistro,
  consultarHistoricoRefeicoes,
  consultarOpcoesRegistro,
  excluirRegistro,
  registrarRefeicao,
} from '../services/registrosRefeicoes';
import { ErroApi } from '../services/api';
import {
  hojeSaoPaulo,
  validarRegistro,
  type ErrosRegistro,
} from '../validation/registroRefeicao';
import type {
  EntradaRegistro,
  OpcaoRegistro,
  RegistroRefeicao,
  TipoRefeicao,
} from '../types/registroRefeicao';
import '../styles/registro-refeicoes.css';

const formatarData = (data: string) =>
  `${data.slice(8, 10)}/${data.slice(5, 7)}`;
export default function RegistroRefeicoes({
  opcaoInicial,
  dataInicial,
}: {
  opcaoInicial: string;
  dataInicial: string;
}) {
  const [form, setForm] = useState<EntradaRegistro>(() => ({
    data: dataInicial || hojeSaoPaulo(),
    tipo: 'Almoço',
    opcaoId: '',
    observacoes: '',
    requisicaoId: crypto.randomUUID(),
  }));
  const [opcoes, setOpcoes] = useState<OpcaoRegistro[]>([]);
  const [historico, setHistorico] = useState<RegistroRefeicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState('');
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
  const [erroOpcoes, setErroOpcoes] = useState('');
  const [tentativaOpcoes, setTentativaOpcoes] = useState(0);
  const [erroEnvio, setErroEnvio] = useState('');
  const [erros, setErros] = useState<ErrosRegistro>({});
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const bloqueio = useRef(false);
  const opcaoPendente = useRef(opcaoInicial);
  const { data } = form;
  const dataValida = !validarRegistro(form).data;
  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErroCarga('');
    consultarHistoricoRefeicoes(controller.signal)
      .then((registros) => {
        if (!controller.signal.aborted) setHistorico(registros);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setErroCarga('Não foi possível carregar seu histórico. Tente novamente.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });
    return () => controller.abort();
  }, [tentativa]);

  useEffect(() => {
    setOpcoes([]);
    setErroOpcoes('');
    setCarregandoOpcoes(dataValida);
    if (!dataValida) return;
    const controller = new AbortController();
    consultarOpcoesRegistro(data, controller.signal)
      .then((lista) => {
        if (controller.signal.aborted) return;
        setOpcoes(lista);
        const inicial = lista.find((item) => item.id === opcaoPendente.current);
        opcaoPendente.current = '';
        if (inicial)
          setForm((anterior) => ({
            ...anterior,
            opcaoId: inicial.id,
            tipo: inicial.tipo,
          }));
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setErroOpcoes('Não foi possível carregar as refeições desta data.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoOpcoes(false);
      });
    return () => controller.abort();
  }, [data, dataValida, tentativaOpcoes]);
  const selecionada = opcoes.find((item) => item.id === form.opcaoId);
  const analise = selecionada?.avaliacao;
  const registrosMes = historico
    .filter((item) => item.data.slice(0, 7) === form.data.slice(0, 7))
    .sort(
      (a, b) =>
        b.data.localeCompare(a.data) ||
        b.registradoEm.localeCompare(a.registradoEm),
    );
  const mes =
    /^\d{4}-\d{2}-\d{2}$/.test(form.data) &&
    Number.isFinite(Date.parse(form.data))
      ? new Date(`${form.data}T12:00:00`).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })
      : 'período selecionado';
  function alterar(
    campo: 'data' | 'tipo' | 'opcaoId' | 'observacoes',
    valor: string,
  ) {
    if (campo === 'data' || campo === 'tipo') opcaoPendente.current = '';
    if (campo === 'data') {
      setOpcoes([]);
      setCarregandoOpcoes(true);
    }
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
      ...(campo === 'tipo' || campo === 'data' ? { opcaoId: '' } : {}),
      requisicaoId: crypto.randomUUID(),
    }));
    setErros((anterior) => ({ ...anterior, [campo]: undefined }));
    setMensagem('');
    setErroEnvio('');
    setConcluido(false);
  }
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueio.current || concluido || carregandoOpcoes || erroOpcoes) return;
    const validacao = validarRegistro(form);
    setErros(validacao);
    setErroEnvio('');
    setMensagem('');
    const primeiro = Object.keys(validacao)[0];
    if (primeiro) {
      document.getElementById(`registro-${primeiro}`)?.focus();
      return;
    }
    bloqueio.current = true;
    setEnviando(true);
    try {
      const registro = await registrarRefeicao(form);
      setHistorico((anterior) => [
        registro,
        ...anterior.filter((item) => item.id !== registro.id),
      ]);
      setConcluido(true);
      setMensagem('Refeição registrada com sucesso.');
    } catch (erro) {
      if (erro instanceof ErroApi && erro.campos) setErros(erro.campos);
      setErroEnvio(
        erro instanceof ErroApi
          ? erro.message
          : 'Não foi possível registrar a refeição. Seus dados foram mantidos. Tente novamente.',
      );
    } finally {
      bloqueio.current = false;
      setEnviando(false);
    }
  }
  async function editar(item: RegistroRefeicao) {
    const observacoes = window.prompt('Observações do registro', item.observacoes);
    if (observacoes === null) return;
    try {
      const atualizado = await atualizarRegistro(item.id, observacoes.trim().slice(0, 500));
      setHistorico((anterior) => anterior.map((r) => (r.id === atualizado.id ? atualizado : r)));
      setMensagem('Registro atualizado.');
    } catch {
      setErroEnvio('Não foi possível atualizar o registro. Tente novamente.');
    }
  }
  async function excluir(item: RegistroRefeicao) {
    if (!window.confirm(`Excluir o registro de ${formatarData(item.data)} (${item.nomeRefeicao})?`)) return;
    try {
      await excluirRegistro(item.id);
      setHistorico((anterior) => anterior.filter((r) => r.id !== item.id));
      setMensagem('Registro excluído.');
    } catch {
      setErroEnvio('Não foi possível excluir o registro. Tente novamente.');
    }
  }
  const atributos = (campo: keyof ErrosRegistro) => ({
    'aria-invalid': Boolean(erros[campo]),
    'aria-describedby': erros[campo] ? `registro-${campo}-erro` : undefined,
  });
  const erro = (campo: keyof ErrosRegistro) =>
    erros[campo] ? (
      <span className="erro-campo" id={`registro-${campo}-erro`}>
        {erros[campo]}
      </span>
    ) : null;
  return (
    <main className="pagina-registro-refeicoes">
      <a
        className="registro-voltar"
        href="#/colaborador"
        aria-label="Voltar ao menu do colaborador"
      >
        ←
      </a>
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <h1 tabIndex={-1}>Registro de refeições</h1>
      <p className="registro-introducao">
        Registre o que você consumiu e acompanhe seu histórico alimentar.
      </p>
      {carregando ? (
        <p role="status">Carregando histórico…</p>
      ) : erroCarga ? (
        <div>
          <p role="alert">{erroCarga}</p>
          <button
            className="registro-repetir"
            onClick={() => setTentativa((valor) => valor + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={enviar} aria-busy={enviando}>
          <div className="registro-paineis">
            <section
              className="registro-painel"
              aria-labelledby="nova-refeicao"
            >
              <h2 id="nova-refeicao">Nova refeição</h2>
              <fieldset disabled={enviando}>
                <legend className="visualmente-oculto">
                  Informações do consumo
                </legend>
                <div className="registro-dupla">
                  <div className="registro-campo">
                    <label htmlFor="registro-data">Data</label>
                    <input
                      id="registro-data"
                      type="date"
                      value={form.data}
                      max={hojeSaoPaulo()}
                      {...atributos('data')}
                      onChange={(e) => alterar('data', e.target.value)}
                    />
                    {erro('data')}
                  </div>
                  <div className="registro-campo">
                    <label htmlFor="registro-tipo">Tipo de refeição</label>
                    <select
                      id="registro-tipo"
                      value={form.tipo}
                      {...atributos('tipo')}
                      onChange={(e) =>
                        alterar('tipo', e.target.value as TipoRefeicao)
                      }
                    >
                      {['Café da manhã', 'Almoço', 'Lanche', 'Jantar'].map(
                        (item) => (
                          <option key={item}>{item}</option>
                        ),
                      )}
                    </select>
                    {erro('tipo')}
                  </div>
                </div>
                <div className="registro-campo">
                  <label htmlFor="registro-opcaoId">Refeição selecionada</label>
                  <select
                    id="registro-opcaoId"
                    value={form.opcaoId}
                    disabled={carregandoOpcoes || Boolean(erroOpcoes) || !dataValida}
                    {...atributos('opcaoId')}
                    onChange={(e) => alterar('opcaoId', e.target.value)}
                  >
                    <option value="">Selecione a refeição consumida</option>
                    {opcoes
                      .filter((item) => item.tipo === form.tipo)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.prato.nome}
                        </option>
                      ))}
                  </select>
                  {erro('opcaoId')}
                  {carregandoOpcoes && <p role="status">Carregando refeições…</p>}
                  {erroOpcoes && (
                    <>
                      <p role="alert">{erroOpcoes}</p>
                      <button
                        type="button"
                        className="registro-repetir"
                        onClick={() => setTentativaOpcoes((valor) => valor + 1)}
                      >
                        Tentar novamente
                      </button>
                    </>
                  )}
                  {dataValida && !carregandoOpcoes && !erroOpcoes && !opcoes.some((item) => item.tipo === form.tipo) && (
                    <p className="registro-nota">
                      Nenhuma opção disponível para este tipo de refeição.
                    </p>
                  )}
                </div>
                {analise && (
                  <div
                    className={`registro-compatibilidade ${analise.alertas.length || analise.incompleto ? 'registro-atencao' : ''}`}
                    role="status"
                  >
                    {analise.alertas.length
                      ? analise.alertas.join(' ')
                      : analise.incompleto
                        ? 'Informações incompletas; confirme os ingredientes.'
                        : 'Compatível nos dados informados.'}
                    {selecionada?.prato.nutricional &&
                      ` · Porção de ${selecionada.prato.nutricional.porcaoGramas} g`}
                  </div>
                )}
                <div className="registro-campo">
                  <label htmlFor="registro-observacoes">
                    Observações (opcional)
                  </label>
                  <input
                    id="registro-observacoes"
                    value={form.observacoes}
                    maxLength={500}
                    placeholder="Ex.: Porção completa, sem alterações."
                    {...atributos('observacoes')}
                    onChange={(e) => alterar('observacoes', e.target.value)}
                  />
                  {erro('observacoes')}
                </div>
              </fieldset>
            </section>
            <section
              className="registro-painel"
              aria-labelledby="historico-refeicoes"
            >
              <h2 id="historico-refeicoes">Minhas refeições registradas</h2>
              <p className="registro-nota">Últimos registros · {mes}</p>
              {registrosMes.length ? (
                <table className="registro-tabela">
                  <thead>
                    <tr>
                      <th scope="col">Data / registro</th>
                      <th scope="col">Refeição consumida</th>
                      <th scope="col">Energia</th>
                      <th scope="col">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosMes.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {formatarData(item.data)} ·{' '}
                          {new Date(item.registradoEm).toLocaleTimeString(
                            'pt-BR',
                            {
                              timeZone: 'America/Sao_Paulo',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </td>
                        <td>
                          {item.tipo} · {item.nomeRefeicao}
                          {item.observacoes && (
                            <span className="registro-observacao">{item.observacoes}</span>
                          )}
                        </td>
                        <td>
                          {item.energia === null
                            ? 'Não informada'
                            : `${item.energia.toLocaleString('pt-BR')} kcal`}
                        </td>
                        <td className="registro-tabela-acoes">
                          <button type="button" onClick={() => void editar(item)}>
                            Editar
                          </button>
                          <button type="button" onClick={() => void excluir(item)}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="registro-vazio">
                  Nenhuma refeição registrada neste mês.
                </p>
              )}
              <p className="registro-nota">
                {registrosMes.length} registro(s) exibido(s).{' '}
                {historico.some((item) => item.data === hojeSaoPaulo())
                  ? 'Você já registrou consumo hoje.'
                  : 'Nenhum consumo registrado hoje.'}
              </p>
            </section>
          </div>
          <footer className="registro-rodape">
            <div>
              <p>
                Resumo da seleção:{' '}
                {selecionada?.prato.nutricional
                  ? selecionada.prato.nutricional.nutrientes
                      .map(
                        (item) =>
                          `${item.quantidade.toLocaleString('pt-BR')} ${item.unidade}${item.nome === 'Proteínas' ? ' de proteínas' : item.nome === 'Carboidratos' ? ' de carboidratos' : ''}`,
                      )
                      .join(' · ')
                  : 'Informações nutricionais não disponíveis.'}
              </p>
              <p className="registro-nota">
                Confirme ingredientes, possíveis traços e orientações adicionais
                com o serviço de alimentação.
              </p>
            </div>
            <div className="registro-acoes">
              <button
                type="button"
                className="registro-cancelar"
                disabled={enviando}
                onClick={() => {
                  window.location.hash = '/colaborador';
                }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={enviando || concluido || carregandoOpcoes || Boolean(erroOpcoes)}>
                {enviando
                  ? 'Registrando…'
                  : concluido
                    ? 'Refeição registrada'
                    : 'Registrar refeição'}
              </button>
            </div>
          </footer>
          <p role="status" className="registro-feedback">
            {mensagem}
          </p>
          {erroEnvio && (
            <p role="alert" className="erro-envio">
              {erroEnvio}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
