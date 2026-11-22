import type {
  ColaboradorAcesso,
  PerfilAcesso,
  ResultadoAtualizacaoAcesso,
} from '../types/controleAcesso';

const dadosDemonstracao: ColaboradorAcesso[] = [
  {
    id: 'colaborador-123456789',
    nome: 'Mariana Oliveira',
    setor: 'Financeiro',
    acesso: 'Funcionário',
    codigoFuncionario: '123456789',
  },
  {
    id: 'colaborador-234567891',
    nome: 'Camila Ferreira',
    setor: 'N/A',
    acesso: 'Nutricionista',
    codigoFuncionario: '234567891',
  },
  {
    id: 'colaborador-345678912',
    nome: 'Patrícia Almeida',
    setor: 'RH',
    acesso: 'Administração',
    codigoFuncionario: '345678912',
  },
  {
    id: 'colaborador-456789123',
    nome: 'Claudio Souza',
    setor: 'Infra de TI',
    acesso: 'Sem acesso',
    codigoFuncionario: '456789123',
  },
  {
    id: 'colaborador-567891234',
    nome: 'Lucio Cezar',
    setor: 'RH',
    acesso: 'Funcionário',
    codigoFuncionario: '567891234',
  },
];

let colaboradores = structuredClone(dadosDemonstracao);

export function limparAcessosSimulados() {
  colaboradores = structuredClone(dadosDemonstracao);
}

// Substituir estas operações pelos endpoints autenticados da organização.
export async function consultarAcessos(): Promise<ColaboradorAcesso[]> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
  return structuredClone(colaboradores);
}

export async function atualizarAcesso(
  id: string,
  acesso: PerfilAcesso,
): Promise<ResultadoAtualizacaoAcesso> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
  const colaborador = colaboradores.find((item) => item.id === id);
  if (!colaborador) throw new Error('Colaborador não encontrado.');

  colaborador.acesso = acesso;
  return {
    colaborador: structuredClone(colaborador),
    modo: 'simulado',
  };
}
