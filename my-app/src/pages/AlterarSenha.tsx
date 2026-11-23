import { useState, type FormEvent } from 'react';
import { ErroApi } from '../services/api';
import { alterarSenha } from '../services/autenticacao';

export default function AlterarSenha({ voltar }: { voltar: string }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');
    setErro('');
    if (novaSenha.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      await alterarSenha(senhaAtual, novaSenha);
      setSenhaAtual('');
      setNovaSenha('');
      setMensagem('Senha alterada com sucesso.');
    } catch (e) {
      setErro(
        e instanceof ErroApi
          ? (e.campos && Object.values(e.campos)[0]) || e.message
          : 'Não foi possível alterar a senha. Tente novamente.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="cadastro">
      <a className="sessao-sair alterar-senha-voltar" href={`#${voltar}`}>
        Voltar
      </a>
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <section className="cadastro-conteudo" aria-labelledby="titulo-senha">
        <h1 id="titulo-senha" tabIndex={-1}>
          Alterar senha
        </h1>
        <form noValidate onSubmit={enviar} aria-busy={enviando}>
          <fieldset disabled={enviando}>
            <legend className="visualmente-oculto">Alterar senha</legend>
            <div className="campo">
              <label className="visualmente-oculto" htmlFor="senha-atual">
                Senha atual
              </label>
              <input
                id="senha-atual"
                type="password"
                placeholder="Senha atual"
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>
            <div className="campo">
              <label className="visualmente-oculto" htmlFor="nova-senha">
                Nova senha
              </label>
              <input
                id="nova-senha"
                type="password"
                placeholder="Nova senha (mínimo 8 caracteres)"
                autoComplete="new-password"
                maxLength={128}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <button className="criar" type="submit">
              {enviando ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </fieldset>
          {mensagem && (
            <p className="sucesso" role="status">
              {mensagem}
            </p>
          )}
          {erro && (
            <p className="erro-envio" role="alert">
              {erro}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
