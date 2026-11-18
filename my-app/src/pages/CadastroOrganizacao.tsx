import { useRef, useState, type FormEvent } from 'react';
import type { NovaOrganizacao } from '../types/organizacao';
import { cadastrarOrganizacao } from '../services/organizacoes';
import { formatarCnpj, normalizarCnpj, validarOrganizacao, type ErrosOrganizacao } from '../validation/organizacao';
import '../styles/organizacao.css';

const vazio: NovaOrganizacao = { razaoSocial: '', cnpj: '', nomeFantasia: '', setor: '', emailComunicacao: '', senha: '' };
const campos = [
  { nome: 'razaoSocial', titulo: 'Razão Social', autocomplete: 'organization' },
  { nome: 'cnpj', titulo: 'CNPJ', autocomplete: 'off' },
  { nome: 'nomeFantasia', titulo: 'Nome Fantasia', autocomplete: 'off' },
  { nome: 'setor', titulo: 'Setor', autocomplete: 'off' },
  { nome: 'emailComunicacao', titulo: 'E-mail de comunicação', autocomplete: 'email' },
  { nome: 'senha', titulo: 'Senha', autocomplete: 'new-password' },
] as const;

interface Props { onCadastroConcluido?: (nomeFantasia: string) => void; }

export default function CadastroOrganizacao({ onCadastroConcluido }: Props) {
  const [dados, setDados] = useState<NovaOrganizacao>(vazio);
  const [erros, setErros] = useState<ErrosOrganizacao>({});
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'sucesso' | 'erro'>('inicial');
  const [mensagem, setMensagem] = useState('');
  const bloqueio = useRef(false);

  function alterar(campo: keyof NovaOrganizacao, valor: string) {
    setDados(anterior => ({ ...anterior, [campo]: campo === 'cnpj' ? formatarCnpj(valor) : valor }));
    setErros(anterior => ({ ...anterior, [campo]: undefined }));
    if (estado === 'erro') { setEstado('inicial'); setMensagem(''); }
  }
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueio.current) return;
    const resultado = validarOrganizacao(dados);
    setErros(resultado);
    const primeiro = campos.find(campo => resultado[campo.nome]);
    if (primeiro) { document.getElementById(`organizacao-${primeiro.nome}`)?.focus(); return; }
    bloqueio.current = true; setEstado('enviando'); setMensagem('');
    try {
      const cadastro = await cadastrarOrganizacao({
        razaoSocial: dados.razaoSocial.trim(), cnpj: normalizarCnpj(dados.cnpj),
        nomeFantasia: dados.nomeFantasia.trim(), setor: dados.setor.trim(),
        emailComunicacao: dados.emailComunicacao.trim(), senha: dados.senha,
      });
      setDados(vazio); setEstado('sucesso');
      setMensagem(cadastro.modo === 'simulado'
        ? 'Cadastro simulado concluído. Nenhuma organização foi criada e nenhum dado foi salvo.'
        : 'Organização cadastrada com sucesso.');
      onCadastroConcluido?.(dados.nomeFantasia.trim());
    } catch {
      setEstado('erro'); setMensagem('Não foi possível cadastrar a organização. Revise os dados ou tente novamente.');
    } finally { bloqueio.current = false; }
  }
  return (
    <main className="cadastro cadastro-organizacao">
      <header className="marca" aria-label="NutriCorp">NutriCorp</header>
      <section className="cadastro-conteudo" aria-labelledby="titulo-cadastro-organizacao">
        <h1 id="titulo-cadastro-organizacao" tabIndex={-1}>Cadastro<span className="visualmente-oculto"> da organização</span></h1>
        {estado === 'sucesso' ? <div className="sucesso">
          <p role="status">{mensagem}</p>
          <button type="button" onClick={() => {
            setEstado('inicial'); setMensagem(''); setErros({});
            window.requestAnimationFrame(() => document.getElementById('organizacao-razaoSocial')?.focus());
          }}>Voltar ao cadastro</button>
        </div> : <form noValidate onSubmit={enviar} aria-busy={estado === 'enviando'}>
          <fieldset disabled={estado === 'enviando'}>
            <legend className="visualmente-oculto">Dados da organização</legend>
            {campos.map(({ nome, titulo, autocomplete }) => {
              const id = `organizacao-${nome}`;
              return <div className="campo" key={nome}>
                <label className="visualmente-oculto" htmlFor={id}>{titulo}</label>
                <input id={id} name={nome} placeholder={titulo} required
                  type={nome === 'senha' ? 'password' : nome === 'emailComunicacao' ? 'email' : 'text'}
                  autoComplete={autocomplete} autoCapitalize={nome === 'cnpj' ? 'characters' : undefined}
                  spellCheck={nome === 'cnpj' ? false : undefined}
                  maxLength={nome === 'cnpj' ? 18 : nome === 'senha' ? 128 : 200}
                  value={dados[nome]} aria-invalid={Boolean(erros[nome])}
                  aria-describedby={erros[nome] ? `${id}-erro` : undefined}
                  onChange={e => alterar(nome, e.target.value)}
                  onBlur={() => setErros(anterior => ({ ...anterior, [nome]: validarOrganizacao(dados)[nome] }))} />
                {erros[nome] && <span className="erro-campo" id={`${id}-erro`}>{erros[nome]}</span>}
              </div>;
            })}
            <button type="submit" className="criar">{estado === 'enviando' ? 'Criando…' : 'Criar'}</button>
          </fieldset>
          <span className="visualmente-oculto" role="status">{estado === 'enviando' ? 'Enviando cadastro da organização.' : ''}</span>
          {estado === 'erro' && <p role="alert" className="erro-envio">{mensagem}</p>}
        </form>}
      </section>
    </main>
  );
}
