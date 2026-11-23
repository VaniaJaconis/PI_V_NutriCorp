import { useRef, useState, type FormEvent } from 'react';
import { cadastrarColaborador } from '../services/colaboradores';
import { ErroApi } from '../services/api';
import type { ResultadoLogin } from '../types/autenticacao';
import type { NovoColaborador } from '../types/colaborador';
import {
  formatarCpf,
  validarCadastro,
  type ErrosCadastro,
} from '../validation/cadastro';

const vazio: NovoColaborador = {
  nomeCompleto: '',
  cpf: '',
  empresa: '',
  setor: '',
  codigoFuncionario: '',
  emailCorporativo: '',
  senha: '',
};

const campos = [
  { nome: 'nomeCompleto', titulo: 'Nome Completo', autocomplete: 'name' },
  { nome: 'cpf', titulo: 'CPF', autocomplete: 'off' },
  { nome: 'empresa', titulo: 'Empresa (CNPJ ou nome cadastrado)', autocomplete: 'organization' },
  { nome: 'setor', titulo: 'Setor', autocomplete: 'off' },
  {
    nome: 'codigoFuncionario',
    titulo: 'Código de Funcionário',
    autocomplete: 'off',
  },
  {
    nome: 'emailCorporativo',
    titulo: 'E-mail Corporativo',
    autocomplete: 'email',
  },
  { nome: 'senha', titulo: 'Senha', autocomplete: 'new-password' },
] as const;

interface Props {
  onCadastroConcluido?: (resultado: ResultadoLogin) => void;
}

export default function CadastroColaborador({ onCadastroConcluido }: Props) {
  const [dados, setDados] = useState<NovoColaborador>(vazio);
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [estado, setEstado] = useState<
    'inicial' | 'enviando' | 'sucesso' | 'erro'
  >('inicial');
  const [mensagem, setMensagem] = useState('');
  const enviando = useRef(false);

  function alterar(campo: keyof NovoColaborador, valor: string) {
    setDados((anterior) => ({
      ...anterior,
      [campo]: campo === 'cpf' ? formatarCpf(valor) : valor,
    }));
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
    if (estado === 'erro') {
      setEstado('inicial');
      setMensagem('');
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;
    const novosErros = validarCadastro(dados);
    setErros(novosErros);
    const primeiro = campos.find((campo) => novosErros[campo.nome]);
    if (primeiro) {
      document.getElementById(primeiro.nome)?.focus();
      return;
    }
    enviando.current = true;
    setEstado('enviando');
    setMensagem('');
    try {
      const resultado = await cadastrarColaborador({
        nomeCompleto: dados.nomeCompleto.trim(),
        cpf: dados.cpf.replace(/\D/g, ''),
        empresa: dados.empresa.trim(),
        setor: dados.setor.trim(),
        codigoFuncionario: dados.codigoFuncionario.trim(),
        emailCorporativo: dados.emailCorporativo.trim(),
        senha: dados.senha,
      });
      setDados(vazio);
      setEstado('sucesso');
      setMensagem('Cadastro realizado com sucesso.');
      onCadastroConcluido?.(resultado);
    } catch (erro) {
      setEstado('erro');
      if (erro instanceof ErroApi && erro.campos) {
        setErros(erro.campos);
        const campo = campos.find(({ nome }) => erro.campos?.[nome]);
        if (campo) document.getElementById(campo.nome)?.focus();
      }
      setMensagem(erro instanceof ErroApi ? erro.message : 'Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      enviando.current = false;
    }
  }

  return (
    <main className="cadastro">
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <section className="cadastro-conteudo" aria-labelledby="titulo-cadastro">
        <h1 id="titulo-cadastro" tabIndex={-1}>
          Cadastro
        </h1>
        {estado === 'sucesso' ? (
          <div className="sucesso" role="status">
            <p>{mensagem}</p>
            <button
              type="button"
              onClick={() => {
                setEstado('inicial');
                setMensagem('');
              }}
            >
              Voltar ao cadastro
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={enviar} aria-busy={estado === 'enviando'}>
            <fieldset disabled={estado === 'enviando'}>
              <legend className="visualmente-oculto">
                Dados do colaborador
              </legend>
              {campos.map(({ nome, titulo, autocomplete }) => (
                <div className="campo" key={nome}>
                  <label className="visualmente-oculto" htmlFor={nome}>
                    {titulo}
                  </label>
                  <input
                    id={nome}
                    name={nome}
                    placeholder={titulo}
                    type={
                      nome === 'senha'
                        ? 'password'
                        : nome === 'emailCorporativo'
                          ? 'email'
                          : 'text'
                    }
                    inputMode={nome === 'cpf' ? 'numeric' : undefined}
                    autoComplete={autocomplete}
                    required
                    value={dados[nome]}
                    maxLength={
                      nome === 'cpf' ? 14 : nome === 'senha' ? 128 : 200
                    }
                    aria-invalid={Boolean(erros[nome])}
                    aria-describedby={erros[nome] ? `${nome}-erro` : undefined}
                    onChange={(evento) => alterar(nome, evento.target.value)}
                    onBlur={() =>
                      setErros((anteriores) => ({
                        ...anteriores,
                        [nome]: validarCadastro(dados)[nome],
                      }))
                    }
                  />
                  {erros[nome] && (
                    <span className="erro-campo" id={`${nome}-erro`}>
                      {erros[nome]}
                    </span>
                  )}
                </div>
              ))}
              <button className="criar" type="submit">
                {estado === 'enviando' ? 'Criando…' : 'Criar'}
              </button>
            </fieldset>
            {estado === 'erro' && (
              <p className="erro-envio" role="alert">
                {mensagem}
              </p>
            )}
            <span className="visualmente-oculto" role="status">
              {estado === 'enviando' ? 'Enviando cadastro.' : ''}
            </span>
          </form>
        )}
      </section>
    </main>
  );
}
