interface Props {
  nome: string;
}

export default function InicioColaborador({ nome }: Props) {
  return (
    <main className="inicio-colaborador">
      <header className="marca" aria-label="NutriCorp">NutriCorp</header>
      <h1 className="saudacao-colaborador" tabIndex={-1}>
        Olá, {nome.trim() || 'Nome do Usuário'}!
      </h1>
      <nav className="menu-colaborador" aria-label="Menu do colaborador">
        <a className="acao-colaborador" href="#/colaborador/preferencias">Preferência e Restrições</a>
        <a className="acao-colaborador" href="#/colaborador/cardapios">Cardápios</a>
      </nav>
    </main>
  );
}
