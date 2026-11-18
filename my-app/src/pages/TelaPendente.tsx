interface Props {
  titulo: string;
  mensagem?: string;
}


export default function TelaPendente({ titulo, mensagem = 'Esta tela estará disponível em breve.' }: Props) {
  return (
    <main className="tela-pendente">
      <header className="marca" aria-label="NutriCorp">NutriCorp</header>
      <h1 tabIndex={-1}>{titulo}</h1>
      <p>{mensagem}</p>
      <a className="acao-colaborador" href="#/colaborador">Voltar ao início</a>
    </main>
  );
}
