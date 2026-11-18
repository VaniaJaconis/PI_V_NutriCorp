import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { EstadoCardapio, FormularioCardapio } from '../types/cardapioOrganizacao';
import { consultarCardapioOrganizacao, salvarCardapioOrganizacao } from '../services/cardapiosOrganizacao';
import { validarCardapio, type ErrosCardapio } from '../validation/cardapioOrganizacao';
import '../styles/cadastro-cardapio.css';

const vazio = (nome: string): FormularioCardapio => ({ nome:'',data:'',refeicao:'Almoço',unidade: nome ? `${nome} · Unidade principal` : '',
  inicio:'11:30',fim:'14:00',preparacoes:'',ingredientes:'',alergenos:[],revisado:false,
  porcao:'450',energia:'',carboidratos:'',proteinas:'',gorduras:'',sodio:'' });
const alergenos = ['Leite','Ovo','Glúten','Soja','Amendoim','Castanhas'];
const nutrientes = [ ['energia','Energia','kcal'], ['carboidratos','Carboidratos','g'], ['proteinas','Proteínas','g'], ['gorduras','Gorduras','g'], ['sodio','Sódio','mg'] ] as const;

export default function CadastroCardapio({ nomeOrganizacao }: { nomeOrganizacao: string }) {
  const [dados,setDados] = useState<FormularioCardapio>(() => vazio(nomeOrganizacao));
  const [erros,setErros] = useState<ErrosCardapio>({});
  const [carregando,setCarregando] = useState(true);
  const [enviando,setEnviando] = useState<EstadoCardapio | null>(null);
  const [estado,setEstado] = useState<EstadoCardapio>('rascunho');
  const [alterado,setAlterado] = useState(false);
  const [erroCarga,setErroCarga] = useState('');
  const [erroEnvio,setErroEnvio] = useState('');
  const [mensagem,setMensagem] = useState('');
  const [tentativa,setTentativa] = useState(0);
  const bloqueio = useRef(false);
  useEffect(() => {
    let ativo = true; setCarregando(true); setErroCarga('');
    consultarCardapioOrganizacao().then(registro => {
      if (!ativo) return;
      if (registro) { setDados(registro.dados); setEstado(registro.estado); }
    }).catch(() => { if (ativo) setErroCarga('Não foi possível carregar o cardápio. Tente novamente.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]);

  function alterar(campo: keyof FormularioCardapio, valor: string | boolean | string[]) {
    setDados(anterior => ({ ...anterior, [campo]: valor,
      ...(campo === 'ingredientes' || campo === 'preparacoes' || campo === 'alergenos' ? { revisado:false } : {}) }));
    setErros(anterior => ({ ...anterior,[campo]:undefined })); setAlterado(true); setMensagem(''); setErroEnvio('');
  }
  async function salvar(destino: EstadoCardapio) {
    if (bloqueio.current) return;
    const validacao = validarCardapio(dados,destino); setErros(validacao); setMensagem(''); setErroEnvio('');
    const primeiro = Object.keys(validacao)[0];
    if (primeiro) { document.getElementById(`cardapio-${primeiro}`)?.focus(); return; }
    bloqueio.current = true; setEnviando(destino);
    try {
      const resultado = await salvarCardapioOrganizacao(dados,destino);
      setEstado(resultado.estado); setAlterado(false);
      setMensagem(resultado.modo === 'simulado'
        ? `${destino === 'publicado' ? 'Publicação' : 'Rascunho'} simulad${destino === 'publicado' ? 'a' : 'o'} com sucesso. Os dados ficam apenas nesta demonstração e são apagados ao recarregar.`
        : destino === 'publicado' ? 'Cardápio publicado com sucesso.' : 'Rascunho salvo com sucesso.');
    } catch { setErroEnvio('Não foi possível salvar o cardápio. Seus dados foram mantidos. Tente novamente.'); }
    finally { bloqueio.current = false; setEnviando(null); }
  }
  const erro = (campo: keyof FormularioCardapio) => erros[campo] ? <span className="erro-campo" id={`cardapio-${campo}-erro`}>{erros[campo]}</span> : null;
  const campo = (nome: Exclude<keyof FormularioCardapio,'alergenos'|'revisado'>, titulo: string, tipo='text', placeholder?: string) => <div className="cardapio-campo">
    <label htmlFor={`cardapio-${nome}`}>{titulo}</label>
    <input id={`cardapio-${nome}`} type={tipo} value={dados[nome]} placeholder={placeholder} maxLength={tipo === 'text' ? 2000 : undefined}
      min={tipo === 'number' ? (nome === 'porcao' ? '0.01' : '0') : undefined} step={tipo === 'number' ? 'any' : undefined}
      aria-invalid={Boolean(erros[nome])} aria-describedby={erros[nome] ? `cardapio-${nome}-erro` : undefined}
      onChange={e => alterar(nome,e.target.value)} />{erro(nome)}
  </div>;

  return <main className="pagina-cadastro-cardapio">
    <a className="cadastro-cardapio-voltar" href="#/organizacao" aria-label="Voltar ao menu da organização">←</a>
    <header className="marca" aria-label="NutriCorp">NutriCorp</header>
    <h1 tabIndex={-1}>Cadastro de cardápio</h1>
    <p className="cadastro-cardapio-introducao">Organize a oferta do dia, os ingredientes e as informações nutricionais.</p>
    {carregando ? <p role="status">Carregando cardápio…</p> : erroCarga ? <div><p role="alert">{erroCarga}</p><button className="cardapio-repetir" onClick={() => setTentativa(valor=>valor+1)}>Tentar novamente</button></div> :
      <form noValidate onSubmit={(evento: FormEvent<HTMLFormElement>) => { evento.preventDefault(); void salvar('publicado'); }} aria-busy={Boolean(enviando)}>
        <fieldset disabled={Boolean(enviando)}><legend className="visualmente-oculto">Cadastro do cardápio</legend>
          <div className="cadastro-cardapio-paineis">
            <section className="cadastro-cardapio-painel" aria-labelledby="dados-cardapio"><h2 id="dados-cardapio">Dados do cardápio</h2>
              {campo('nome','Nome do cardápio','text','Ex.: Almoço vegetariano')}
              <div className="cardapio-dupla">{campo('data','Data de oferta','date')}
                <div className="cardapio-campo"><label htmlFor="cardapio-refeicao">Refeição</label>
                  <select id="cardapio-refeicao" value={dados.refeicao} onChange={e=>alterar('refeicao',e.target.value)} aria-invalid={Boolean(erros.refeicao)}>
                    {['Café da manhã','Almoço','Lanche','Jantar'].map(item=><option key={item}>{item}</option>)}
                  </select>{erro('refeicao')}
                </div>
              </div>
              {campo('unidade','Organização / unidade','text','Ex.: NutriCorp · Unidade principal')}
              <div className="cardapio-dupla cardapio-horarios">{campo('inicio','Início da oferta','time')}{campo('fim','Fim da oferta','time')}</div>
            </section>
            <section className="cadastro-cardapio-painel" aria-labelledby="composicao-cardapio"><h2 id="composicao-cardapio">Composição da refeição</h2>
              {campo('preparacoes','Preparações','text','Ex.: Arroz integral, feijão, legumes e omelete')}
              {campo('ingredientes','Ingredientes e alergênicos','text','Informe os ingredientes e possíveis traços')}
              <fieldset className="cardapio-alergenos"><legend>Alérgenos declarados pelo responsável</legend>
                {alergenos.map(item=><label key={item}><input type="checkbox" checked={dados.alergenos.includes(item)} onChange={()=>alterar('alergenos',dados.alergenos.includes(item)?dados.alergenos.filter(valor=>valor!==item):[...dados.alergenos,item])} />{item}</label>)}
              </fieldset>
              <p className="cardapio-alergenos-resumo">Alérgenos declarados: {dados.alergenos.length ? dados.alergenos.join(' e ').toLowerCase() : 'nenhum marcado; revise os ingredientes e possíveis traços'}</p>
              <div className="cardapio-porcao">{campo('porcao','Informações nutricionais por porção (g)','number')}</div>
              <div className="cardapio-nutrientes">{nutrientes.map(([nome,titulo,unidade])=><div key={nome}>{campo(nome,`${titulo} (${unidade})`,'number')}</div>)}</div>
              <label className="cardapio-revisao"><input id="cardapio-revisado" type="checkbox" checked={dados.revisado} onChange={e=>alterar('revisado',e.target.checked)} aria-invalid={Boolean(erros.revisado)} aria-describedby={erros.revisado?'cardapio-revisado-erro':undefined} />Revisei os ingredientes e os alérgenos declarados, incluindo possíveis traços.</label>
              {erro('revisado')}
            </section>
          </div>
          <footer className="cadastro-cardapio-rodape"><p>{alterado ? 'Alterações não salvas' : estado === 'publicado' ? 'Publicado nesta demonstração' : 'Rascunho'} · Revise os alergênicos antes de publicar.</p>
            <div><button type="button" className="cardapio-salvar-rascunho" onClick={()=>void salvar('rascunho')}>{enviando==='rascunho'?'Salvando…':'Salvar rascunho'}</button>
              <button type="submit">{enviando==='publicado'?'Publicando…':'Publicar cardápio'}</button></div>
          </footer>
        </fieldset>
        <p className="cardapio-form-feedback" role="status">{mensagem}</p>{erroEnvio&&<p className="erro-envio" role="alert">{erroEnvio}</p>}
      </form>}
  </main>;
}
