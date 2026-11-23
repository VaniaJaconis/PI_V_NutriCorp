import '../styles/colaborador.css';

interface Props {
  nome: string;
  onSair: () => void;
}

export default function InicioColaborador({ nome, onSair }: Props) {
  return (
    <main className="inicio-colaborador">
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <h1 className="saudacao-colaborador" tabIndex={-1}>
        Olá, {nome.trim() || 'Nome do Usuário'}!
      </h1>
      <nav className="menu-colaborador" aria-label="Menu do colaborador">
        <a className="acao-colaborador" href="#/colaborador/preferencias">
          Preferência e Restrições
        </a>
        <a className="acao-colaborador" href="#/colaborador/cardapios">
          Cardápios
        </a>
        <a className="acao-colaborador" href="#/colaborador/refeicoes">
          Registro de Refeições
        </a>
      </nav>
      <button className="sessao-sair" type="button" onClick={onSair}>Sair</button>
    </main>
  );
}
