// Destino provisório até a definição da próxima tela do fluxo da organização.
export default function InicioOrganizacao({ nome }: { nome: string }) {
  return (
    <main className="tela-pendente">
      <header className="marca" aria-label="NutriCorp">NutriCorp</header>
      <h1 tabIndex={-1}>Área da organização</h1>
      <p>Olá, {nome || 'Organização'}!</p>
      <p>As próximas funcionalidades estarão disponíveis em breve.</p>
      <a className="acao-colaborador" href="#/login">Voltar ao login</a>
    </main>
  );
}
