import jwt from 'jsonwebtoken';
import type { Config } from '../config.js';
import { PERFIS_ACESSO, type PerfilAcesso } from '../dominio/valores.js';

export interface DadosToken {
  id: string;
  perfil: PerfilAcesso;
  membro?: boolean;
}

export function criarServicoTokens(config: Config) {
  const validadeSegundos = Math.round(config.tokenValidadeHoras * 3600);
  return {
    emitir({ id, perfil, membro }: DadosToken) {
      const token = jwt.sign({ perfil, ...(membro && { membro }) }, config.jwtSegredo, {
        subject: id,
        expiresIn: validadeSegundos,
        algorithm: 'HS256',
      });
      const expiraEm = new Date(Date.now() + validadeSegundos * 1000).toISOString();
      return { token, expiraEm };
    },
    verificar(token: string): DadosToken | null {
      try {
        const dados = jwt.verify(token, config.jwtSegredo, {
          algorithms: ['HS256'],
        });
        if (typeof dados === 'string' || !dados.sub) return null;
        const perfil = dados.perfil as PerfilAcesso;
        if (!PERFIS_ACESSO.includes(perfil)) return null;
        return { id: dados.sub, perfil, membro: dados.membro === true };
      } catch {
        return null;
      }
    },
  };
}

export type ServicoTokens = ReturnType<typeof criarServicoTokens>;
