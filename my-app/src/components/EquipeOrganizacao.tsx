import { useEffect, useState, type FormEvent } from 'react';
import { ErroApi } from '../services/api';
import {
  adicionarMembro,
  alterarMembro,
  consultarEquipe,
  gerarSenhaMembro,
  type MembroEquipe,
  type PapelEquipe,
} from '../services/equipe';

const nomePapel = (papel: PapelEquipe) => (papel === 'rh' ? 'RH' : 'Cozinha');

export default function EquipeOrganizacao() {
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [novo, setNovo] = useState({ nome: '', email: '', papel: 'cozinha' as PapelEquipe });

  useEffect(() => {
    consultarEquipe()
      .then(setEquipe)
      .catch(() => setErro('Não foi possível carregar a equipe.'))
      .finally(() => setCarregando(false));
  }, []);

  async function executar(acao: () => Promise<void>) {
    if (ocupado) return;
    setOcupado(true);
    setMensagem('');
    setErro('');
    try {
      await acao();
    } catch (e) {
      setErro(
        e instanceof ErroApi
          ? (e.campos && Object.values(e.campos)[0]) || e.message
          : 'Não foi possível concluir a ação. Tente novamente.',
      );
    } finally {
      setOcupado(false);
    }
  }

  function adicionar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void executar(async () => {
      const { membro, senhaTemporaria } = await adicionarMembro({
        nome: novo.nome.trim(),
        email: novo.email.trim(),
        papel: novo.papel,
      });
      setEquipe((anterior) => [...anterior, membro]);
      setNovo({ nome: '', email: '', papel: novo.papel });
      setMensagem(`${membro.nome} adicionado(a) como ${nomePapel(membro.papel)}. Senha temporária: ${senhaTemporaria}`);
    });
  }

  return (
    <section className="controle-acesso-conteudo" aria-labelledby="titulo-equipe">
      <h2 id="titulo-equipe">Equipe (RH e Cozinha)</h2>
      {mensagem && (
        <p className="controle-acesso-mensagem" role="status">
          {mensagem}
        </p>
      )}
      {erro && (
        <p className="controle-acesso-erro" role="alert">
          {erro}
        </p>
      )}
      <form className="equipe-form" onSubmit={adicionar}>
        <label className="visualmente-oculto" htmlFor="equipe-nome">Nome</label>
        <input
          id="equipe-nome"
          placeholder="Nome"
          required
          maxLength={200}
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
        />
        <label className="visualmente-oculto" htmlFor="equipe-email">E-mail</label>
        <input
          id="equipe-email"
          type="email"
          placeholder="E-mail"
          required
          maxLength={254}
          value={novo.email}
          onChange={(e) => setNovo({ ...novo, email: e.target.value })}
        />
        <label className="visualmente-oculto" htmlFor="equipe-papel">Perfil</label>
        <select
          id="equipe-papel"
          value={novo.papel}
          onChange={(e) => setNovo({ ...novo, papel: e.target.value as PapelEquipe })}
        >
          <option value="cozinha">Cozinha</option>
          <option value="rh">RH</option>
        </select>
        <button type="submit" disabled={ocupado}>
          Adicionar
        </button>
      </form>
      {carregando ? (
        <p className="controle-acesso-feedback" role="status">Carregando equipe…</p>
      ) : (
        <div className="controle-acesso-tabela-rolagem">
          <table>
            <caption className="visualmente-oculto">Equipe da organização</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Perfil</th>
                <th scope="col">Acesso</th>
                <th scope="col">Senha</th>
              </tr>
            </thead>
            <tbody>
              {equipe.map((membro) => (
                <tr key={membro.id}>
                  <td>{membro.nome}</td>
                  <td>{membro.email}</td>
                  <td>{nomePapel(membro.papel)}</td>
                  <td>
                    {membro.titular ? (
                      'Conta principal'
                    ) : (
                      <select
                        aria-label={`Acesso de ${membro.nome}`}
                        value={membro.ativo ? 'ativo' : 'inativo'}
                        disabled={ocupado}
                        onChange={(e) =>
                          void executar(async () => {
                            const atualizado = await alterarMembro(membro.id, e.target.value === 'ativo');
                            setEquipe((lista) => lista.map((m) => (m.id === atualizado.id ? atualizado : m)));
                            setMensagem('Acesso atualizado com sucesso.');
                          })
                        }
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Sem acesso</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {!membro.titular && (
                      <button
                        type="button"
                        className="controle-acesso-senha"
                        disabled={ocupado || !membro.ativo}
                        onClick={() =>
                          void executar(async () => {
                            const senha = await gerarSenhaMembro(membro.id);
                            setMensagem(`Senha temporária de ${membro.nome}: ${senha}. Repasse à pessoa.`);
                          })
                        }
                      >
                        Gerar senha temporária
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
