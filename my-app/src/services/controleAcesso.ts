import type {
  ColaboradorAcesso,
  PerfilAcesso,
  ResultadoAtualizacaoAcesso,
} from '../types/controleAcesso';
import { chamarApi } from './api';

interface ColaboradorApi {
  id: string;
  nomeCompleto: string;
  setor: string;
  codigoFuncionario: string;
  ativo: boolean;
}

function paraTela({ id, nomeCompleto, setor, codigoFuncionario, ativo }: ColaboradorApi): ColaboradorAcesso {
  return { id, nome: nomeCompleto, setor, codigoFuncionario, acesso: ativo ? 'Funcionário' : 'Sem acesso' };
}

export async function consultarAcessos(): Promise<ColaboradorAcesso[]> {
  const colaboradores = await chamarApi<ColaboradorApi[]>('/organizacao/colaboradores');
  return colaboradores.map(paraTela);
}

export async function atualizarAcesso(
  id: string,
  acesso: PerfilAcesso,
): Promise<ResultadoAtualizacaoAcesso> {
  const colaborador = await chamarApi<ColaboradorApi>(`/organizacao/colaboradores/${encodeURIComponent(id)}`, {
    metodo: 'PATCH',
    corpo: { ativo: acesso === 'Funcionário' },
  });
  return { colaborador: paraTela(colaborador), modo: 'api' };
}
