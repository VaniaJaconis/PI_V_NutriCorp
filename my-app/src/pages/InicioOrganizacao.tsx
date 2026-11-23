import '../styles/inicio-organizacao.css';

export default function InicioOrganizacao({
  nome,
  papel,
  onSair,
}: {
  nome: string;
  papel: 'rh' | 'cozinha';
  onSair: () => void;
}) {
  return (
    <main className="inicio-organizacao">
      <header className="marca" aria-label="NutriCorp">
        NutriCorp
      </header>
      <h1 tabIndex={-1}>Olá, {nome.trim() || 'Nome do Usuário'}!</h1>
      <p className="inicio-papel">Perfil: {papel === 'rh' ? 'RH' : 'Cozinha'}</p>
      <nav className="organizacao-menu" aria-label="Menu da organização">
        {papel === 'rh' && (
          <a className="organizacao-acao" href="#/organizacao/acessos">
            Controle de Acesso
          </a>
        )}
        <a className="organizacao-acao" href="#/organizacao/cardapios">
          Cardápios e Refeições
        </a>
        <a className="organizacao-acao" href="#/organizacao/indicadores">
          Indicadores
        </a>
      </nav>
      <button className="sessao-sair" type="button" onClick={onSair}>Sair</button>
      <a className="inicio-alterar-senha" href="#/organizacao/senha">Alterar senha</a>
    </main>
  );
}
