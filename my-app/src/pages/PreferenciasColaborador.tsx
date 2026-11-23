import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  consultarPreferencias,
  excluirPreferencias,
  salvarPreferencias,
} from '../services/preferencias';
import type {
  PerfilAlimentar,
  PreferenciasColaborador as Dados,
  RestricaoAlimentar,
} from '../types/preferencias';
import '../styles/preferencias.css';

const perfis: { valor: PerfilAlimentar; titulo: string }[] = [
  { valor: 'sem_preferencia', titulo: 'Sem preferência' },
  { valor: 'vegetariana', titulo: 'Vegetariana' },
  { valor: 'vegana', titulo: 'Vegana' },
  { valor: 'pescetariana', titulo: 'Pescetariana' },
];
const restricoes: { valor: RestricaoAlimentar; titulo: string }[] = [
  { valor: 'lactose', titulo: 'Lactose' },
  { valor: 'gluten', titulo: 'Glúten' },
  { valor: 'amendoim', titulo: 'Amendoim' },
  { valor: 'castanhas', titulo: 'Castanhas' },
  { valor: 'ovo', titulo: 'Ovo' },
  { valor: 'soja', titulo: 'Soja' },
];

export default function PreferenciasColaborador() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [consentimento, setConsentimento] = useState(false);
  const bloqueio = useRef(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    consultarPreferencias()
      .then((resultado) => {
        if (!ativo) return;
        setDados(resultado);
        setConsentimento(Boolean(resultado.consentimentoEm));
      })
      .catch(() => {
        if (ativo)
          setErro(
            'Não foi possível carregar suas preferências. Tente novamente.',
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function alterar(atualizacao: Partial<Dados>) {
    setDados((anterior) =>
      anterior ? { ...anterior, ...atualizacao } : anterior,
    );
    setErro('');
    setAviso('');
  }

  function alternarRestricao(valor: RestricaoAlimentar) {
    if (!dados) return;
    alterar({
      restricoes: dados.restricoes.includes(valor)
        ? dados.restricoes.filter((item) => item !== valor)
        : [...dados.restricoes, valor],
    });
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dados || bloqueio.current) return;
    if (!consentimento) {
      setErro('Autorize o uso destes dados para salvar.');
      document.getElementById('consentimento')?.focus();
      return;
    }
    bloqueio.current = true;
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const resultado = await salvarPreferencias({
        ...dados,
        alimentosEvitar: dados.alimentosEvitar.trim(),
        outrasOrientacoes: dados.outrasOrientacoes.trim(),
        consentimento,
      });
      setDados(resultado.preferencias);
      setAviso('Preferências salvas com sucesso.');
    } catch {
      setErro(
        'Não foi possível salvar suas preferências. Suas escolhas foram mantidas. Tente novamente.',
      );
    } finally {
      bloqueio.current = false;
      setSalvando(false);
    }
  }

  async function excluir() {
    if (bloqueio.current || !window.confirm('Excluir suas preferências e restrições?')) return;
    bloqueio.current = true;
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      setDados(await excluirPreferencias());
      setConsentimento(false);
      setAviso('Seus dados de preferências foram excluídos.');
    } catch {
      setErro('Não foi possível excluir seus dados. Tente novamente.');
    } finally {
      bloqueio.current = false;
      setSalvando(false);
    }
  }

  return (
    <main className="pagina-preferencias">
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <h1 tabIndex={-1}>Preferências e restrições alimentares</h1>
      <p className="preferencias-introducao">
        Personalize seu perfil para identificar opções compatíveis no cardápio.
      </p>
      {carregando ? (
        <p role="status">Carregando preferências…</p>
      ) : !dados ? (
        <div className="preferencias-carregamento-erro">
          <p role="alert">{erro}</p>
          <button
            type="button"
            onClick={() => setTentativa((valor) => valor + 1)}
          >
            Tentar novamente
          </button>
          <a href="#/colaborador">Voltar ao início</a>
        </div>
      ) : (
        <form onSubmit={enviar} aria-busy={salvando}>
          <fieldset className="preferencias-formulario" disabled={salvando}>
            <legend className="visualmente-oculto">
              Personalização alimentar
            </legend>
            <div className="preferencias-paineis">
              <section
                className="preferencias-painel"
                aria-labelledby="titulo-perfis"
              >
                <h2 id="titulo-perfis">Preferências alimentares</h2>
                <p id="ajuda-perfis">
                  Selecione o perfil que mais combina com sua alimentação.
                </p>
                <fieldset aria-describedby="ajuda-perfis">
                  <legend className="visualmente-oculto">
                    Perfil alimentar
                  </legend>
                  <div className="preferencias-opcoes perfis-opcoes">
                    {perfis.map(({ valor, titulo }) => (
                      <label className="preferencias-opcao" key={valor}>
                        <input
                          className="visualmente-oculto"
                          type="radio"
                          name="perfilAlimentar"
                          value={valor}
                          checked={dados.perfil === valor}
                          onChange={() => alterar({ perfil: valor })}
                        />
                        <span className="preferencias-opcao-conteudo">
                          <span
                            className="preferencias-marcador"
                            aria-hidden="true"
                          >
                            {dados.perfil === valor ? '✓' : '○'}
                          </span>
                          {titulo}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label
                  className="preferencias-rotulo"
                  htmlFor="alimentosEvitar"
                >
                  Alimentos que prefiro evitar
                </label>
                <input
                  id="alimentosEvitar"
                  value={dados.alimentosEvitar}
                  maxLength={500}
                  placeholder="Ex.: pimentão, cebola crua"
                  onChange={(e) => alterar({ alimentosEvitar: e.target.value })}
                />
                <p className="preferencias-nota">
                  Preferências não são tratadas como alergias.
                </p>
              </section>
              <section
                className="preferencias-painel"
                aria-labelledby="titulo-restricoes"
              >
                <h2 id="titulo-restricoes">Restrições e alergias</h2>
                <p id="ajuda-restricoes">
                  Marque todas as opções aplicáveis ao seu perfil.
                </p>
                <fieldset aria-describedby="ajuda-restricoes">
                  <legend className="visualmente-oculto">
                    Restrições e alergias
                  </legend>
                  <div className="preferencias-opcoes restricoes-opcoes">
                    {restricoes.map(({ valor, titulo }) => (
                      <label className="preferencias-opcao" key={valor}>
                        <input
                          className="visualmente-oculto"
                          type="checkbox"
                          name="restricoes"
                          value={valor}
                          checked={dados.restricoes.includes(valor)}
                          onChange={() => alternarRestricao(valor)}
                        />
                        <span className="preferencias-opcao-conteudo">
                          <span
                            className="preferencias-marcador"
                            aria-hidden="true"
                          >
                            {dados.restricoes.includes(valor) ? '✓' : '○'}
                          </span>
                          {titulo}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label
                  className="preferencias-rotulo"
                  htmlFor="outrasOrientacoes"
                >
                  Outras restrições ou orientações
                </label>
                <input
                  id="outrasOrientacoes"
                  value={dados.outrasOrientacoes}
                  maxLength={1000}
                  placeholder="Descreva outras restrições ou orientações"
                  onChange={(e) =>
                    alterar({ outrasOrientacoes: e.target.value })
                  }
                />
                <p className="preferencias-nota">
                  Confira os ingredientes e possíveis traços antes de consumir.
                </p>
              </section>
            </div>
            <footer className="preferencias-rodape">
              <p>Suas escolhas serão usadas nos alertas de compatibilidade.</p>
              <label className="preferencias-consentimento" htmlFor="consentimento">
                <input
                  id="consentimento"
                  type="checkbox"
                  checked={consentimento}
                  onChange={(e) => {
                    setConsentimento(e.target.checked);
                    setErro('');
                  }}
                />
                Autorizo o NutriCorp a usar estes dados de saúde apenas para gerar os
                alertas de compatibilidade. Minha organização só vê indicadores
                agregados, nunca minhas escolhas individuais. Posso excluir estes
                dados a qualquer momento.
              </label>
              <div className="preferencias-acoes">
                <button
                  type="button"
                  className="preferencias-cancelar"
                  onClick={() => {
                    window.location.hash = '/colaborador';
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="preferencias-salvar">
                  {salvando ? 'Salvando…' : 'Salvar preferências'}
                </button>
              </div>
              {dados.consentimentoEm && (
                <button type="button" className="preferencias-excluir" onClick={() => void excluir()}>
                  Excluir meus dados de preferências
                </button>
              )}
            </footer>
          </fieldset>
          <p className="preferencias-feedback" role="status">
            {salvando ? 'Salvando preferências…' : aviso}
          </p>
          {erro && (
            <p className="erro-envio" role="alert">
              {erro}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
