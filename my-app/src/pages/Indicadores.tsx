import { useEffect, useState } from 'react';
import { consultarIndicadoresConsolidados } from '../services/indicadores';
import type { IndicadoresConsolidados } from '../types/indicadores';
import '../styles/indicadores.css';

export default function Indicadores() {
  const [dados, setDados] = useState<IndicadoresConsolidados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    consultarIndicadoresConsolidados()
      .then((resultado) => {
        if (ativo) setDados(resultado);
      })
      .catch(() => {
        if (ativo)
          setErro(
            'Não foi possível carregar os indicadores. Tente novamente.',
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const resumo = dados
    ? [
        { valor: dados.colaboradoresAtivos, titulo: 'Colaboradores ativos' },
        { valor: dados.refeicoesRegistradas, titulo: 'Refeições registradas' },
        { valor: dados.taxaAdesao, titulo: 'Taxa de adesão' },
        { valor: dados.cardapiosPublicados, titulo: 'Cardápios publicados' },
      ]
    : [
        { valor: null, titulo: 'Colaboradores ativos' },
        { valor: null, titulo: 'Refeições registradas' },
        { valor: null, titulo: 'Taxa de adesão' },
        { valor: null, titulo: 'Cardápios publicados' },
      ];

  return (
    <main className="pagina-indicadores">
      <a
        className="indicadores-voltar"
        href="#/organizacao"
        aria-label="Voltar ao menu da organização"
      >
        ←
      </a>
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <h1 tabIndex={-1}>Indicadores consolidados</h1>
      <p className="indicadores-introducao">
        Acompanhe a adesão e o consumo de refeições da organização.
      </p>

      <div className="indicadores-painel">
        {carregando ? (
          <p className="indicadores-status" role="status">
            Carregando indicadores…
          </p>
        ) : erro ? (
          <div className="indicadores-feedback">
            <p role="alert">{erro}</p>
            <button type="button" onClick={() => setTentativa((valor) => valor + 1)}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <section className="indicadores-resumo" aria-label="Resumo geral">
              {resumo.map((indicador) => (
                <article className="indicador-card" key={indicador.titulo}>
                  <strong>
                    {indicador.valor === null
                      ? '—'
                      : `${indicador.valor}${indicador.titulo === 'Taxa de adesão' ? '%' : ''}`}
                  </strong>
                  <span>{indicador.titulo}</span>
                </article>
              ))}
            </section>

            <div className="indicadores-detalhes">
              <section
                className="indicadores-grafico"
                aria-labelledby="titulo-registros"
              >
                <h2 id="titulo-registros">Refeições registradas por dia</h2>
                {dados?.registrosPorDia.length ? (
                  <div
                    className="grafico-barras"
                    role="img"
                    aria-label="Gráfico de refeições registradas por dia"
                  >
                    {dados.registrosPorDia.map((item) => (
                      <div className="grafico-coluna" key={item.dia}>
                        <div className="grafico-trilha">
                          <span
                            className="grafico-barra"
                            style={{ height: `${item.valor}%` }}
                            title={`${item.dia}: ${item.valor} refeições`}
                          />
                        </div>
                        <span className="grafico-dia">{item.dia}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="indicadores-vazio">Nenhum dado disponível.</p>
                )}
              </section>

              <section
                className="indicadores-compatibilidade"
                aria-labelledby="titulo-compatibilidade"
              >
                <h2 id="titulo-compatibilidade">
                  Compatibilidade das preferências
                </h2>
                {dados ? (
                  <div className="compatibilidade-lista">
                    {[
                      {
                        titulo: 'Compatíveis',
                        valor: dados.compatibilidade.compativeis,
                        classe: '',
                      },
                      {
                        titulo: 'Atendimento parcial',
                        valor: dados.compatibilidade.parciais,
                        classe: 'compatibilidade-parcial',
                      },
                      {
                        titulo: 'Incompatíveis',
                        valor: dados.compatibilidade.incompativeis,
                        classe: 'compatibilidade-baixa',
                      },
                    ].map((item) => (
                      <div className="compatibilidade-item" key={item.titulo}>
                        <div>
                          <span>{item.titulo}</span>
                          <strong>{item.valor}%</strong>
                        </div>
                        <div
                          className={`compatibilidade-trilha ${item.classe}`}
                        >
                          <span style={{ width: `${item.valor}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="indicadores-vazio">Nenhum dado disponível.</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}