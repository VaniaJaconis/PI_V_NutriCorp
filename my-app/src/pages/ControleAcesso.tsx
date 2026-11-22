import { useEffect, useState } from 'react';
import {
  atualizarAcesso,
  consultarAcessos,
} from '../services/controleAcesso';
import {
  perfisAcesso,
  type ColaboradorAcesso,
  type PerfilAcesso,
} from '../types/controleAcesso';
import '../styles/controle-acesso.css';

export default function ControleAcesso({ nome }: { nome: string }) {
  const [colaboradores, setColaboradores] = useState<ColaboradorAcesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState('');
  const [erroAtualizacao, setErroAtualizacao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [atualizandoId, setAtualizandoId] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErroCarga('');
    consultarAcessos()
      .then((resultado) => {
        if (ativo) setColaboradores(resultado);
      })
      .catch(() => {
        if (ativo)
          setErroCarga(
            'Não foi possível carregar os acessos. Tente novamente.',
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  async function alterarAcesso(id: string, acesso: PerfilAcesso) {
    if (atualizandoId) return;
    setAtualizandoId(id);
    setErroAtualizacao('');
    setMensagem('');
    try {
      const resultado = await atualizarAcesso(id, acesso);
      setColaboradores((anteriores) =>
        anteriores.map((item) =>
          item.id === resultado.colaborador.id ? resultado.colaborador : item,
        ),
      );
      setMensagem(
        resultado.modo === 'simulado'
          ? 'Acesso atualizado nesta sessão de demonstração.'
          : 'Acesso atualizado com sucesso.',
      );
    } catch (erro) {
      setErroAtualizacao(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível atualizar o acesso. Tente novamente.',
      );
    } finally {
      setAtualizandoId('');
    }
  }

  return (
    <main className="pagina-controle-acesso">
      <a
        className="controle-acesso-voltar"
        href="#/organizacao"
        aria-label="Voltar ao menu da organização"
      >
        <svg
          viewBox="0 0 24 24"
          width="27"
          height="27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m13 7-5 5 5 5M8 12h9" />
        </svg>
      </a>
      <header className="controle-acesso-cabecalho">
        <div className="marca" aria-label="NutriCorp">
          NutriCorp
        </div>
        <h1 tabIndex={-1}>Olá, {nome.trim() || 'Nome do Usuário'}!</h1>
      </header>

      <section
        className="controle-acesso-conteudo"
        aria-labelledby="titulo-controle-acesso"
      >
        <h2 id="titulo-controle-acesso">Controle de Acesso</h2>
        {mensagem && (
          <p className="controle-acesso-mensagem" role="status">
            {mensagem}
          </p>
        )}
        {erroAtualizacao && (
          <p className="controle-acesso-erro" role="alert">
            {erroAtualizacao}
          </p>
        )}
        {carregando ? (
          <p className="controle-acesso-feedback" role="status">
            Carregando colaboradores…
          </p>
        ) : erroCarga ? (
          <div className="controle-acesso-feedback">
            <p role="alert">{erroCarga}</p>
            <button
              type="button"
              onClick={() => setTentativa((valor) => valor + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="controle-acesso-tabela-rolagem">
            <table>
              <caption className="visualmente-oculto">
                Controle de acesso dos colaboradores da organização
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Setor</th>
                  <th scope="col">Acesso</th>
                  <th scope="col">Código de Funcionário</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((colaborador) => (
                  <tr key={colaborador.id}>
                    <td>{colaborador.nome}</td>
                    <td>{colaborador.setor}</td>
                    <td>
                      <label className="visualmente-oculto" htmlFor={colaborador.id}>
                        Nível de acesso de {colaborador.nome}
                      </label>
                      <select
                        id={colaborador.id}
                        value={colaborador.acesso}
                        disabled={Boolean(atualizandoId)}
                        onChange={(evento) => {
                          const acesso = perfisAcesso.find(
                            (perfil) => perfil === evento.target.value,
                          );
                          if (acesso)
                            void alterarAcesso(colaborador.id, acesso);
                        }}
                      >
                        {perfisAcesso.map((perfil) => (
                          <option key={perfil} value={perfil}>
                            {perfil}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{colaborador.codigoFuncionario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
