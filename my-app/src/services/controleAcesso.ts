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
  aprovado: boolean;
}

function paraTela({ id, nomeCompleto, setor, codigoFuncionario, ativo, aprovado }: ColaboradorApi): ColaboradorAcesso {
  const acesso = !aprovado ? 'Aguardando aprovação' : ativo ? 'Funcionário' : 'Sem acesso';
  return { id, nome: nomeCompleto, setor, codigoFuncionario, acesso };
}

export async function gerarSenhaTemporaria(id: string): Promise<string> {
  const { senhaTemporaria } = await chamarApi<{ senhaTemporaria: string }>(
    `/organizacao/colaboradores/${encodeURIComponent(id)}/senha`,
    { metodo: 'POST' },
  );
  return senhaTemporaria;
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
