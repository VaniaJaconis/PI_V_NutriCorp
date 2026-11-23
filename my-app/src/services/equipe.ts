import { chamarApi } from './api';

export type PapelEquipe = 'rh' | 'cozinha';

export interface MembroEquipe {
  id: string;
  nome: string;
  email: string;
  papel: PapelEquipe;
  ativo: boolean;
  titular: boolean;
}

export function consultarEquipe(): Promise<MembroEquipe[]> {
  return chamarApi('/organizacao/equipe');
}

export function adicionarMembro(dados: {
  nome: string;
  email: string;
  papel: PapelEquipe;
}): Promise<{ membro: MembroEquipe; senhaTemporaria: string }> {
  return chamarApi('/organizacao/equipe', { metodo: 'POST', corpo: dados });
}

export function alterarMembro(id: string, ativo: boolean): Promise<MembroEquipe> {
  return chamarApi(`/organizacao/equipe/${encodeURIComponent(id)}`, { metodo: 'PATCH', corpo: { ativo } });
}

export async function gerarSenhaMembro(id: string): Promise<string> {
  const { senhaTemporaria } = await chamarApi<{ senhaTemporaria: string }>(
    `/organizacao/equipe/${encodeURIComponent(id)}/senha`,
    { metodo: 'POST' },
  );
  return senhaTemporaria;
}
