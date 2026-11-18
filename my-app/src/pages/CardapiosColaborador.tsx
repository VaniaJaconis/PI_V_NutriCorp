import { useEffect, useState } from 'react';
import { consultarCardapios } from '../services/cardapios';
import { consultarPreferencias } from '../services/preferencias';
import { avaliarCompatibilidade } from '../validation/compatibilidade';
import type { Refeicao } from '../types/cardapio';
import type { PreferenciasColaborador } from '../types/preferencias';
import '../styles/cardapios.css';

export default function CardapiosColaborador() {
  const refeicaoInicialId = new URLSearchParams(
    window.location.hash.split('?')[1],
  ).get('refeicao');
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [preferencias, setPreferencias] =
    useState<PreferenciasColaborador | null>(null);
  const [refeicaoId, setRefeicaoId] = useState('');
  const [pratoId, setPratoId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    Promise.all([consultarCardapios(), consultarPreferencias()])
      .then(([lista, perfil]) => {
        if (!ativo) return;
        setRefeicoes(lista);
        setPreferencias(perfil);
        const inicial =
          lista.find((item) => item.id === refeicaoInicialId) ?? lista[0];
        setRefeicaoId(inicial?.id ?? '');
        setPratoId(inicial?.pratos[0]?.id ?? '');
      })
      .catch(() => {
        if (ativo)
          setErro(
            'Não foi possível carregar os cardápios e suas preferências. Tente novamente.',
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa, refeicaoInicialId]);

  const refeicao = refeicoes.find((item) => item.id === refeicaoId);
  const prato = refeicao?.pratos.find((item) => item.id === pratoId);
  const compatibilidade =
    prato && preferencias ? avaliarCompatibilidade(prato, preferencias) : null;

  return (
    <main className="pagina-cardapios">
      <a
        className="cardapios-voltar"
        href="#/colaborador"
        aria-label="Voltar ao início"
      >
        <svg
          viewBox="0 0 24 24"
          width="23"
          height="23"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m12 8-4 4 4 4M8 12h8" />
        </svg>
      </a>
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <h1 className="visualmente-oculto" tabIndex={-1}>
        Cardápios
      </h1>
      <p className="cardapios-demonstracao">
        Cardápio e valores nutricionais demonstrativos.
      </p>
      {carregando ? (
        <p role="status">Carregando cardápios…</p>
      ) : erro ? (
        <div className="cardapios-erro">
          <p role="alert">{erro}</p>
          <button
            type="button"
            onClick={() => setTentativa((valor) => valor + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="cardapios-colunas">
            <section aria-labelledby="titulo-refeicoes">
              <h2 id="titulo-refeicoes">Refeições</h2>
              <div className="cardapios-painel">
                {refeicoes.length === 0 ? (
                  <p className="cardapios-vazio">
                    Nenhuma refeição disponível.
                  </p>
                ) : (
                  <ul className="cardapios-lista">
                    {refeicoes.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-pressed={item.id === refeicaoId}
                          onClick={() => {
                            setRefeicaoId(item.id);
                            setPratoId(item.pratos[0]?.id ?? '');
                          }}
                        >
                          {item.titulo}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <section aria-labelledby="titulo-pratos">
              <h2 id="titulo-pratos">Cardápio</h2>
              <div className="cardapios-painel">
                {!refeicao ? (
                  <p className="cardapios-vazio">Selecione uma refeição.</p>
                ) : !refeicao.pratos.length ? (
                  <p className="cardapios-vazio">
                    Nenhum prato cadastrado para esta refeição.
                  </p>
                ) : (
                  <ul className="cardapios-lista">
                    {refeicao.pratos.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-pressed={item.id === pratoId}
                          onClick={() => setPratoId(item.id)}
                        >
                          {item.nome}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <section aria-labelledby="titulo-ingredientes">
              <h2 id="titulo-ingredientes">Ingredientes</h2>
              <div className="cardapios-painel">
                {!prato ? (
                  <p className="cardapios-vazio">Selecione um prato.</p>
                ) : !prato.ingredientes.length ? (
                  <p className="cardapios-vazio">
                    Ingredientes não informados.
                  </p>
                ) : (
                  <ul className="cardapios-lista cardapios-ingredientes">
                    {prato.ingredientes.map((item, indice) => (
                      <li key={`${item}-${indice}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <section aria-labelledby="titulo-nutricional">
              <h2 id="titulo-nutricional">Tabela Nutricional</h2>
              <div className="cardapios-painel cardapios-nutricao">
                {!prato ? (
                  <p className="cardapios-vazio">Selecione um prato.</p>
                ) : !prato.nutricional ||
                  !prato.nutricional.nutrientes.length ? (
                  <p className="cardapios-vazio">
                    Informações nutricionais não disponíveis.
                  </p>
                ) : (
                  <table>
                    <caption>
                      {prato.nome} — porção de {prato.nutricional.porcaoGramas}{' '}
                      g
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Nutriente</th>
                        <th scope="col">Por porção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prato.nutricional.nutrientes.map((item) => (
                        <tr key={item.nome}>
                          <th scope="row">{item.nome}</th>
                          <td>
                            {item.quantidade.toLocaleString('pt-BR', {
                              maximumFractionDigits: 2,
                            })}{' '}
                            {item.unidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
          {refeicao && (
            <a
              className="cardapios-ver-compatibilidade"
              href={`#/colaborador/compatibilidade?refeicao=${encodeURIComponent(refeicao.id)}`}
            >
              Ver compatibilidade da refeição
            </a>
          )}
          <div
            className="cardapios-compatibilidade"
            role="status"
            aria-atomic="true"
          >
            {prato && compatibilidade && (
              <>
                <h2>Informações de compatibilidade — {prato.nome}</h2>
                {compatibilidade.alertas.length > 0 && (
                  <ul className="cardapios-alertas">
                    {compatibilidade.alertas.map((alerta) => (
                      <li key={alerta}>{alerta}</li>
                    ))}
                  </ul>
                )}
                {compatibilidade.incompleto ? (
                  <p className="cardapios-alertas">
                    Informações incompletas. Confirme os ingredientes e as
                    condições de preparo com o serviço de alimentação.
                  </p>
                ) : (
                  compatibilidade.alertas.length === 0 && (
                    <p>
                      Nenhuma incompatibilidade identificada nos dados
                      cadastrados.
                    </p>
                  )
                )}
                <p className="cardapios-nota">
                  Os alertas consideram o perfil e as restrições marcadas.
                  Alimentos a evitar e orientações em texto livre precisam ser
                  confirmados com o serviço de alimentação. Confira ingredientes
                  e possíveis traços antes de consumir.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}
