interface Props { titulo: string; }

// Substituir cada destino pela tela correspondente quando o layout for fornecido.
export default function OrganizacaoPendente({ titulo }: Props) {
  return (
    <main className="tela-pendente">
      <header className="marca" aria-label="NutriCorp">NutriCorp</header>
      <h1 tabIndex={-1}>{titulo}</h1>
      <p>Esta tela estará disponível em breve.</p>
      <a className="organizacao-acao" href="#/organizacao">Voltar ao menu da organização</a>
    </main>
  );
}
