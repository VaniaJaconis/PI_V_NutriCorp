import { useEffect, useRef, useState, type FormEvent } from 'react';
import { entrar } from '../services/autenticacao';
import { ErroApi } from '../services/api';
import type { ResultadoLogin } from '../types/autenticacao';
import '../styles/login.css';

interface Props {
  onEntrar: (resultado: ResultadoLogin) => void;
  mensagemSessao: string;
}
export default function Login({ onEntrar, mensagemSessao }: Props) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ usuario?: string; senha?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const bloqueio = useRef(false);
  const ativo = useRef(true);
  useEffect(() => {
    ativo.current = true;
    return () => {
      ativo.current = false;
    };
  }, []);
  useEffect(() => {
    if (erroEnvio && !enviando) document.getElementById('login-senha')?.focus();
  }, [erroEnvio, enviando]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueio.current) return;
    const novosErros = {
      usuario: !usuario.trim() ? 'Informe seu usuário.' : undefined,
      senha: !senha ? 'Informe sua senha.' : undefined,
    };
    setErros(novosErros);
    setErroEnvio('');
    if (novosErros.usuario || novosErros.senha) {
      document
        .getElementById(novosErros.usuario ? 'login-usuario' : 'login-senha')
        ?.focus();
      return;
    }
    bloqueio.current = true;
    setEnviando(true);
    try {
      const resultado = await entrar({ usuario: usuario.trim(), senha });
      if (!ativo.current) return;
      setSenha('');
      onEntrar(resultado);
    } catch (erro) {
      if (!ativo.current) return;
      setErroEnvio(
        erro instanceof ErroApi
          ? erro.message
          : 'Não foi possível entrar. Tente novamente.',
      );
      setSenha('');
    } finally {
      bloqueio.current = false;
      if (ativo.current) setEnviando(false);
    }
  }

  return (
    <main className="pagina-login">
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <h1 tabIndex={-1}>Login</h1>
      {mensagemSessao && <p className="erro-envio" role="status">{mensagemSessao}</p>}
      <form noValidate onSubmit={enviar} aria-busy={enviando}>
        <fieldset disabled={enviando}>
          <legend className="visualmente-oculto">Dados de acesso</legend>
          <div className="campo">
            <label className="visualmente-oculto" htmlFor="login-usuario">
              E-mail cadastrado
            </label>
            <input
              id="login-usuario"
              name="usuario"
              type="email"
              placeholder="E-mail cadastrado"
              autoComplete="username"
              required
              maxLength={254}
              value={usuario}
              aria-invalid={Boolean(erros.usuario)}
              aria-describedby={
                erros.usuario ? 'login-usuario-erro' : undefined
              }
              onChange={(e) => {
                setUsuario(e.target.value);
                setErros((anterior) => ({ ...anterior, usuario: undefined }));
                setErroEnvio('');
              }}
            />
            {erros.usuario && (
              <span className="erro-campo" id="login-usuario-erro">
                {erros.usuario}
              </span>
            )}
          </div>
          <div className="campo">
            <label className="visualmente-oculto" htmlFor="login-senha">
              Senha
            </label>
            <input
              id="login-senha"
              name="senha"
              type="password"
              placeholder="Senha"
              autoComplete="current-password"
              required
              maxLength={128}
              value={senha}
              aria-invalid={Boolean(erros.senha)}
              aria-describedby={erros.senha ? 'login-senha-erro' : undefined}
              onChange={(e) => {
                setSenha(e.target.value);
                setErros((anterior) => ({ ...anterior, senha: undefined }));
                setErroEnvio('');
              }}
            />
            {erros.senha && (
              <span className="erro-campo" id="login-senha-erro">
                {erros.senha}
              </span>
            )}
          </div>
          <button className="login-entrar" type="submit">
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </fieldset>
        <span className="visualmente-oculto" role="status">
          {enviando ? 'Verificando acesso.' : ''}
        </span>
        {erroEnvio && (
          <p className="erro-envio" role="alert">
            {erroEnvio}
          </p>
        )}
      </form>
      <p className="login-esqueci">
        Esqueceu a senha? Peça ao RH da sua organização uma senha temporária.
      </p>
      <nav className="login-cadastros" aria-label="Opções de cadastro">
        <a
          href="#/cadastro"
          aria-disabled={enviando}
          tabIndex={enviando ? -1 : undefined}
          onClick={(e) => {
            if (enviando) e.preventDefault();
          }}
        >
          Cadastrar
          <br />
          usuário
        </a>
        <a
          href="#/organizacao/cadastro"
          aria-disabled={enviando}
          tabIndex={enviando ? -1 : undefined}
          onClick={(e) => {
            if (enviando) e.preventDefault();
          }}
        >
          Cadastrar
          <br />
          Organização
        </a>
      </nav>
    </main>
  );
}
